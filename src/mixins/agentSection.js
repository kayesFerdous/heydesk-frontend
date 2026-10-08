// What every section of the Agent settings page does the same way: copy the
// saved config into a form, notice changes, save only this section's fields,
// and stop the owner leaving with unsaved work.
//
// A section component adds `mixins: [agentSection]` and defines two methods:
//   formFrom(config)  -> the form object its inputs edit
//   patchFrom(form)   -> the fields to PATCH (only this section's own)
// The API replaces each top-level field it is sent and leaves the rest, so
// sections never overwrite each other.
const SAVED_NOTE_MS = 4000;

export default {
  data() {
    return {
      form: null,
      baseline: '',
      isSaving: false,
      saveError: null,
      problems: [],
      errors: {},
      savedNote: '',
      noteTimer: null,
    };
  },
  computed: {
    config() {
      return this.$store.getters['agent/config'];
    },
    preset() {
      return this.$store.getters['agent/preset'];
    },
    isDirty() {
      return !!this.form && JSON.stringify(this.form) !== this.baseline;
    },
  },
  watch: {
    // The config arrives after the page opens (and changes after a save):
    // fill the form, unless the owner is in the middle of editing it.
    config: {
      immediate: true,
      handler(config) {
        if (config && !this.isDirty) this.resetForm();
      },
    },
  },
  beforeUnmount() {
    clearTimeout(this.noteTimer);
  },
  beforeRouteLeave(to, from, next) {
    if (this.isDirty && !window.confirm('You have unsaved changes. Leave without saving them?')) {
      next(false);
    } else {
      next();
    }
  },
  methods: {
    resetForm() {
      this.form = this.formFrom(this.config);
      this.baseline = JSON.stringify(this.form);
      this.errors = {};
      this.problems = [];
      this.saveError = null;
    },
    async save() {
      if (!this.isDirty || this.isSaving) return;
      this.isSaving = true;
      this.saveError = null;
      this.problems = [];
      this.errors = {};
      try {
        await this.$store.dispatch('agent/save', this.patchFrom(this.form));
        this.resetForm();
        this.savedNote = 'Saved. Your agent uses this from the next message.';
        clearTimeout(this.noteTimer);
        this.noteTimer = setTimeout(() => (this.savedNote = ''), SAVED_NOTE_MS);
      } catch (error) {
        this.saveError = error.message;
        // 422 invalid_config: one line per field the backend did not accept.
        if (error.fields) {
          this.errors = error.fields;
          this.saveError = 'Some details need a look:';
          this.problems = Object.keys(error.fields).map((path) => `${path}: ${error.fields[path]}`);
        }
      }
      this.isSaving = false;
    },
  },
};
