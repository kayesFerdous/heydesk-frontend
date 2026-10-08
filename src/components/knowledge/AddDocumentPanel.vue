<template>
  <div class="border-y border-hairline bg-wash px-5 py-6 sm:px-8">
    <form class="max-w-2xl" novalidate @submit.prevent="submit">
      <h2 class="section-title">Add a document</h2>
      <p class="mt-1 text-sm text-ink-soft">
        Upload a .txt, .md or .pdf file (up to 10 MB), or paste the text. It can take
        a few seconds to read, and your agent can use it as soon as it is added.
      </p>

      <div class="mt-4">
        <label class="btn btn-secondary cursor-pointer">
          <ph-upload-simple :size="18"></ph-upload-simple>
          {{ file ? file.name : 'Choose a file' }}
          <input class="sr-only" type="file" accept=".txt,.md,.markdown,.pdf" :disabled="busy" @change="pick" />
        </label>
        <button v-if="file" type="button" class="btn btn-quiet ml-1" :disabled="busy" @click="clearFile">
          Remove file
        </button>
      </div>

      <div class="mt-5 flex flex-col gap-5">
        <div>
          <label class="label" for="doc-title">Title</label>
          <input id="doc-title" v-model.trim="title" class="field" type="text" maxlength="200" :disabled="busy" />
          <p v-if="file" class="mt-1.5 text-xs text-ink-soft">Leave empty to use the file name.</p>
        </div>
        <div v-if="!file">
          <label class="label" for="doc-text">Text</label>
          <textarea
            id="doc-text"
            v-model="text"
            class="field !h-auto py-2.5"
            rows="8"
            :disabled="busy"
            placeholder="Delivery is free inside Dhanmondi on orders over ৳1,000..."
          ></textarea>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger" role="alert">{{ error }}</p>

      <div class="mt-5 flex gap-2">
        <button type="submit" class="btn btn-primary" :disabled="!canAdd || busy">
          {{ busy ? 'Reading it...' : 'Add document' }}
        </button>
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="$emit('close')">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script>
import { PhUploadSimple } from '@phosphor-icons/vue';

import { addTextDocument, addFileDocument } from '../../api/agent.js';

export default {
  components: { PhUploadSimple },
  emits: ['close', 'added'],
  data() {
    return { file: null, title: '', text: '', error: null, busy: false };
  },
  computed: {
    // A file needs nothing else. Pasted text needs a title and some words.
    canAdd() {
      return this.file ? true : !!this.title && !!this.text.trim();
    },
  },
  methods: {
    pick(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.file = file;
      this.error = null;
    },
    clearFile() {
      this.file = null;
    },
    async submit() {
      if (!this.canAdd || this.busy) return;
      this.busy = true;
      this.error = null;
      const token = this.$store.getters['auth/token'];
      try {
        const document = this.file
          ? await addFileDocument(token, this.file, this.title)
          : await addTextDocument(token, this.title, this.text);
        this.$emit('added', document);
      } catch (error) {
        // 422 unreadable_document and 503 knowledge_unavailable both carry a
        // sentence that says what to do next, so show it as it is.
        this.error = error.message;
      }
      this.busy = false;
    },
  },
};
</script>
