<template>
  <div class="border-b border-hairline bg-wash px-5 py-5 sm:px-8">
    <div class="max-w-2xl">
      <h2 class="text-lg font-semibold tracking-tight">Import from a spreadsheet</h2>
      <p class="mt-1 text-sm text-ink-soft">
        Upload a CSV with a header row. It replaces the whole list.
        <template v-if="noun === 'doctor'">
          Columns: name, speciality, fee, days (like "sat; sun"), hours (like 17:00-21:00), and
          optionally languages, description, available.
        </template>
        <template v-else>
          Columns: name, price, and optionally category, description, tags (like "spicy; popular"),
          available.
        </template>
      </p>

      <div class="mt-4">
        <label class="btn btn-secondary cursor-pointer">
          <ph-upload-simple :size="18"></ph-upload-simple>
          {{ fileName || 'Choose a CSV file' }}
          <input class="sr-only" type="file" accept=".csv,text/csv" @change="pick" />
        </label>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

      <div v-if="result" class="mt-5">
        <p class="text-sm font-semibold">
          Found {{ result.count }} {{ result.count === 1 ? noun : noun + 's' }}.
        </p>
        <p v-if="result.attributes.length" class="mt-1 text-sm text-ink-soft">
          Extra columns kept as facts: {{ result.attributes.join(', ') }}.
        </p>
        <ul class="mt-3 divide-y divide-hairline rounded-[var(--radius-control)] border border-hairline bg-surface text-sm">
          <li v-for="item in result.preview" :key="item.code" class="flex justify-between gap-4 px-4 py-2.5">
            <span class="truncate">{{ item.name }}</span>
            <span class="font-semibold">{{ money(item.price) }}</span>
          </li>
        </ul>
        <p class="mt-3 text-sm text-attention">
          This replaces your current {{ currentCount }}
          {{ currentCount === 1 ? noun : noun + 's' }}.
        </p>
      </div>

      <div class="mt-5 flex gap-2">
        <button v-if="result" type="button" class="btn btn-primary" :disabled="busy" @click="confirm">
          {{ busy ? 'Importing...' : `Replace with these ${result.count}` }}
        </button>
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import { PhUploadSimple } from '@phosphor-icons/vue';

import { importItems } from '../../api/agent.js';
import { formatMoney } from '../../lib/format.js';

export default {
  components: { PhUploadSimple },
  props: {
    noun: { type: String, default: 'item' },
    currentCount: { type: Number, default: 0 },
  },
  emits: ['close', 'imported'],
  data() {
    return { csv: '', fileName: '', result: null, error: null, busy: false };
  },
  methods: {
    money: formatMoney,
    async pick(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.fileName = file.name;
      this.result = null;
      this.error = null;
      this.busy = true;
      try {
        this.csv = await file.text();
        const token = this.$store.getters['auth/token'];
        // Check the file first. Nothing is saved until the owner confirms.
        this.result = await importItems(token, this.csv, true);
      } catch (error) {
        this.error = error.message;
      }
      this.busy = false;
    },
    async confirm() {
      this.busy = true;
      this.error = null;
      try {
        const token = this.$store.getters['auth/token'];
        await importItems(token, this.csv, false);
        this.$emit('imported');
      } catch (error) {
        this.error = error.message;
      }
      this.busy = false;
    },
  },
};
</script>
