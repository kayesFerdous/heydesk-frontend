<template>
  <!-- The Telegram row's fields; the row's name and status come from the page. -->
  <div class="min-w-0">
      <div v-if="loading" class="skeleton h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
      </p>

      <!-- Connected: share the link -->
      <div v-else-if="bot" class="flex flex-col gap-5">
        <p class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-semibold">@{{ bot.username }}</span>
          <InfoTip :text="t('telegram.connectedText', { bot: '@' + bot.username })"></InfoTip>
        </p>
        <div>
          <CopyField :label="t('telegram.link')" :value="bot.link" @copied="$emit('copied')"></CopyField>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <a :href="bot.link" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
              <PhArrowSquareOut :size="16"></PhArrowSquareOut>
              {{ t('telegram.open') }}
            </a>
            <button v-if="!confirmingDisconnect" type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              {{ t('connect.disconnect') }}
            </button>
            <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
              <span>{{ t('telegram.disconnectWarning') }}</span>
              <button type="button" class="font-semibold text-danger hover:underline" :disabled="busy" @click="disconnect">
                {{ busy ? t('connect.disconnecting') : t('connect.disconnect') }}
              </button>
              <button type="button" class="font-semibold text-ink-soft hover:underline" @click="confirmingDisconnect = false">
                {{ t('common.keepIt') }}
              </button>
            </span>
          </div>
          <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
        </div>

        <!-- Alerts for the owner, in their own chat with the bot -->
        <div class="border-t border-hairline pt-5">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <PhBell :size="16"></PhBell>
            {{ t('telegram.alerts') }}
            <InfoTip :text="bot.owner_linked ? t('telegram.alertsOn') : t('telegram.alertsOff')"></InfoTip>
            <span v-if="bot.owner_linked" class="chip ml-1 bg-success-tint text-success">
              <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
              {{ t('common.on') }}
            </span>
          </p>
          <template v-if="!bot.owner_linked">
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <a :href="bot.owner_link" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                <PhArrowSquareOut :size="16"></PhArrowSquareOut>
                {{ t('telegram.getAlerts') }}
              </a>
              <button type="button" class="text-sm font-semibold text-brand hover:underline" @click="load">
                {{ t('telegram.sentIt') }}
              </button>
            </div>
            <!-- The way round a phone without the app, folded until needed. -->
            <details class="mt-4 text-sm">
              <summary class="cursor-pointer font-medium text-ink-soft hover:text-ink">{{ t('telegram.notWorking') }}</summary>
              <i18n-t keypath="telegram.nothingHappens" tag="p" class="mt-2 text-ink-soft" scope="global">
                <template #bot><span class="font-semibold text-ink">@{{ bot.username }}</span></template>
              </i18n-t>
              <div class="mt-2">
                <CopyField :label="t('telegram.messageForBot')" :value="ownerCommand"></CopyField>
              </div>
            </details>
          </template>
        </div>
      </div>


      <!-- Not connected: two steps, shown as soon as the row opens. -->
      <ol v-else class="flex flex-col gap-6">
        <li>
          <p class="text-sm font-semibold">{{ t('telegram.step1') }}</p>
          <p class="mt-0.5 text-sm text-ink-soft">{{ t('telegram.step1Text') }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="step in botFatherSteps"
              :key="step.value"
              type="button"
              class="copy-chip"
              :title="step.hint"
              @click="copy(step.value)"
            >
              <component :is="copied === step.value ? PhCheck : PhCopy" :size="14"></component>
              {{ step.value }}
            </button>
          </div>
          <p class="mt-2 text-xs text-ink-soft">{{ t('telegram.step1Hint', { alt: altUsername }) }}</p>
          <a href="https://t.me/BotFather" target="_blank" rel="noopener" class="btn btn-secondary mt-3">
            <PhArrowSquareOut :size="18"></PhArrowSquareOut>
            {{ t('telegram.openBotFather') }}
          </a>
        </li>

        <li>
          <label class="text-sm font-semibold" for="botfather-reply">{{ t('telegram.step2') }}</label>
          <p class="mt-0.5 text-sm text-ink-soft">{{ t('telegram.step2Text') }}</p>
          <textarea
            id="botfather-reply"
            v-model="pasted"
            class="field mt-3 !h-auto py-2.5"
            rows="3"
            placeholder="Done! Congratulations on your new bot... Use this token to access the HTTP API: ..."
            lang="en"
            :disabled="busy"
            @input="tryConnect"
          ></textarea>
          <p v-if="busy" class="mt-2 text-sm text-ink-soft" aria-live="polite">{{ t('telegram.connecting') }}</p>
          <p v-else-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
          <p v-else-if="pasted.trim() && !foundToken" class="mt-2 text-sm text-attention">
            {{ t('telegram.noToken') }}
          </p>
        </li>

        <li>
          <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="close(); $emit('close')">{{ t('common.notNow') }}</button>
        </li>
      </ol>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhBell, PhCheck, PhCheckCircle, PhCopy } from '@phosphor-icons/vue';

