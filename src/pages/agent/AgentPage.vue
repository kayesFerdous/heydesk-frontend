<template>
  <!-- The frame around the three settings sections: title, section tabs, and on
       wide screens the test chat beside the form, so a change can be tried at
       once. Each section (a child route) has its own form and Save. -->
  <section class="flex flex-col lg:h-full">
    <page-header
      title="Agent settings"
      subtitle="What your agent knows and how it talks. Changes go live on the next message."
    >
      <template #actions>
        <live-status :paused="suspended"></live-status>
        <button type="button" class="btn btn-secondary lg:hidden" @click="openTestChat">
          <ph-chat-circle-dots :size="18" class="text-brand"></ph-chat-circle-dots>
          Try your agent
        </button>
      </template>
      <template #tabs>
        <nav class="tabs" aria-label="Settings sections">
          <router-link
            v-for="section in sections"
            :key="section.to"
            :to="section.to"
            class="tab"
            active-class="tab-active"
          >
            {{ section.label }}
            <span v-if="gapsIn(section.to)" class="count count-attention" :aria-label="`${gapsIn(section.to)} to fill in`">
              {{ gapsIn(section.to) }}
            </span>
          </router-link>
        </nav>
      </template>
    </page-header>

    <load-error v-if="loadError" :message="loadError" @retry="load"></load-error>

    <div v-else-if="!config" class="px-5 py-8 sm:px-8" aria-hidden="true">
      <div class="skeleton h-5 w-40"></div>
      <div class="skeleton mt-5 h-10 w-full max-w-xl"></div>
      <div class="skeleton mt-4 h-10 w-full max-w-xl"></div>
      <div class="skeleton mt-4 h-24 w-full max-w-xl"></div>
    </div>

    <div v-else class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="px-5 pt-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto">
        <div class="max-w-2xl">
          <div
            v-if="missing.length"
            class="mb-8 flex gap-3 rounded-[var(--radius-panel)] border border-attention/20 bg-attention-tint px-4 py-3 text-sm"
            role="status"
          >
            <ph-list-checks :size="20" class="mt-px shrink-0 text-attention"></ph-list-checks>
            <div>
              <p class="font-semibold text-attention">
                {{ missing.length }} {{ missing.length === 1 ? 'thing' : 'things' }} left before your agent can answer everything
              </p>
              <ul class="mt-1 flex flex-col gap-0.5">
                <li v-for="item in missing" :key="item">
                  <router-link :to="fixLink(item)" class="text-ink hover:underline">{{ item }}</router-link>
                </li>
              </ul>
            </div>
          </div>

          <router-view v-slot="slotProps">
            <component :is="slotProps.Component"></component>
          </router-view>
        </div>
      </div>

      <aside class="hidden border-l border-hairline bg-wash lg:flex lg:min-h-0 lg:flex-col">
        <div class="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <div>
            <h2 class="text-sm font-semibold">Try your agent</h2>
            <p class="text-xs text-ink-soft">Exactly what a customer sees.</p>
          </div>
        </div>
        <div class="min-h-0 flex-1">
          <agent-chat v-if="publicKey" :key="chatKey" :public-key="publicKey"></agent-chat>
        </div>
      </aside>
    </div>
  </section>
</template>

<script>
import { PhChatCircleDots, PhListChecks } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import LoadError from '../../components/ui/LoadError.vue';
import AgentChat from '../../components/chat/AgentChat.vue';
import { whereToFix } from '../../lib/setup.js';

export default {
  components: { PageHeader, LiveStatus, LoadError, AgentChat, PhChatCircleDots, PhListChecks },
  data() {
    return {
      loadError: null,
      chatKey: 0,
      sections: [
        { to: '/agent/profile', label: 'Profile' },
        { to: '/agent/hours', label: 'Hours and hand-off' },
        { to: '/agent/answers', label: 'Answers and tone' },
      ],
    };
  },
  computed: {
    config() {
      return this.$store.getters['agent/config'];
    },
    missing() {
      return this.$store.getters['agent/missing'];
    },
    publicKey() {
      return this.$store.getters['agent/publicKey'];
    },
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
  },
  watch: {
    // A save changes the config: start a fresh test chat so it uses the new settings.
    config(next, previous) {
      if (previous) this.chatKey += 1;
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loadError = null;
      try {
        await Promise.all([
          this.$store.dispatch('agent/load'),
          this.$store.dispatch('agent/loadPresets'),
        ]);
      } catch (error) {
        this.loadError = error.message;
        return;
      }
      if (this.$store.getters['agent/noAgent']) {
        this.$router.replace('/setup');
      }
    },
    fixLink: whereToFix,
    // How many of the backend's gaps are filled in on this section.
    gapsIn(path) {
      return this.missing.filter((item) => whereToFix(item) === path).length;
    },
    openTestChat() {
      this.$store.commit('ui/setTestSheet', true);
    },
  },
};
</script>
