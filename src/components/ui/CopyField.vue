<template>
  <div>
    <label class="label" :for="id">{{ label }}</label>
    <div class="flex gap-2">
      <input :id="id" class="field min-w-0 flex-1 !bg-wash" type="text" :value="value" readonly @focus="$event.target.select()" />
      <button type="button" class="btn btn-secondary shrink-0" @click="copy">
        <component :is="copied ? PhCheck : PhCopy" :size="16" :class="{ 'text-success': copied }"></component>
        {{ copied ? t('common.copied') : t('common.copy') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCopy, PhCheck } from '@phosphor-icons/vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
});
const emit = defineEmits(['copied']);
const { t } = useI18n();

const id = useId();
const copied = ref(false);
let timer = null;

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    emit('copied');
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 2000);
  } catch (error) {
    // Clipboard blocked: the field is selectable, so the owner can copy by hand.
  }
}

onBeforeUnmount(() => clearTimeout(timer));
</script>
