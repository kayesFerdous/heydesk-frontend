<template>
  <!-- What every agent did today and this week (backend D72), from the saved
       turns: is HeyDesk working, and who uses it. -->
  <LoadError v-if="error" :message="error" @retry="load"></LoadError>

  <SkeletonRows v-else-if="!overview"></SkeletonRows>

  <div v-else class="flex flex-col gap-8 px-5 pb-12 sm:px-8">
    <!-- Each number: today big, the week under it. -->
    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-hairline sm:grid-cols-4">
      <div v-for="tile in tiles" :key="tile.label" class="bg-surface px-4 py-3.5">
        <p class="text-sm text-ink-soft">{{ tile.label }}</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums" :class="{ 'text-danger': tile.bad && tile.today }">
          {{ tile.show(tile.today) }}
        </p>
        <p class="mt-0.5 text-sm text-ink-soft">{{ t('overview.week', { value: tile.show(tile.week) }) }}</p>
      </div>
    </div>
    <p class="-mt-5 text-sm text-ink-soft">{{ t('overview.costNote') }}</p>

    <!-- A bar a day: its turns, the failed part in red. -->
    <section>
      <h2 class="section-title mb-3">{{ t('overview.perDay') }}</h2>
      <ul class="flex flex-col gap-1.5">
        <li v-for="day in overview.per_day" :key="day.day" class="grid grid-cols-[4.5rem_minmax(0,1fr)_7rem] items-center gap-3 text-sm">
          <span class="text-ink-soft">{{ formatDay(day.day) }}</span>
          <span class="flex h-3 overflow-hidden rounded-full bg-hover" :title="t('overview.dayTitle', { turns: day.turns, failed: day.failed })">
            <span class="bg-brand" :style="{ width: barWidth(day.turns - day.failed) }"></span>
            <span class="bg-danger" :style="{ width: barWidth(day.failed) }"></span>
          </span>
          <span class="text-right tabular-nums">
            {{ t('overview.turns', { n: formatNumber(day.turns) }, day.turns) }}
          </span>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="section-title mb-1">{{ t('failed.title') }}</h2>
      <p class="mb-2 text-sm text-ink-soft">{{ t('failed.tip') }}</p>
      <FailedTurns></FailedTurns>
    </section>

    <section>
      <h2 class="section-title mb-3">{{ t('overview.busiest') }}</h2>
      <ul class="flex flex-col gap-2 text-sm">
        <li v-for="b in overview.busiest" :key="b.id" class="flex flex-wrap justify-between gap-x-4">
          <router-link :to="`/admin/businesses/${b.id}`" class="font-semibold hover:underline">{{ b.name }}</router-link>
          <span class="text-ink-soft tabular-nums">
            {{ t('overview.turns', { n: formatNumber(b.turns) }, b.turns) }} · {{ dollars(b.cost_micros) }}
          </span>
        </li>
      </ul>
      <p v-if="!overview.busiest.length" class="text-sm text-ink-soft">{{ t('overview.quiet') }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import LoadError from '../../components/ui/LoadError.vue';
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import { fetchOverview } from '../../api/admin.js';
import { formatDay, formatDollars as dollars, formatNumber, formatSeconds as seconds } from '../../lib/format.js';
import FailedTurns from './FailedTurns.vue';

const { t } = useI18n();

const overview = ref(null);
const error = ref(null);

const count = (n) => formatNumber(n);

const tiles = computed(() => {
  const { today, period } = overview.value;
  const tile = (label, field, show = count, bad = false) => ({ label, today: today[field], week: period[field], show, bad });
  return [
    tile(t('overview.turnsLabel'), 'turns'),
    tile(t('overview.conversations'), 'conversations'),
    tile(t('overview.failed'), 'failed', count, true),
    tile(t('overview.handedOff'), 'handed_off'),
    { label: t('overview.tokens'), today: today.input_tokens + today.output_tokens, week: period.input_tokens + period.output_tokens, show: count },
    tile(t('overview.cost'), 'cost_micros', dollars),
    tile(t('overview.firstReply'), 'first_reply_ms', seconds),
    tile(t('overview.slowFirstReply'), 'slow_first_reply_ms', seconds),
  ];
});

const busiestDay = computed(() => Math.max(1, ...overview.value.per_day.map((d) => d.turns)));

function barWidth(turns) {
  return `${(turns / busiestDay.value) * 100}%`;
}

async function load() {
  error.value = null;
  try {
    overview.value = await fetchOverview();
  } catch (err) {
    error.value = err.message;
  }
}

load();
</script>
