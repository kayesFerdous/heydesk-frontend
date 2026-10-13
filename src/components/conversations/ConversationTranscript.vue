<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button type="button" class="btn btn-quiet btn-icon lg:hidden" :aria-label="t('conversations.back')" @click="$emit('back')">
          <PhArrowLeft :size="20"></PhArrowLeft>
        </button>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-[-0.01em]">{{ name }}</h2>
          <p class="text-sm text-ink-soft">
            {{ channel.long }}, {{ when }}
          </p>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div
        v-if="conversation.status === 'needs_human'"
        class="notice mx-auto mb-6 max-w-2xl flex-wrap items-center"
        role="status"
      >
        <PhUserSound :size="20" weight="bold" class="shrink-0 text-attention"></PhUserSound>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-ink">{{ t('conversations.askedForPerson', { name }) }}</p>
          <p class="mt-0.5 text-ink-soft">
            <template v-if="phone">{{ t('conversations.callToPickUp', { phone }) }}</template>
            <template v-else>{{ t('conversations.readThenReach') }}</template>
          </p>
        </div>
        <a v-if="phone" :href="`tel:${phone}`" class="btn btn-primary">
          <PhPhone :size="16"></PhPhone>
          {{ t('conversations.callBack') }}
        </a>
      </div>

      <div class="mx-auto flex max-w-2xl flex-col gap-3">
        <div
          v-for="(line, index) in conversation.messages"
          :key="index"
          class="flex"
          :class="line.role === 'user' ? 'justify-start' : 'justify-end'"
        >
          <div class="max-w-[85%]">
            <p class="mb-1 px-1 text-xs text-ink-soft" :class="{ 'text-right': line.role !== 'user' }">
              {{ line.role === 'user' ? name : t('conversations.yourAgent') }}
            </p>
            <div
              class="rounded-[var(--radius-panel)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              :class="line.role === 'user' ? 'rounded-tl-sm bg-hover text-ink' : 'rounded-tr-sm bg-brand-tint text-ink'"
            >
              <!-- The photo the visitor sent, and the products the agent showed (D57). -->
              <a v-if="line.photo" :href="line.photo" target="_blank" rel="noopener">
                <img :src="line.photo" :alt="t('conversations.theirPhoto', { name })" class="mb-1.5 max-h-60 rounded-[var(--radius-control)]" />
              </a>
              <div v-if="line.photos?.length" class="flex flex-wrap gap-2">
                <figure v-for="product in line.photos" :key="product.url" class="w-28">
                  <img :src="product.url" :alt="product.name" class="aspect-square w-full rounded-[var(--radius-control)] object-cover" />
                  <figcaption class="mt-1 text-xs leading-snug">
                    <span class="block font-semibold">{{ product.name }}</span>
                    <span class="text-ink-soft">{{ product.price }}</span>
                  </figcaption>
                </figure>
              </div>
              <span v-if="line.text">{{ line.text }}</span>
            </div>
          </div>
        </div>
        <p v-if="!conversation.messages.length" class="text-sm text-ink-soft">{{ t('conversations.nothingSaid') }}</p>
      </div>

      <div v-if="conversation.records.length" class="mx-auto mt-8 max-w-2xl">
        <h3 class="mb-2 text-sm font-semibold">{{ t('conversations.takenHere') }}</h3>
        <router-link
          v-for="record in conversation.records"
          :key="record.id"
          :to="`/inbox?job=${record.job}&open=${record.id}`"
          class="mb-2 flex items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-hairline px-4 py-3 text-sm transition-colors hover:bg-wash"
        >
          <span class="font-semibold">
            {{ t(`records.name.${record.job}`) }} {{ record.code }}
          </span>
          <span class="flex items-center gap-3">
            <span v-if="record.kind === 'order'" class="font-semibold">{{ formatMoney(record.total) }}</span>
            <StatusChip :status="record.status"></StatusChip>
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowLeft, PhPhone, PhUserSound } from '@phosphor-icons/vue';

import StatusChip from '../ui/StatusChip.vue';
import { channelOf } from '../../lib/channels.js';
import { formatMoney, formatTime, formatDay } from '../../lib/format.js';

const props = defineProps({
  conversation: { type: Object, required: true },
});
defineEmits(['back']);
const { t } = useI18n();

const channel = computed(() => channelOf(props.conversation.channel));
const name = computed(() => props.conversation.records[0]?.customer_name || t('conversations.visitor'));
const phone = computed(() => props.conversation.records.find((r) => r.customer_phone)?.customer_phone ?? '');
const when = computed(
  () => `${formatDay(props.conversation.created_at)}, ${formatTime(props.conversation.created_at)}`,
);
</script>
