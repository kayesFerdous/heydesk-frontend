<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <form-problems :message="saveError" :problems="problems"></form-problems>

    <div v-if="hasHours">
      <h2 class="section-title">Opening hours</h2>
      <p class="mt-1 mb-4 text-sm text-ink-soft">Your agent tells customers when you are open, and only takes orders and bookings for those times.</p>
      <hours-editor v-model="form.hours"></hours-editor>
    </div>

    <div class="flex flex-col gap-5" :class="{ 'mt-10 border-t border-hairline pt-8': hasHours }">
      <div>
        <h2 class="section-title">When a person is needed</h2>
        <p class="mt-1 text-sm text-ink-soft">
          What customers hear when they ask for a person, and how they reach you. They also show up in
          Conversations as "Needs a person".
        </p>
      </div>
      <div>
        <label class="label" for="handoff-message">What your agent says</label>
        <input id="handoff-message" v-model="form.handoff.message" class="field" :class="{ 'field-invalid': errors['handoff.message'] }" type="text" />
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class="label" for="handoff-phone">Phone</label>
          <input id="handoff-phone" v-model.trim="form.handoff.phone" class="field" :class="{ 'field-invalid': errors['handoff.phone'] }" type="tel" autocomplete="off" placeholder="01712 345678" />
        </div>
        <div>
          <label class="label" for="handoff-email">Email</label>
          <input id="handoff-email" v-model.trim="form.handoff.email" class="field" :class="{ 'field-invalid': errors['handoff.email'] }" type="email" autocomplete="off" />
        </div>
      </div>
      <p class="-mt-2 text-[0.8125rem] text-ink-soft">One of the two is enough.</p>
    </div>

    <save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></save-bar>
    <div class="h-8"></div>
  </form>
</template>

<script>
import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import HoursEditor from '../../components/agent/HoursEditor.vue';
import agentSection from '../../mixins/agentSection.js';
import { normalizeHours, DAYS } from '../../lib/hours.js';

export default {
  components: { FormProblems, SaveBar, HoursEditor },
  mixins: [agentSection],
  computed: {
    hasHours() {
      const properties = (this.preset && this.preset.knowledge_schema.properties) || {};
      return 'hours' in properties;
    },
  },
  methods: {
    formFrom(config) {
      return {
        hours: normalizeHours(config.knowledge.hours),
        handoff: {
          message: config.handoff.message,
          phone: config.handoff.phone || '',
          email: config.handoff.email || '',
        },
      };
    },
    // Closed days go to the API as null; empty contact fields as null.
    patchFrom(form) {
      const patch = {
        handoff: {
          message: form.handoff.message,
          phone: form.handoff.phone || null,
          email: form.handoff.email || null,
        },
      };
      if (this.hasHours) {
        const hours = {};
        DAYS.forEach(({ key }) => (hours[key] = form.hours[key]));
        patch.knowledge = { hours };
      }
      return patch;
    },
  },
};
</script>
