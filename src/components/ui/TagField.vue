<template>
  <!-- A text box where the backend's tags ({business_name}, {total}, …) show as coloured pills.
       The owner types around them, adds one with the buttons below, and deletes one like a
       letter (Backspace). v-model is the plain text with the tags in braces, as saved. -->
  <div>
    <div
      :id="id"
      ref="box"
      class="field tag-field"
      :class="{ 'field-invalid': invalid }"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :aria-label="label"
      @input="changed"
      @keydown.enter.prevent
      @paste.prevent="pasted"
      @keyup="remember"
      @mouseup="remember"
      @blur="remember"
    ></div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span class="text-xs text-ink-soft">{{ t('tags.add') }}</span>
      <button
        v-for="tag in tags"
        :key="tag.key"
        type="button"
        class="tag-pill cursor-pointer transition-opacity hover:opacity-80"
        :class="COLOURS[tag.key] ?? COLOURS.default"
        @click="insert(tag.key)"
      >
        + {{ tag.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  // [{ key: 'total', label: 'Total' }]: the tags this text can hold, in the order offered
  tags: { type: Array, required: true },
  invalid: { type: Boolean, default: false },
});
const model = defineModel({ type: String, default: '' });
const { t } = useI18n();

// Each tag keeps its colour everywhere, so the owner learns them.
const COLOURS = {
  business_name: 'bg-tint-lilac',
  items: 'bg-tint-sky',
  total: 'bg-tint-sand',
  code: 'bg-hover',
  default: 'bg-hover',
};

const box = ref(null);
let saved = null; // where the caret was, so a button inserts there
let last = null; // the text this box last sent, so typing doesn't redraw it

function pill(key) {
  const tag = props.tags.find((x) => x.key === key);
  const span = document.createElement('span');
  span.className = `tag-pill ${COLOURS[key] ?? COLOURS.default}`;
  span.contentEditable = 'false';
  span.dataset.tag = key;
  span.textContent = tag.label;
  return span;
}

// The saved text drawn as text and pills. Only known tags become pills: other braces stay text.
function draw(text) {
  const keys = props.tags.map((x) => x.key);
  box.value.replaceChildren();
  for (const part of text.split(/(\{[a-z_]+\})/)) {
    const key = part.slice(1, -1);
    if (part.startsWith('{') && keys.includes(key)) box.value.append(pill(key));
    else if (part) box.value.append(document.createTextNode(part));
  }
}

// The box back to plain text: a pill is its tag in braces.
function read(node) {
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
    else if (child.dataset?.tag) text += `{${child.dataset.tag}}`;
    else if (child.nodeName !== 'BR') text += read(child);
  }
  return text;
}

function changed() {
  last = read(box.value).replace(/\s+/g, ' ');
  model.value = last;
}

function remember() {
  const selection = window.getSelection();
  if (selection.rangeCount && box.value.contains(selection.anchorNode)) saved = selection.getRangeAt(0);
}

// Puts a node where the caret was (or at the end), and the caret after it.
function put(node) {
  box.value.focus();
  let range = saved;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(box.value);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  saved = range;
  changed();
}

function insert(key) {
  const space = document.createTextNode(' ');
  put(space);
  space.parentNode.insertBefore(pill(key), space);
  changed();
}

// Pasted text comes in as plain text, never someone else's formatting.
function pasted(event) {
  put(document.createTextNode(event.clipboardData.getData('text/plain').replace(/\s+/g, ' ')));
}

onMounted(() => draw(model.value));
watch(model, (text) => {
  if (text !== last) draw(text ?? ''); // changed from outside: a reset or a load
});
</script>

<style scoped>
/* A textarea's look, growing with its text; the line height leaves room for the pills. */
.tag-field {
  height: auto;
  min-height: 5rem;
  padding-block: 0.625rem;
  border-radius: var(--radius-card);
  white-space: pre-wrap;
  line-height: 2;
}

/* A tag: a small pill in its own tint, the same in the text and on its button. */
.tag-field :deep(.tag-pill),
.tag-pill {
  display: inline-flex;
  align-items: center;
  margin-inline: 0.125rem;
  padding: 0.0625rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-ink);
  user-select: none;
}
</style>
