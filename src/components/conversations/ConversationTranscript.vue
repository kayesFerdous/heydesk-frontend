<template>
  <!-- What was said, word for word, under a header saying who and where.
       A hand-off shows at the top with the way to pick it up. -->
  <div class="flex flex-col">
    <header class="flex items-center gap-3 border-b border-hairline p-4 sm:px-6">
      <button type="button" class="btn btn-secondary btn-icon btn-sm lg:hidden" :aria-label="t('conversations.back')" @click="$emit('back')">
        <PhArrowLeft :size="18"></PhArrowLeft>
      </button>
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold" :class="tint" aria-hidden="true">
        <template v-if="named">{{ initials(name) }}</template>
        <component :is="channel.icon" v-else :size="22" :weight="channel.weight"></component>
      </span>
      <div class="min-w-0">
        <h2 class="truncate text-lg font-bold">{{ name }}</h2>
        <p class="truncate text-sm text-ink-soft">{{ channel.long }}, {{ when }}</p>
      </div>
    </header>

    <div class="px-4 py-5 sm:px-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
      <div
        v-if="conversation.status === 'needs_human'"
        class="mx-auto mb-6 flex max-w-2xl flex-wrap items-center gap-3 rounded-[var(--radius-card)] bg-attention-tint p-4 text-sm"
        role="status"
      >
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-attention" aria-hidden="true">
          <PhUserSound :size="20" weight="bold"></PhUserSound>
        </span>
        <div class="min-w-[12rem] flex-1">
          <p class="font-bold text-ink">{{ t('conversations.askedForPerson', { name }) }}</p>
          <p class="mt-0.5 text-ink">
            <template v-if="phone">{{ t('conversations.callToPickUp', { phone }) }}</template>
            <template v-else>{{ t('conversations.readThenReach') }}</template>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a v-if="phone" :href="`tel:${phone}`" class="btn btn-primary">
            <PhPhone :size="16" weight="fill"></PhPhone>
            {{ t('conversations.callBack') }}
          </a>
          <button
            type="button"
            class="btn"
            :class="phone ? 'btn-secondary' : 'btn-primary'"
            :title="t('conversations.handledHint')"
            :disabled="busy"
            @click="$emit('handled')"
          >
            <PhCheck :size="16" weight="bold"></PhCheck>
            {{ t('conversations.markHandled') }}
          </button>
        </div>
        <p v-if="error" class="w-full text-sm text-danger" role="alert">{{ error }}</p>
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
              class="rounded-[var(--radius-card)] px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
              :class="line.role === 'user' ? 'rounded-tl-md bg-hover text-ink' : 'rounded-tr-md bg-brand-tint text-ink'"
            >
              <!-- The photo the visitor sent, and the products the agent showed (D57). -->
              <a v-if="line.photo" :href="line.photo" target="_blank" rel="noopener">
                <img :src="line.photo" :alt="t('conversations.theirPhoto', { name })" class="mb-1.5 max-h-60 rounded-[0.875rem]" />
              </a>
              <div v-if="line.photos?.length" class="flex flex-wrap gap-2">
                <figure v-for="product in line.photos" :key="product.url" class="w-28">
                  <img :src="product.url" :alt="product.name" class="aspect-square w-full rounded-[0.875rem] object-cover" />
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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhArrowLeft, PhCheck, PhPhone, PhUserSound } from '@phosphor-icons/vue';

import { channelOf } from '../../lib/channels.js';
import { formatTime, formatDay } from '../../lib/format.js';
import { avatarTint, initials } from '../../lib/group.js';

const props = defineProps({
  conversation: { type: Object, required: true },
  busy: { type: Boolean, default: false }, // marking the hand-off handled
  error: { type: String, default: null },
});
defineEmits(['back', 'handled']);
const { t } = useI18n();

const channel = computed(() => channelOf(props.conversation.channel));
const named = computed(() => Boolean(props.conversation.records[0]?.customer_name));
const name = computed(() => props.conversation.records[0]?.customer_name || t('conversations.visitor'));
const tint = computed(() => (named.value ? avatarTint(name.value) : channel.value.avatar));
const phone = computed(() => props.conversation.records.find((r) => r.customer_phone)?.customer_phone ?? '');
const when = computed(
  () => `${formatDay(props.conversation.created_at)}, ${formatTime(props.conversation.created_at)}`,
);
</script>
