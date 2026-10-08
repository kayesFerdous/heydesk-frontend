<template>
  <section>
    <page-header
      title="Channels"
      subtitle="Where customers reach your agent. It answers on each of these, day and night."
    ></page-header>

    <load-error v-if="loadError" :message="loadError" @retry="load"></load-error>

    <div v-else class="max-w-3xl px-5 pb-12 sm:px-8">
      <!-- Website chat: always on, needs only the link -->
      <div class="panel p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
            <ph-globe :size="20"></ph-globe>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="section-title">Website chat</h2>
              <live-status v-if="publicKey" :paused="suspended" label="On"></live-status>
            </div>
            <p class="mt-1 text-sm text-ink-soft">
              A chat page with your name on it. Put the link on your website, your Facebook page or
              your Google profile.
            </p>

            <div v-if="publicKey" class="mt-5">
              <copy-field label="Chat link" :value="link" @copied="onCopied"></copy-field>
              <a :href="link" target="_blank" rel="noopener" class="btn btn-quiet mt-3 -ml-2">
                <ph-arrow-square-out :size="18"></ph-arrow-square-out>
                Open the chat page
              </a>
            </div>
            <div v-else class="mt-5 skeleton h-10 w-full" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <!-- Telegram: the business's own bot -->
      <div class="panel mt-4 p-5 sm:p-6">
        <telegram-connect :business-name="businessName" @copied="onCopied"></telegram-connect>
      </div>
    </div>
  </section>
</template>

<script>
import { PhGlobe, PhArrowSquareOut } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import CopyField from '../../components/ui/CopyField.vue';
import TelegramConnect from '../../components/agent/TelegramConnect.vue';
import { chatLink } from '../../lib/presets.js';
import { markShared } from '../../lib/setup.js';

export default {
  components: { PageHeader, LoadError, LiveStatus, CopyField, TelegramConnect, PhGlobe, PhArrowSquareOut },
  data() {
    return { loadError: null };
  },
  computed: {
    publicKey() {
      return this.$store.getters['agent/publicKey'];
    },
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
    businessName() {
      const config = this.$store.getters['agent/config'];
      return config ? config.business_name : '';
    },
    link() {
      return chatLink(this.publicKey);
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loadError = null;
      try {
        await this.$store.dispatch('agent/load');
      } catch (error) {
        this.loadError = error.message;
        return;
      }
      if (this.$store.getters['agent/noAgent']) this.$router.replace('/setup');
    },
    onCopied() {
      const business = this.$store.getters['auth/business'];
      if (business) markShared(business.id);
    },
  },
};
</script>
