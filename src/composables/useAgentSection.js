import { ref, computed, watch, inject, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useAgentStore } from '../stores/agent.js';

const SAVED_NOTE_MS = 4000;

// What every section of the Agent settings page does the same way: copy the
// saved config into a form, notice changes, save only this section's fields,
// and stop the owner leaving with unsaved work.
//
//   formFrom(config)  -> the form object the section's inputs edit
//   patchFrom(form)   -> the fields to PATCH (only this section's own)
//   previewFrom(form) -> optional: what the page's chat preview should show
//                        from this form before it is saved (name, greeting,
//                        the bubble's look); AgentPage provides `agentDraft`
//
// The API replaces each top-level field it is sent and leaves the rest, so
// sections never overwrite each other.
export function useAgentSection({ formFrom, patchFrom, previewFrom }) {
  const agent = useAgentStore();
  const { t } = useI18n();

  const form = ref(null);
  const baseline = ref('');
  const isSaving = ref(false);
  const saveError = ref(null);
  const problems = ref([]);
  const errors = ref({});
  const savedNote = ref('');
  let noteTimer = null;

  const isDirty = computed(() => !!form.value && JSON.stringify(form.value) !== baseline.value);

  function resetForm() {
    form.value = formFrom(agent.config);
    baseline.value = JSON.stringify(form.value);
    errors.value = {};
    problems.value = [];
    saveError.value = null;
  }

  // The config arrives after the page opens (and changes after a save): fill
  // the form, unless the owner is in the middle of editing it.
  watch(
    () => agent.config,
    (config) => {
      if (config && !isDirty.value) resetForm();
    },
    { immediate: true },
  );

  async function save() {
    if (!isDirty.value || isSaving.value) return;
    isSaving.value = true;
    saveError.value = null;
    problems.value = [];
    errors.value = {};
    try {
      await agent.save(patchFrom(form.value));
      resetForm();
      savedNote.value = t('agent.savedNote');
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => (savedNote.value = ''), SAVED_NOTE_MS);
    } catch (error) {
      saveError.value = error.message;
      // 422 invalid_config: one line per field the backend did not accept.
      if (error.fields) {
        errors.value = error.fields;
        saveError.value = t('agent.needsALook');
        problems.value = Object.entries(error.fields).map(([path, problem]) => `${path}: ${problem}`);
      }
    }
    isSaving.value = false;
  }

  // The page's preview follows this form as it is edited. Leaving the section
  // takes its draft away, so the preview falls back to what is saved.
  const draft = inject('agentDraft', null);
  if (draft && previewFrom) {
    watch(form, (value) => value && Object.assign(draft, previewFrom(value)), { deep: true, immediate: true });
    onBeforeUnmount(() => {
      if (form.value) Object.keys(previewFrom(form.value)).forEach((key) => delete draft[key]);
    });
  }

  onBeforeRouteLeave(() => {
    if (isDirty.value && !window.confirm(t('agent.leaveUnsaved'))) return false;
  });

  onBeforeUnmount(() => clearTimeout(noteTimer));

  return { form, isDirty, isSaving, saveError, problems, errors, savedNote, save, resetForm };
}
