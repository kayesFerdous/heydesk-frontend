<template>
  <form v-if="form" novalidate @submit.prevent="save">
    <form-problems :message="saveError" :problems="problems"></form-problems>

    <div class="flex flex-col gap-5">
      <h2 class="section-title">Name and greeting</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class="label" for="agent-name">Agent name</label>
          <input id="agent-name" v-model.trim="form.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
          <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
        </div>
        <div>
          <label class="label" for="business-name">Business name</label>
          <input id="business-name" v-model.trim="form.business_name" class="field" :class="{ 'field-invalid': errors.business_name }" type="text" />
          <p v-if="errors.business_name" class="error-text">{{ errors.business_name }}</p>
        </div>
      </div>
      <div>
        <label class="label" for="greeting">Greeting</label>
        <textarea id="greeting" v-model="form.greeting" class="field" :class="{ 'field-invalid': errors.greeting }" rows="2"></textarea>
        <p class="hint">The first thing customers see. Write {business_name} to insert your business name.</p>
      </div>
    </div>

    <div v-if="fields.length" class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
      <h2 class="section-title">About your business</h2>
      <div v-for="field in fields" :key="field.key">
        <label class="label" :for="`k-${field.key}`">{{ field.label }}</label>
        <textarea
          v-if="field.long"
          :id="`k-${field.key}`"
          v-model="form.knowledge[field.key]"
          class="field"
          :class="{ 'field-invalid': errors[field.key] }"
          rows="3"
        ></textarea>
        <input
          v-else
          :id="`k-${field.key}`"
          v-model.trim="form.knowledge[field.key]"
          class="field"
          :class="{ 'field-invalid': errors[field.key] }"
          type="text"
        />
        <p v-if="field.help" class="hint">{{ field.help }}</p>
      </div>
    </div>

    <!-- What the agent does is fixed per kind of business; shown, not edited. -->
    <div class="mt-10 border-t border-hairline pt-8">
      <h2 class="section-title">What your agent can do</h2>
      <p class="mt-1 text-sm text-ink-soft">HeyDesk sets these for your kind of business.</p>
      <ul class="mt-4 flex flex-col gap-3">
        <li v-for="job in jobs" :key="job.id" class="flex gap-3">
          <ph-check-circle :size="20" weight="fill" class="mt-px shrink-0 text-brand"></ph-check-circle>
          <div>
            <p class="text-sm font-semibold">{{ capitalize(job.label) }}</p>
            <p class="mt-0.5 text-sm text-ink-soft">{{ job.description }}</p>
          </div>
        </li>
      </ul>
    </div>

    <save-bar :dirty="isDirty" :saving="isSaving" :note="savedNote" @discard="resetForm"></save-bar>
    <div class="h-8"></div>
  </form>
</template>

<script>
import { PhCheckCircle } from '@phosphor-icons/vue';

import FormProblems from '../../components/ui/FormProblems.vue';
import SaveBar from '../../components/ui/SaveBar.vue';
import agentSection from '../../mixins/agentSection.js';

// Edited on the Delivery and payments section, not here.
const PAYMENT_FIELDS = ['delivers', 'delivery_charge', 'deposit', 'pay_first', 'delivery', 'free_delivery_over'];

// Friendlier words than the schema's field names, for a desk's own details.
const FIELD_WORDS = {
  address: { label: 'Address' },
  policies: {
    label: 'Policies',
    long: true,
    help: 'Payment, cancellations, what to bring, anything customers should know before they come.',
  },
  about: { label: 'About your business', long: true, help: 'What you do and who is on the team.' },
  services: { label: 'Services', long: true, help: 'What you offer, one per line, with prices if you have them.' },
  emergency_phone: {
    label: 'Emergency phone number',
    help: 'Where to send someone who needs help right now.',
  },
};

export default {
  components: { FormProblems, SaveBar, PhCheckCircle },
  mixins: [agentSection],
  computed: {
    jobs() {
      return this.$store.getters['agent/jobs'];
    },
    // A desk's own details come from its schema; hours have their own section.
    fields() {
      const properties = (this.preset && this.preset.knowledge_schema.properties) || {};
      return Object.keys(properties)
        .filter((key) => key !== 'hours' && !PAYMENT_FIELDS.includes(key))
        .map((key) => {
          const words = FIELD_WORDS[key] || {};
          return {
            key,
            label: words.label || properties[key].title || key,
            long: !!words.long,
            help: words.help,
          };
        });
    },
  },
  watch: {
    // The preset (and so the fields) can arrive after the config.
    preset() {
      if (!this.isDirty && this.config) this.resetForm();
    },
  },
  methods: {
    formFrom(config) {
      const knowledge = {};
      this.fields.forEach(({ key }) => {
        knowledge[key] = config.knowledge[key] || '';
      });
      return {
        name: config.name,
        business_name: config.business_name,
        greeting: config.greeting,
        knowledge,
      };
    },
    patchFrom(form) {
      return { ...form };
    },
    capitalize(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
  },
};
</script>
