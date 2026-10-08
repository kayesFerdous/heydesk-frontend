<template>
  <div class="flex items-start gap-4">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
      <ph-telegram-logo :size="20"></ph-telegram-logo>
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="section-title">Telegram</h2>
        <span v-if="bot" class="chip bg-success-tint text-success">
          <ph-check-circle :size="14" weight="bold"></ph-check-circle>
          Connected
        </span>
      </div>

      <div v-if="loading" class="skeleton mt-2 h-4 w-64" aria-hidden="true"></div>

      <p v-else-if="loadError" class="mt-1 text-sm" role="alert">
        <span class="text-danger">{{ loadError }}</span>
        <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
      </p>

      <!-- Connected: share the link -->
      <div v-else-if="bot">
        <p class="mt-1 text-sm text-ink-soft">
          Customers message <span class="font-semibold text-ink">@{{ bot.username }}</span> and your agent answers.
          Share the link on your page, receipts or a sign at the counter.
        </p>
        <div class="mt-5">
          <copy-field label="Telegram link" :value="bot.link" @copied="$emit('copied')"></copy-field>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <a :href="bot.link" target="_blank" rel="noopener" class="btn btn-secondary">
            <ph-arrow-square-out :size="18"></ph-arrow-square-out>
            Open in Telegram
          </a>
          <template v-if="!confirmingDisconnect">
            <button type="button" class="text-sm font-semibold text-ink-soft hover:text-danger" @click="confirmingDisconnect = true">
              Disconnect
            </button>
          </template>
          <span v-else class="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span>Customers will stop getting replies there.</span>
            <button type="button" class="font-semibold text-danger hover:underline" :disabled="busy" @click="disconnect">
              {{ busy ? 'Disconnecting...' : 'Disconnect' }}
            </button>
            <button type="button" class="font-semibold text-ink-soft hover:underline" @click="confirmingDisconnect = false">
              Keep it
            </button>
          </span>
        </div>
        <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>

        <!-- Alerts for the owner, in their own chat with the bot -->
        <div class="mt-5 border-t border-hairline pt-4">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <ph-bell :size="16"></ph-bell>
            Alerts for you
          </p>
          <p v-if="bot.owner_linked" class="mt-0.5 text-sm text-ink-soft">
            New orders, messages and customers who want a person come to your Telegram. Reply to an alert to answer
            that customer yourself; the agent waits until you reply /done.
          </p>
          <template v-else>
            <p class="mt-0.5 text-sm text-ink-soft">
              Get new orders, messages and customers who want a person in your own Telegram, and answer them from there.
              Open this on a device with Telegram, then tap Start. Keep it to yourself.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <a :href="bot.owner_link" target="_blank" rel="noopener" class="btn btn-secondary">
                <ph-arrow-square-out :size="18"></ph-arrow-square-out>
                Get alerts in Telegram
              </a>
              <button type="button" class="text-sm font-semibold text-brand hover:underline" @click="load">
                I've sent it
              </button>
            </div>
            <p class="mt-4 text-sm text-ink-soft">
              Nothing happens? That button needs the Telegram app on this device. Instead, open
              <span class="font-semibold text-ink">@{{ bot.username }}</span> in Telegram on your phone, the web or
              desktop, and send it this message:
            </p>
            <div class="mt-2">
              <copy-field label="Message for your bot" :value="ownerCommand"></copy-field>
            </div>
          </template>
        </div>
      </div>

      <!-- Not connected, steps closed -->
      <div v-else-if="!open">
        <p class="mt-1 text-sm text-ink-soft">
          Let customers message your agent in Telegram, with your own bot. Takes about two minutes.
        </p>
        <button type="button" class="btn btn-secondary mt-4" @click="open = true">Set up Telegram</button>
      </div>

      <!-- Not connected: two steps -->
      <ol v-else class="mt-3 flex flex-col gap-6">
        <li>
          <p class="text-sm font-semibold">1. Make your bot</p>
          <p class="mt-0.5 text-sm text-ink-soft">
            Open BotFather, Telegram's own bot maker, and send it these three, one at a time. Tap one to copy it.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="step in botFatherSteps"
              :key="step.value"
              type="button"
              class="copy-chip"
              :title="step.hint"
              @click="copy(step.value)"
            >
              <component :is="copied === step.value ? 'ph-check' : 'ph-copy'" :size="14"></component>
              {{ step.value }}
            </button>
          </div>
          <p class="mt-2 text-xs text-ink-soft">
            First the command, then a name customers will see, then a username ending in "bot".
            If the username is taken, add a word, like {{ altUsername }}.
          </p>
          <a href="https://t.me/BotFather" target="_blank" rel="noopener" class="btn btn-secondary mt-3">
            <ph-arrow-square-out :size="18"></ph-arrow-square-out>
            Open BotFather
          </a>
        </li>

        <li>
          <label class="text-sm font-semibold" for="botfather-reply">2. Paste BotFather's reply</label>
          <p class="mt-0.5 text-sm text-ink-soft">
            Copy its whole last message and paste it here. HeyDesk finds the token in it and connects your bot.
          </p>
          <textarea
            id="botfather-reply"
            v-model="pasted"
            class="field mt-3 !h-auto py-2.5"
            rows="3"
            placeholder="Done! Congratulations on your new bot... Use this token to access the HTTP API: ..."
            :disabled="busy"
            @input="tryConnect"
          ></textarea>
          <p v-if="busy" class="mt-2 text-sm text-ink-soft" aria-live="polite">Connecting your bot...</p>
          <p v-else-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
          <p v-else-if="pasted.trim() && !foundToken" class="mt-2 text-sm text-attention">
            No token in that yet. It looks like 123456789:AAH... and comes in BotFather's last message.
          </p>
        </li>

        <li>
          <button type="button" class="text-sm font-semibold text-ink-soft hover:underline" @click="close">Not now</button>
        </li>
      </ol>
    </div>
  </div>
