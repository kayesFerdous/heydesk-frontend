<template>
  <div class="flex items-start gap-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <PhTelegramLogo :size="20"></PhTelegramLogo>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="section-title">Telegram</h2>
        <span v-if="bot" class="chip bg-success-tint text-success">
          <PhCheckCircle :size="14" weight="bold"></PhCheckCircle>
          {{ t('connect.connected') }}
        </span>
      </div>

      <div v-if="loading" class="skeleton mt-2 h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="mt-1 text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">{{ t('common.tryAgain') }}</button>
      </p>

      <!-- Connected: share the link -->
      <div v-else-if="bot">
        <i18n-t keypath="telegram.connectedText" tag="p" class="mt-1 text-sm text-ink-soft" scope="global">
          <template #bot><span class="font-semibold text-ink">@{{ bot.username }}</span></template>
        </i18n-t>
        <div class="mt-5">
          <CopyField :label="t('telegram.link')" :value="bot.link" @copied="$emit('copied')"></CopyField>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <a :href="bot.link" target="_blank" rel="noopener" class="btn btn-secondary">
            <PhArrowSquareOut :size="18"></PhArrowSquareOut>
            {{ t('telegram.open') }}
          </a>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              {{ t('connect.disconnect') }}
            </button>
          </template>
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

        <!-- Alerts for the owner, in their own chat with the bot -->
        <div class="mt-5 border-t border-hairline pt-4">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <PhBell :size="16"></PhBell>
            {{ t('telegram.alerts') }}
          </p>
          <p v-if="bot.owner_linked" class="mt-0.5 text-sm text-ink-soft">{{ t('telegram.alertsOn') }}</p>
          <template v-else>
            <p class="mt-0.5 text-sm text-ink-soft">{{ t('telegram.alertsOff') }}</p>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <a :href="bot.owner_link" target="_blank" rel="noopener" class="btn btn-secondary">
                <PhArrowSquareOut :size="18"></PhArrowSquareOut>
                {{ t('telegram.getAlerts') }}
              </a>
              <button type="button" class="text-sm font-semibold text-brand hover:underline" @click="load">
                {{ t('telegram.sentIt') }}
              </button>
            </div>
            <i18n-t keypath="telegram.nothingHappens" tag="p" class="mt-4 text-sm text-ink-soft" scope="global">
              <template #bot><span class="font-semibold text-ink">@{{ bot.username }}</span></template>
            </i18n-t>
            <div class="mt-2">
              <CopyField :label="t('telegram.messageForBot')" :value="ownerCommand"></CopyField>
            </div>
          </template>
        </div>
      </div>

      <!-- Not connected, steps closed -->
      <div v-else-if="!open">
        <p class="mt-1 text-sm text-ink-soft">{{ t('telegram.intro') }}</p>
        <button type="button" class="btn btn-secondary mt-4" @click="open = true">{{ t('telegram.setUp') }}</button>
      </div>

      <!-- Not connected: two steps -->
      <ol v-else class="mt-3 flex flex-col gap-6">
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
          <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="close">{{ t('common.notNow') }}</button>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhBell, PhCheck, PhCheckCircle, PhCopy, PhTelegramLogo } from '@phosphor-icons/vue';

import CopyField from '../ui/CopyField.vue';
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
defineEmits(['copied']);
const { t } = useI18n();

const bot = ref(null);
const loading = ref(true);
const loadError = ref(null);
const open = ref(false);
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
  open.value = false;
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
