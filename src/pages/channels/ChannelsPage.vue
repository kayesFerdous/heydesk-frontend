<template>
  <section>
    <PageHeader :title="t('channelsPage.title')" :tip="t('channelsPage.subtitle')"></PageHeader>

    <LoadError v-if="loadError" :message="loadError" @retry="load"></LoadError>

    <div v-else class="max-w-4xl px-5 pb-12 sm:px-8">
      <!-- Website chat: always on, needs only the link -->
      <SettingsGroup :title="t('channelsPage.websiteChat')" :tip="t('channelsPage.websiteChatText')">
        <template v-if="agent.publicKey">
          <LiveStatus :paused="auth.isSuspended" :label="t('common.on')"></LiveStatus>
          <div>
            <CopyField :label="t('common.chatLink')" :value="link" @copied="onCopied"></CopyField>
            <a :href="link" target="_blank" rel="noopener" class="btn btn-quiet btn-sm mt-2 -ml-3">
              <PhArrowSquareOut :size="16"></PhArrowSquareOut>
              {{ t('channelsPage.openChatPage') }}
            </a>
          </div>
          <router-link to="/agent/bubble" class="link inline-flex items-center gap-1.5 text-sm font-medium">
            <PhChatCircleDots :size="16"></PhChatCircleDots>
            {{ t('channelsPage.bubbleLink') }}
          </router-link>
        </template>
        <div v-else class="skeleton h-10 w-full" aria-hidden="true"></div>
      </SettingsGroup>

      <!-- Telegram: the business's own bot -->
      <SettingsGroup title="Telegram" :tip="t('telegram.intro')">
        <TelegramConnect :business-name="agent.config?.business_name ?? ''" @copied="onCopied"></TelegramConnect>
      </SettingsGroup>

      <!-- Messenger: the business's Facebook Page -->
      <SettingsGroup title="Messenger" :tip="t('messenger.intro')">
        <MessengerConnect @copied="onCopied"></MessengerConnect>
      </SettingsGroup>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhChatCircleDots } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import LoadError from '../../components/ui/LoadError.vue';
import LiveStatus from '../../components/ui/LiveStatus.vue';
import CopyField from '../../components/ui/CopyField.vue';
import TelegramConnect from '../../components/agent/TelegramConnect.vue';
import MessengerConnect from '../../components/agent/MessengerConnect.vue';
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
