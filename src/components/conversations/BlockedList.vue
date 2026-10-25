<template>
  <!-- Who is blocked now (backend I2): by the team, for flooding or for chatting off topic. -->
  <LoadError v-if="error" :message="error" @retry="load"></LoadError>
  <SkeletonRows v-else-if="!loaded" class="border-t border-hairline"></SkeletonRows>
  <EmptyState
    v-else-if="!rows.length"
    :icon="PhCheckCircle"
    :title="t('conversations.them.noneBlocked')"
    :text="t('conversations.them.noneBlockedText')"
  ></EmptyState>
  <div v-else class="min-h-0 flex-1 overflow-y-auto border-t border-hairline">
    <div v-for="row in rows" :key="row.id" class="flex items-center gap-3 border-b border-hairline px-5 py-3 text-sm">
      <component :is="channelOf(row.channel || 'web').icon" :size="18" class="shrink-0" :class="channelOf(row.channel || 'web').color"></component>
      <button type="button" class="min-w-0 flex-1 text-left" :disabled="!row.conversation_id" @click="$emit('open', row.conversation_id)">
        <span class="block truncate font-semibold">{{ row.name || t('conversations.them.someone') }}</span>
        <span class="block truncate text-ink-soft">{{ blockedLine(row, t) }}</span>
      </button>
      <button type="button" class="btn btn-secondary btn-sm shrink-0" :disabled="busy === row.id" @click="unblock(row)">
        {{ t('conversations.them.unblock') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCheckCircle } from '@phosphor-icons/vue';

import EmptyState from '../ui/EmptyState.vue';
import LoadError from '../ui/LoadError.vue';
import SkeletonRows from '../ui/SkeletonRows.vue';
import { fetchBlocked, changeVisitor } from '../../api/conversations.js';
import { blockedLine } from '../../lib/blocked.js';
import { channelOf } from '../../lib/channels.js';

defineEmits(['open']);
const { t } = useI18n();

const rows = ref([]);
const loaded = ref(false);
const error = ref(null);
const busy = ref(null); // the visitor being unblocked

async function load() {
  error.value = null;
  try {
    rows.value = await fetchBlocked();
    loaded.value = true;
  } catch (err) {
    error.value = err.message;
  }
}

async function unblock(row) {
  busy.value = row.id;
  try {
    await changeVisitor(row.id, { blocked: false });
    rows.value = rows.value.filter((r) => r.id !== row.id);
  } catch (err) {
    error.value = err.message;
  }
  busy.value = null;
}

onMounted(load);
</script>
