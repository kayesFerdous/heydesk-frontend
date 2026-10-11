<template>
  <section>
    <PageHeader :title="t('channelsPage.title')" :subtitle="t('channelsPage.subtitle')"></PageHeader>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <div v-else class="max-w-3xl px-5 pb-12 sm:px-8">
      <!-- Website chat: always on, needs only the link -->
      <div class="panel p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-brand-tint text-brand" aria-hidden="true">
            <PhGlobe :size="20"></PhGlobe>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="section-title">{{ t('channelsPage.websiteChat') }}</h2>
              <LiveStatus v-if="agent.publicKey" :paused="auth.isSuspended" :label="t('common.on')"></LiveStatus>
            </div>
            <p class="mt-1 text-sm text-ink-soft">{{ t('channelsPage.websiteChatText') }}</p>

            <div v-if="agent.publicKey" class="mt-5">
              <CopyField :label="t('common.chatLink')" :value="link" @copied="onCopied"></CopyField>
              <a :href="link" target="_blank" rel="noopener" class="btn btn-quiet mt-3 -ml-2">
                <PhArrowSquareOut :size="18"></PhArrowSquareOut>
                {{ t('channelsPage.openChatPage') }}
              </a>
            </div>
            <div v-else class="mt-5 skeleton h-10 w-full" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <!-- Telegram: the business's own bot -->
      <div class="panel mt-4 p-5 sm:p-6">
        <TelegramConnect :business-name="agent.config?.business_name ?? ''" @copied="onCopied"></TelegramConnect>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhGlobe, PhArrowSquareOut } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import CopyField from '../../components/ui/CopyField.vue';
import TelegramConnect from '../../components/agent/TelegramConnect.vue';
import { chatLink } from '../../lib/presets.js';
import { markShared } from '../../lib/setup.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();

const loadError = ref(null);
const link = computed(() => chatLink(agent.publicKey));

async function load() {
  loadError.value = null;
  try {
    await agent.load();
  } catch (error) {
    loadError.value = error.message;
    return;
  }
  if (agent.noAgent) router.replace('/setup');
}

function onCopied() {
  if (auth.business) markShared(auth.business.id);
}

load();
</script>