</template>

<script>
import { PhArrowSquareOut, PhBell, PhCheck, PhCheckCircle, PhCopy, PhTelegramLogo } from '@phosphor-icons/vue';

import CopyField from '../ui/CopyField.vue';
import {
  connectTelegram,
  disconnectTelegram,
  fetchTelegram,
  findBotToken,
  suggestUsername,
} from '../../api/telegram.js';

export default {
  components: { CopyField, PhArrowSquareOut, PhBell, PhCheck, PhCheckCircle, PhCopy, PhTelegramLogo },
  emits: ['copied'],
  props: {
    businessName: { type: String, default: '' },
  },
  data() {
    return {
      bot: null,
      loading: true,
      loadError: null,
      open: false,
      pasted: '',
      busy: false,
      error: null,
      copied: null,
      confirmingDisconnect: false,
      timer: null,
    };
  },
  computed: {
    username() {
      return suggestUsername(this.businessName);
    },
    altUsername() {
      return this.username.replace(/_bot$/, '_dhaka_bot');
    },
    botFatherSteps() {
      return [
        { value: '/newbot', hint: 'Starts a new bot' },
        { value: this.businessName || 'My business', hint: 'The name customers see' },
        { value: this.username, hint: 'Its username, ending in bot' },
      ];
    },
    // The same as the link: Telegram sends "/start <code>" when Start is tapped.
    ownerCommand() {
      return `/start ${new URL(this.bot.owner_link).searchParams.get('start')}`;
    },
    foundToken() {
      return findBotToken(this.pasted);
    },
  },
  created() {
    this.load();
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    async load() {
      this.loading = true;
      this.loadError = null;
      try {
        this.bot = await fetchTelegram(this.$store.getters['auth/token']);
      } catch (error) {
        this.loadError = error.message;
      }
      this.loading = false;
    },
    // Connects as soon as a whole token is in the box: no button to find.
    async tryConnect() {
      this.error = null;
      const botToken = this.foundToken;
      if (!botToken || this.busy) return;
      this.busy = true;
      try {
        this.bot = await connectTelegram(this.$store.getters['auth/token'], botToken);
        this.close();
      } catch (error) {
        this.error = (error.fields && error.fields.token) || error.message;
      }
      this.busy = false;
    },
    async disconnect() {
      this.busy = true;
      this.error = null;
      try {
        await disconnectTelegram(this.$store.getters['auth/token']);
        this.bot = null;
        this.confirmingDisconnect = false;
      } catch (error) {
        this.error = error.message;
      }
      this.busy = false;
    },
    close() {
      this.open = false;
      this.pasted = '';
      this.error = null;
    },
    async copy(value) {
      try {
        await navigator.clipboard.writeText(value);
        this.copied = value;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => (this.copied = null), 2000);
      } catch (error) {
        // Clipboard blocked: the words are on screen to type.
      }
    },
  },
};
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