import CopyField from '../ui/CopyField.vue';
import InfoTip from '../ui/InfoTip.vue';
import {
  connectTelegram,
  disconnectTelegram,
  fetchTelegram,
  findBotToken,
  suggestUsername,
} from '../../api/telegram.js';

const props = defineProps({
  businessName: { type: String, default: '' },
});
// `change` tells the page the bot (or null), `close` that "Not now" was pressed.
const emit = defineEmits(['copied', 'change', 'close']);
const { t } = useI18n();

const bot = ref(null);
const loading = ref(true);
const loadError = ref(null);
const pasted = ref('');
const busy = ref(false);
const error = ref(null);
const copied = ref(null);
const confirmingDisconnect = ref(false);
let timer = null;

const username = computed(() => suggestUsername(props.businessName));
const altUsername = computed(() => username.value.replace(/_bot$/, '_dhaka_bot'));
// What to send BotFather. These stay in English: Telegram expects them so.
const botFatherSteps = computed(() => [
  { value: '/newbot', hint: t('telegram.hintCommand') },
  { value: props.businessName || 'My business', hint: t('telegram.hintName') },
  { value: username.value, hint: t('telegram.hintUsername') },
]);
// The same as the link: Telegram sends "/start <code>" when Start is tapped.
const ownerCommand = computed(() => `/start ${new URL(bot.value.owner_link).searchParams.get('start')}`);
const foundToken = computed(() => findBotToken(pasted.value));

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    bot.value = await fetchTelegram();
  } catch (err) {
    loadError.value = err.message;
  }
  loading.value = false;
}

function close() {
  pasted.value = '';
  error.value = null;
}

// Connects as soon as a whole token is in the box: no button to find.
async function tryConnect() {
  error.value = null;
  const botToken = foundToken.value;
  if (!botToken || busy.value) return;
  busy.value = true;
  try {
    bot.value = await connectTelegram(botToken);
    close();
  } catch (err) {
    error.value = err.fields?.token || err.message;
  }
  busy.value = false;
}

async function disconnect() {
  busy.value = true;
  error.value = null;
  try {
    await disconnectTelegram();
    bot.value = null;
    confirmingDisconnect.value = false;
  } catch (err) {
    error.value = err.message;
  }
  busy.value = false;
}

async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
    copied.value = value;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = null), 2000);
  } catch (err) {
    // Clipboard blocked: the words are on screen to type.
  }
}

watch(() => (loading.value ? undefined : bot.value), (value) => emit('change', value), { immediate: true });

load();
onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.copy-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.875rem;
  border: 1px solid var(--color-hairline);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color 0.2s var(--ease-settle);
}

.copy-chip:hover {
  background-color: var(--color-wash);
}

</style>
