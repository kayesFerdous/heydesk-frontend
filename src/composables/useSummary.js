import { computed, reactive, watch } from 'vue';

import { assist } from '../api/conversations.js';

// Too short to be worth a summary: the lines are right there.
export const MIN_LINES = 4;

// Kept for each chat while the page is open, so going back to a chat shows the same summary
// without a new model call: conversation id -> { text, at, loading, error } (`at`: how many
// lines it read).
const kept = reactive({});

// A chat's summary (backend D137), shared by the strip above the transcript and the reply
// box's Summary button. Each one is a model call counted on the plan, so it comes by itself
// only when the visitor waits for a person; otherwise the button asks (`load`).
//
//   const { summary, worth, behind, load } = useSummary(() => props.conversation);
export function useSummary(getConversation) {
  const count = computed(() => getConversation().count ?? getConversation().messages.length);
  const worth = computed(() => count.value >= MIN_LINES);
  const summary = computed(() => kept[getConversation().id] ?? null);
  const behind = computed(() => Boolean(summary.value?.text) && summary.value.at < count.value);

  async function load() {
    const id = getConversation().id;
    const at = count.value;
    kept[id] = { ...kept[id], loading: true, error: null };
    try {
      const { text } = await assist(id, 'summary');
      kept[id] = { text, at, loading: false, error: null };
    } catch (err) {
      kept[id] = { ...kept[id], loading: false, error: err.message };
    }
  }

  watch(
    () => getConversation().id,
    (id) => {
      if (!kept[id] && worth.value && getConversation().status === 'needs_human') load();
    },
    { immediate: true },
  );

  return { summary, worth, behind, load };
}
