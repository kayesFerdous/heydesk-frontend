<template>
  <div class="border-y border-hairline bg-wash px-5 py-6 sm:px-8">
    <form class="max-w-2xl" novalidate @submit.prevent="submit">
      <h2 class="section-title">{{ t('knowledge.panel.title') }}</h2>
      <p class="mt-1 text-sm text-ink-soft">{{ t('knowledge.panel.intro') }}</p>

      <div class="mt-4">
        <label class="btn btn-secondary cursor-pointer">
          <PhUploadSimple :size="18"></PhUploadSimple>
          {{ file ? file.name : t('knowledge.panel.choose') }}
          <input class="sr-only" type="file" accept=".txt,.md,.markdown,.pdf" :disabled="busy" @change="pick" />
        </label>
        <button v-if="file" type="button" class="btn btn-quiet ml-1" :disabled="busy" @click="file = null">
          {{ t('knowledge.panel.removeFile') }}
        </button>
      </div>

      <div class="mt-5 flex flex-col gap-5">
        <div>
          <label class="label" for="doc-title">{{ t('knowledge.panel.docTitle') }}</label>
          <input id="doc-title" v-model.trim="title" class="field" type="text" maxlength="200" :disabled="busy" />
          <p v-if="file" class="mt-1.5 text-xs text-ink-soft">{{ t('knowledge.panel.titleHint') }}</p>
        </div>
        <div v-if="!file">
          <label class="label" for="doc-text">{{ t('knowledge.panel.text') }}</label>
          <textarea
            id="doc-text"
            v-model="text"
            class="field !h-auto py-2.5"
            rows="8"
            :disabled="busy"
            :placeholder="t('knowledge.panel.placeholder')"
          ></textarea>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

      <div class="mt-5 flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="!canAdd || busy">
          {{ busy ? t('knowledge.panel.reading') : t('knowledge.add') }}
        </button>
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="$emit('close')">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhUploadSimple } from '@phosphor-icons/vue';

import { addTextDocument, addFileDocument } from '../../api/agent.js';

const emit = defineEmits(['close', 'added']);
const { t } = useI18n();

const file = ref(null);
const title = ref('');
const text = ref('');
const error = ref(null);
const busy = ref(false);

// A file needs nothing else. Pasted text needs a title and some words.
const canAdd = computed(() => (file.value ? true : !!title.value && !!text.value.trim()));

function pick(event) {
  const picked = event.target.files[0];
  if (!picked) return;
  file.value = picked;
  error.value = null;
}

async function submit() {
  if (!canAdd.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    const document = file.value
      ? await addFileDocument(file.value, title.value)
      : await addTextDocument(title.value, text.value);
    emit('added', document);
  } catch (err) {
    // 422 unreadable_document and 503 knowledge_unavailable both carry a
    // sentence that says what to do next, so show it as it is.
    error.value = err.message;
  }
  busy.value = false;
}
</script>
