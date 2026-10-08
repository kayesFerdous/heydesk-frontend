<template>
  <!-- Talk to the agent instead of typing. Idle: one Call button. During a
       call: how long it has run, mute, and a red End. -->
  <div class="flex items-center gap-2">
    <p v-if="error" class="max-w-[11rem] text-right text-xs leading-snug text-danger" role="alert">{{ error }}</p>

    <button v-if="state === 'idle'" type="button" class="btn btn-secondary" @click="call">
      <ph-phone :size="16" weight="bold"></ph-phone>
      Call
    </button>

    <template v-else>
      <span class="text-xs font-medium text-ink-soft" role="status">
        {{ state === 'connecting' ? 'Connecting' : clock }}
      </span>
      <button
        v-if="state === 'live'"
        type="button"
        class="btn btn-secondary btn-icon !rounded-full"
        :aria-label="muted ? 'Unmute' : 'Mute'"
        :aria-pressed="muted ? 'true' : 'false'"
        @click="toggleMute"
      >
        <ph-microphone-slash v-if="muted" :size="18" weight="bold" class="text-danger"></ph-microphone-slash>
        <ph-microphone v-else :size="18" weight="bold"></ph-microphone>
      </button>
      <button type="button" class="btn btn-danger" @click="hangUp()">
        <ph-phone-x :size="16" weight="bold"></ph-phone-x>
        End
      </button>
    </template>
  </div>
</template>

<script>
import { PhMicrophone, PhMicrophoneSlash, PhPhone, PhPhoneX } from '@phosphor-icons/vue';

import { fetchIceServers, sendOffer } from '../../api/voice.js';

export default {
  components: { PhMicrophone, PhMicrophoneSlash, PhPhone, PhPhoneX },
  props: {
    publicKey: { type: String, required: true },
  },
  data() {
    return {
      state: 'idle', // idle, connecting, live
      muted: false,
      seconds: 0,
      error: null,
    };
  },
  computed: {
    clock() {
      const minutes = Math.floor(this.seconds / 60);
      const rest = String(this.seconds % 60).padStart(2, '0');
      return `${minutes}:${rest}`;
    },
  },
  created() {
    // The connection, microphone and timers are not shown on screen, so they
    // live outside data() and Vue does not watch them.
    this.pc = null;
    this.mic = null;
    this.speaker = null;
    this.ping = null;
    this.timer = null;
  },
  beforeUnmount() {
    this.hangUp();
  },
  methods: {
    async call() {
      this.error = null;
      this.state = 'connecting';
      try {
        this.mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        this.state = 'idle';
        this.error = 'Allow the microphone to call.';
        return;
      }

      try {
        const iceServers = await fetchIceServers();
        const pc = new RTCPeerConnection({ iceServers });
        this.pc = pc;

        // The backend expects the microphone as the first transceiver.
        pc.addTransceiver(this.mic.getAudioTracks()[0], { direction: 'sendrecv' });
        this.speaker = new Audio();
        this.speaker.autoplay = true;
        pc.ontrack = (event) => {
          this.speaker.srcObject = event.streams[0] || new MediaStream([event.track]);
        };

        // A ping every second lets the server notice a closed tab.
        const channel = pc.createDataChannel('chat');
        this.ping = setInterval(() => channel.readyState === 'open' && channel.send('ping'), 1000);

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') this.started();
          if (pc.connectionState === 'failed') this.hangUp('The call dropped. Try again.');
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') this.hangUp();
        };

        // Wait for every ICE candidate, so one offer carries them all.
        await pc.setLocalDescription(await pc.createOffer());
        await new Promise((done) => {
          if (pc.iceGatheringState === 'complete') return done();
          pc.onicegatheringstatechange = () => pc.iceGatheringState === 'complete' && done();
        });

        const answer = await sendOffer(this.publicKey, pc.localDescription);
        if (this.pc !== pc) return; // ended while connecting
        await pc.setRemoteDescription(answer);
      } catch (error) {
        this.hangUp(error.message || 'The call could not connect. Try again.');
      }
    },
    started() {
      if (this.state === 'live') return;
      this.state = 'live';
      this.seconds = 0;
      this.timer = setInterval(() => (this.seconds += 1), 1000);
    },
    toggleMute() {
      this.muted = !this.muted;
      this.mic.getAudioTracks().forEach((track) => (track.enabled = !this.muted));
    },
    hangUp(error = null) {
      clearInterval(this.ping);
      clearInterval(this.timer);
      if (this.mic) this.mic.getTracks().forEach((track) => track.stop());
      if (this.pc) {
        this.pc.onconnectionstatechange = null;
        this.pc.close();
      }
      if (this.speaker) this.speaker.srcObject = null;
      this.pc = null;
      this.mic = null;
      this.speaker = null;
      this.state = 'idle';
      this.muted = false;
      this.error = error;
    },
  },
};
</script>
