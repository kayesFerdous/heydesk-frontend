<template>
  <!-- Talk to the agent instead of typing. Idle: one Call button. During a
       call: how long it has run, mute, and a red End. -->
  <div class="flex items-center gap-2">
    <p v-if="error" class="max-w-[11rem] text-right text-xs leading-snug text-danger" role="alert">{{ error }}</p>

    <button v-if="state === 'idle'" type="button" class="btn btn-secondary" @click="call">
      <PhPhone :size="16" weight="bold"></PhPhone>
      {{ t('voice.call') }}
    </button>

    <template v-else>
      <span class="text-xs font-medium text-ink-soft" role="status">
        {{ state === 'connecting' ? t('voice.connecting') : clock }}
      </span>
      <button
        v-if="state === 'live'"
        type="button"
        class="btn btn-secondary btn-icon !rounded-full"
        :aria-label="muted ? t('voice.unmute') : t('voice.mute')"
        :aria-pressed="muted ? 'true' : 'false'"
        @click="toggleMute"
      >
        <PhMicrophoneSlash v-if="muted" :size="18" weight="bold" class="text-danger"></PhMicrophoneSlash>
        <PhMicrophone v-else :size="18" weight="bold"></PhMicrophone>
      </button>
      <button type="button" class="btn btn-danger" @click="hangUp()">
        <PhPhoneX :size="16" weight="bold"></PhPhoneX>
        {{ t('voice.end') }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhMicrophone, PhMicrophoneSlash, PhPhone, PhPhoneX } from '@phosphor-icons/vue';

import { fetchIceServers, sendOffer } from '../../api/voice.js';
import { formatNumber } from '../../lib/format.js';

const props = defineProps({
  publicKey: { type: String, required: true },
});
const { t } = useI18n();

const state = ref('idle'); // idle, connecting, live
const muted = ref(false);
const seconds = ref(0);
const error = ref(null);

// The connection, microphone and timers are not shown on screen, so they are
// plain variables that Vue does not watch.
let pc = null;
let mic = null;
let speaker = null;
let ping = null;
let timer = null;

const clock = computed(() => {
  const minutes = formatNumber(Math.floor(seconds.value / 60));
  const rest = formatNumber(seconds.value % 60).padStart(2, formatNumber(0));
  return `${minutes}:${rest}`;
});

async function call() {
  error.value = null;
  state.value = 'connecting';
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    state.value = 'idle';
    error.value = t('voice.allowMic');
    return;
  }

  try {
    const iceServers = await fetchIceServers();
    const connection = new RTCPeerConnection({ iceServers });
    pc = connection;

    // The backend expects the microphone as the first transceiver.
    connection.addTransceiver(mic.getAudioTracks()[0], { direction: 'sendrecv' });
    speaker = new Audio();
    speaker.autoplay = true;
    connection.ontrack = (event) => {
      speaker.srcObject = event.streams[0] || new MediaStream([event.track]);
    };

    // A ping every second lets the server notice a closed tab.
    const channel = connection.createDataChannel('chat');
    ping = setInterval(() => channel.readyState === 'open' && channel.send('ping'), 1000);

    connection.onconnectionstatechange = () => {
      const s = connection.connectionState;
      if (s === 'connected') started();
      if (s === 'failed') hangUp(t('voice.dropped'));
      if (s === 'disconnected' || s === 'closed') hangUp();
    };

    // Wait for every ICE candidate, so one offer carries them all.
    await connection.setLocalDescription(await connection.createOffer());
    await new Promise((done) => {
      if (connection.iceGatheringState === 'complete') return done();
      connection.onicegatheringstatechange = () => connection.iceGatheringState === 'complete' && done();
    });

    const answer = await sendOffer(props.publicKey, connection.localDescription);
    if (pc !== connection) return; // ended while connecting
    await connection.setRemoteDescription(answer);
  } catch (err) {
    hangUp(err.message || t('voice.couldNotConnect'));
  }
}

function started() {
  if (state.value === 'live') return;
  state.value = 'live';
  seconds.value = 0;
  timer = setInterval(() => (seconds.value += 1), 1000);
}

function toggleMute() {
  muted.value = !muted.value;
  mic.getAudioTracks().forEach((track) => (track.enabled = !muted.value));
}

function hangUp(message = null) {
  clearInterval(ping);
  clearInterval(timer);
  if (mic) mic.getTracks().forEach((track) => track.stop());
  if (pc) {
    pc.onconnectionstatechange = null;
    pc.close();
  }
  if (speaker) speaker.srcObject = null;
  pc = null;
  mic = null;
  speaker = null;
  state.value = 'idle';
  muted.value = false;
  error.value = message;
}

onBeforeUnmount(() => hangUp());
</script>
