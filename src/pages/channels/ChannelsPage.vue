<template>
  <section class="page px-4 pt-5 pb-8 md:px-0 md:pt-2 md:pb-0">
    <PageHeader :title="t('channelsPage.title')" :tip="t('channelsPage.subtitle')" :subtitle="status"></PageHeader>

    <LoadError v-if="loadError" class="island" :message="loadError" @retry="load"></LoadError>

    <div v-else class="island px-4 py-2 sm:px-8 sm:py-4">
      <ul class="mx-auto max-w-3xl">
        <!-- Website chat: always on, needs only the link -->
        <ConnectionRow
          id="web"
          v-bind="logo('web')"
          :name="t('channelsPage.websiteChat')"
          :line="agent.publicKey ? bare(link) : t('channelsPage.about.web')"
          :live="live.web"
          :live-label="t('common.on')"
          :open="open === 'web'"
          @toggle="toggle('web')"
        >
          <div class="flex flex-col gap-4">
            <CopyField :label="t('common.chatLink')" :value="link" @copied="onCopied"></CopyField>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a :href="link" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                <PhArrowSquareOut :size="16"></PhArrowSquareOut>
                {{ t('channelsPage.openChatPage') }}
              </a>
              <router-link to="/agent/bubble" class="link inline-flex items-center gap-1.5 text-sm font-medium">
                <PhChatCircleDots :size="16"></PhChatCircleDots>
                {{ t('channelsPage.bubbleLink') }}
              </router-link>
            </div>
          </div>
        </ConnectionRow>

        <!-- Telegram: the business's own bot -->
        <ConnectionRow
          id="telegram"
          v-bind="logo('telegram')"
          name="Telegram"
          :line="telegram ? '@' + telegram.username : t('channelsPage.about.telegram')"
          :live="liveOf(telegram)"
          :open="open === 'telegram'"
          @toggle="toggle('telegram')"
        >
          <TelegramConnect :business-name="agent.config?.business_name ?? ''" @copied="onCopied" @change="telegram = $event" @close="open = null"></TelegramConnect>
        </ConnectionRow>

        <!-- Messenger: the business's Facebook Page -->
        <ConnectionRow
          id="messenger"
          v-bind="logo('messenger')"
          name="Messenger"
          :line="messenger ? bare(messenger.link) : t('channelsPage.about.messenger')"
          :live="liveOf(messenger)"
          :open="open === 'messenger'"
          @toggle="toggle('messenger')"
        >
          <MessengerConnect @copied="onCopied" @change="messenger = $event"></MessengerConnect>
        </ConnectionRow>

        <!-- WhatsApp: the business's own number -->
        <ConnectionRow
          id="whatsapp"
          v-bind="logo('whatsapp')"
          name="WhatsApp"
          :line="whatsapp ? t('whatsapp.numberId', { id: whatsapp.phone_id }) : t('channelsPage.about.whatsapp')"
          :live="liveOf(whatsapp)"
          :open="open === 'whatsapp'"
          @toggle="toggle('whatsapp')"
        >
          <WhatsAppConnect @change="whatsapp = $event"></WhatsAppConnect>
        </ConnectionRow>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhArrowSquareOut, PhChatCircleDots } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import ConnectionRow from '../../components/ui/ConnectionRow.vue';
import LoadError from '../../components/ui/LoadError.vue';
import CopyField from '../../components/ui/CopyField.vue';
import TelegramConnect from '../../components/agent/TelegramConnect.vue';
import MessengerConnect from '../../components/agent/MessengerConnect.vue';
import WhatsAppConnect from '../../components/agent/WhatsAppConnect.vue';
import { channelOf } from '../../lib/channels.js';
import { formatNumber } from '../../lib/format.js';
import { chatLink } from '../../lib/presets.js';
import { markShared } from '../../lib/setup.js';
import { useAuthStore } from '../../stores/auth.js';
import { useAgentStore } from '../../stores/agent.js';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const agent = useAgentStore();

const loadError = ref(null);

// What each connection says it is: undefined while it is still being asked for,
// null when not connected, else the account. The Connect components report it.
const telegram = ref(undefined);
const messenger = ref(undefined);
const whatsapp = ref(undefined);
// The website chat starts open: its link is what an owner comes here for most.
const open = ref('web');
const toggle = (id) => (open.value = open.value === id ? null : id);

const liveOf = (account) => (account === undefined ? null : !!account);
// A link as people read it, without its https://.
const bare = (address) => address.replace(/^https?:\/\//, '');
// A channel's logo in its own colour; the website chat is HeyDesk's own, so it
// takes HeyDesk's black.
function logo(id) {
  const { icon, avatar } = channelOf(id);
  return id === 'web' ? { icon, tile: 'bg-night text-white', weight: 'bold' } : { icon, tile: avatar };
}
const link = computed(() => chatLink(agent.publicKey));

const live = computed(() => ({
  web: agent.publicKey ? true : null,
  telegram: liveOf(telegram.value),
  messenger: liveOf(messenger.value),
  whatsapp: liveOf(whatsapp.value),
}));
const status = computed(() => {
  const values = Object.values(live.value);
  if (values.includes(null)) return '';
  return t('channelsPage.connectedCount', { n: formatNumber(values.filter(Boolean).length), total: formatNumber(values.length) });
});

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
