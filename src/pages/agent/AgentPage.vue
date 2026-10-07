<template>
  <section class="flex flex-col lg:h-full">
    <header class="border-b border-hairline px-5 py-6 sm:px-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-[1.75rem] font-semibold tracking-tight">Your agent</h1>
          <p class="mt-1 text-ink-soft">Changes go live on the next message.</p>
        </div>

        <div v-if="form" class="flex items-center gap-4">
          <span v-if="suspended" class="chip bg-attention-tint text-attention">Paused by HeyDesk</span>
          <span v-else class="chip bg-success-tint text-success">
            <span class="live-dot h-2 w-2 rounded-full bg-success"></span>
            Live
          </span>
          <span class="hidden text-sm text-ink-soft sm:inline" aria-live="polite">
            {{ saveNote }}
          </span>
          <button type="button" class="btn btn-primary" :disabled="!isDirty || isSaving" @click="save">
            {{ isSaving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </header>

    <p v-if="loadError" class="px-5 py-10 text-sm sm:px-8" role="alert">
      <span class="text-danger">{{ loadError }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">
        Try again
      </button>
    </p>

    <div v-else-if="!form" class="px-5 py-8 sm:px-8" aria-hidden="true">
      <div class="skeleton h-5 w-40"></div>
      <div class="skeleton mt-4 h-11 w-full max-w-xl"></div>
      <div class="skeleton mt-4 h-11 w-full max-w-xl"></div>
    </div>

    <div v-else class="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <form class="px-5 py-8 sm:px-8 lg:min-h-0 lg:overflow-y-auto" novalidate @submit.prevent="save">
        <div class="max-w-2xl">
          <div
            v-if="missing.length"
            class="mb-8 rounded-[var(--radius-control)] bg-brand-tint px-4 py-3 text-sm"
            role="status"
          >
            <p class="font-semibold">
              {{ missing.length }} {{ missing.length === 1 ? 'thing' : 'things' }} left to fill in
            </p>
            <ul class="mt-1 list-disc pl-5 text-ink-soft">
              <li v-for="item in missing" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div
            v-if="problems.length"
            class="mb-8 rounded-[var(--radius-control)] bg-attention-tint px-4 py-3 text-sm text-attention"
            role="alert"
          >
            <p class="font-semibold">{{ saveError }}</p>
            <ul class="mt-1 list-disc pl-5">
              <li v-for="problem in problems" :key="problem">{{ problem }}</li>
            </ul>
          </div>
          <p v-else-if="saveError" class="mb-8 text-sm text-danger" role="alert">{{ saveError }}</p>

          <!-- Where customers reach the agent: live actions, not part of Save -->
          <div>
            <h2 class="text-lg font-semibold tracking-tight">Where customers reach you</h2>
            <p class="mt-1 text-sm text-ink-soft">Your agent answers on each of these, day and night.</p>
            <ul class="mt-4 divide-y divide-hairline border-y border-hairline">
              <li class="flex items-start gap-3 py-4">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand" aria-hidden="true">
                  <ph-globe :size="20"></ph-globe>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold">Website chat</p>
                  <p class="mt-0.5 text-sm text-ink-soft">Put this link on your website or social pages.</p>
                  <div class="mt-3">
                    <copy-field v-if="publicKey" label="Chat link" :value="link"></copy-field>
                  </div>
                </div>
              </li>
              <li class="py-4">
                <telegram-connect :business-name="config.business_name"></telegram-connect>
              </li>
            </ul>
          </div>

          <!-- Basics -->
          <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
            <h2 class="text-lg font-semibold tracking-tight">Basics</h2>
            <div>
              <label class="label" for="agent-name">Agent name</label>
              <input id="agent-name" v-model.trim="form.name" class="field" :class="{ 'field-invalid': errors.name }" type="text" />
              <p v-if="errors.name" class="mt-1.5 text-sm text-danger">{{ errors.name }}</p>
            </div>
            <div>
              <label class="label" for="business-name">Business name</label>
              <input id="business-name" v-model.trim="form.business_name" class="field" :class="{ 'field-invalid': errors.business_name }" type="text" />
              <p v-if="errors.business_name" class="mt-1.5 text-sm text-danger">{{ errors.business_name }}</p>
            </div>
            <div>
              <label class="label" for="greeting">Greeting</label>
              <textarea id="greeting" v-model="form.greeting" class="field !h-auto py-2.5" :class="{ 'field-invalid': errors.greeting }" rows="2"></textarea>
              <p class="mt-1.5 text-xs text-ink-soft">
                The first thing customers see. Write {business_name} to insert your business name.
              </p>
            </div>
          </div>

          <!-- Jobs: what customers can get done -->
          <div class="mt-10 border-t border-hairline pt-8">
            <h2 class="text-lg font-semibold tracking-tight">What your agent can do</h2>
            <p class="mt-1 text-sm text-ink-soft">
              HeyDesk sets these for your kind of business.
            </p>
            <ul class="mt-4 divide-y divide-hairline border-y border-hairline">
              <li v-for="job in jobs" :key="job.id" class="py-4">
                <p class="text-sm font-semibold">{{ capitalize(job.label) }}</p>
                <p class="mt-0.5 text-sm text-ink-soft">{{ job.description }}</p>
              </li>
            </ul>
          </div>

          <!-- Business details, from the preset -->
          <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
            <h2 class="text-lg font-semibold tracking-tight">About your business</h2>
            <div v-for="field in knowledgeFields" :key="field.key">
              <label class="label" :for="`k-${field.key}`">{{ field.label }}</label>
              <textarea
                v-if="field.long"
                :id="`k-${field.key}`"
                v-model="form.knowledge[field.key]"
                class="field !h-auto py-2.5"
                :class="{ 'field-invalid': errors[`knowledge.${field.key}`] }"
                rows="3"
              ></textarea>
              <input
                v-else
                :id="`k-${field.key}`"
                v-model.trim="form.knowledge[field.key]"
                class="field"
                :class="{ 'field-invalid': errors[`knowledge.${field.key}`] }"
                type="text"
              />
              <p v-if="field.help" class="mt-1.5 text-xs text-ink-soft">{{ field.help }}</p>
            </div>
          </div>

          <!-- Hours -->
          <div v-if="hasHours" class="mt-10 border-t border-hairline pt-8">
            <h2 class="text-lg font-semibold tracking-tight">Opening hours</h2>
            <p class="mt-1 mb-4 text-sm text-ink-soft">Your agent tells customers when you are open.</p>
            <hours-editor v-model="form.hours"></hours-editor>
          </div>

          <!-- Voice -->
          <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
            <h2 class="text-lg font-semibold tracking-tight">How your agent should sound</h2>
            <div>
              <label class="label" for="notes">Notes for your agent</label>
              <textarea id="notes" v-model="form.notes" class="field !h-auto py-2.5" rows="4" placeholder="Be warm and brief. Mention that we are pickup only."></textarea>
              <p class="mt-1.5 text-xs text-ink-soft">Tone, rules, anything it should always say or never say.</p>
            </div>
            <div>
              <label class="label" for="faq">Questions customers ask</label>
              <textarea id="faq" v-model="form.faq" class="field !h-auto py-2.5" rows="6" placeholder="Is there parking? There is a public car park two minutes away."></textarea>
              <p class="mt-1.5 text-xs text-ink-soft">Write each question with its answer. Your agent uses these to reply.</p>
            </div>
            <p class="text-sm text-ink-soft">
              Longer material, like a price list or a policy document, goes in
              <router-link to="/knowledge" class="font-semibold text-brand hover:underline">Knowledge</router-link>.
            </p>
          </div>

          <!-- Hand-off -->
          <div class="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
            <div>
              <h2 class="text-lg font-semibold tracking-tight">When a person is needed</h2>
              <p class="mt-1 text-sm text-ink-soft">What customers hear and how they reach you when they ask for a person.</p>
            </div>
            <div>
              <label class="label" for="handoff-message">Message</label>
              <input id="handoff-message" v-model="form.handoff.message" class="field" type="text" />
            </div>
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="handoff-phone">Phone</label>
                <input id="handoff-phone" v-model.trim="form.handoff.phone" class="field" type="tel" autocomplete="off" />
              </div>
              <div>
                <label class="label" for="handoff-email">Email</label>
                <input id="handoff-email" v-model.trim="form.handoff.email" class="field" type="email" autocomplete="off" />
              </div>
            </div>
          </div>

          <div class="mt-10 border-t border-hairline pt-8 lg:hidden">
            <button type="button" class="btn btn-secondary w-full" @click="openSheet">
              Talk to your agent
            </button>
          </div>

          <div class="mt-10 flex items-center gap-4 pb-8 lg:hidden">
            <button type="submit" class="btn btn-primary flex-1" :disabled="!isDirty || isSaving">
              {{ isSaving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </div>
      </form>

      <aside class="hidden border-l border-hairline bg-wash lg:flex lg:min-h-0 lg:flex-col">
        <div class="flex items-center justify-between px-5 pt-5">
          <h2 class="text-lg font-semibold tracking-tight">Try your agent</h2>
        </div>
        <div class="min-h-0 flex-1">
          <agent-chat v-if="publicKey" :key="chatKey" :public-key="publicKey"></agent-chat>
        </div>
      </aside>
    </div>
  </section>
</template>

<script>
import { PhGlobe } from '@phosphor-icons/vue';

import HoursEditor from '../../components/agent/HoursEditor.vue';
import TelegramConnect from '../../components/agent/TelegramConnect.vue';
import CopyField from '../../components/ui/CopyField.vue';
import AgentChat from '../../components/chat/AgentChat.vue';
import { normalizeHours, DAYS } from '../../lib/hours.js';
import { chatLink } from '../../lib/presets.js';

// Friendlier words than the schema's field names, for the preset knowledge.
const KNOWLEDGE_LABELS = {
  address: { label: 'Address' },
  policies: {
    label: 'Policies',
    long: true,
    help: 'Allergens, delivery area, payment, anything customers should know.',
  },
  about: { label: 'About your business', long: true, help: 'What you do and who is on the team.' },
  emergency_phone: {
    label: 'Emergency phone number',
    help: 'Where to send someone who needs help right now.',
  },
};

export default {
  components: { HoursEditor, TelegramConnect, CopyField, AgentChat, PhGlobe },
  data() {
    return {
      form: null,
      baseline: '',
      loadError: null,
      saveError: null,
      problems: [],
      errors: {},
      isSaving: false,
      savedAt: null,
      chatKey: 0,
    };
  },
  computed: {
    config() {
      return this.$store.getters['agent/config'];
    },
    missing() {
      return this.$store.getters['agent/missing'];
    },
    jobs() {
      return this.$store.getters['agent/jobs'];
    },
    publicKey() {
      return this.$store.getters['agent/publicKey'];
    },
    preset() {
      return this.$store.getters['agent/preset'];
    },
    suspended() {
      return this.$store.getters['auth/isSuspended'];
    },
    link() {
      return chatLink(this.publicKey);
    },
    // The business details a preset asks for come from its JSON schema.
    knowledgeFields() {
      const properties = (this.preset && this.preset.knowledge_schema.properties) || {};
      return Object.keys(properties)
        .filter((key) => key !== 'hours')
        .map((key) => ({
          key,
          label: (KNOWLEDGE_LABELS[key] && KNOWLEDGE_LABELS[key].label) || properties[key].title || key,
          long: !!(KNOWLEDGE_LABELS[key] && KNOWLEDGE_LABELS[key].long),
          help: KNOWLEDGE_LABELS[key] && KNOWLEDGE_LABELS[key].help,
        }));
    },
    hasHours() {
      const properties = (this.preset && this.preset.knowledge_schema.properties) || {};
      return 'hours' in properties;
    },
    isDirty() {
      return !!this.form && JSON.stringify(this.form) !== this.baseline;
    },
    saveNote() {
      if (this.isDirty) return 'Unsaved changes';
      return this.savedAt ? 'Saved just now' : '';
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loadError = null;
      try {
        await Promise.all([
          this.$store.dispatch('agent/load'),
          this.$store.dispatch('agent/loadPresets'),
        ]);
      } catch (error) {
        this.loadError = error.message;
        return;
      }
      if (this.$store.getters['agent/noAgent']) {
        this.$router.replace('/setup');
        return;
      }
      this.resetForm();
    },
    resetForm() {
      const c = this.config;
      const knowledge = { ...c.knowledge };
      this.knowledgeFields.forEach(({ key }) => {
        knowledge[key] = knowledge[key] || '';
      });
      this.form = {
        name: c.name,
        business_name: c.business_name,
        greeting: c.greeting,
        notes: c.notes || '',
        faq: c.faq || '',
        knowledge,
        hours: normalizeHours(c.knowledge.hours),
        handoff: {
          message: c.handoff.message,
          phone: c.handoff.phone || '',
          email: c.handoff.email || '',
        },
      };
      this.baseline = JSON.stringify(this.form);
    },
    // The API wants the whole `knowledge`, with closed days as null.
    buildPatch() {
      const f = this.form;
      const knowledge = { ...f.knowledge };
      if (this.hasHours) {
        const hours = {};
        DAYS.forEach(({ key }) => (hours[key] = f.hours[key]));
        knowledge.hours = hours;
      }
      return {
        name: f.name,
        business_name: f.business_name,
        greeting: f.greeting,
        notes: f.notes,
        faq: f.faq,
        knowledge,
        handoff: {
          message: f.handoff.message,
          phone: f.handoff.phone || null,
          email: f.handoff.email || null,
        },
      };
    },
    async save() {
      if (!this.isDirty || this.isSaving) return;
      this.isSaving = true;
      this.saveError = null;
      this.problems = [];
      this.errors = {};
      try {
        await this.$store.dispatch('agent/save', this.buildPatch());
        this.resetForm();
        this.savedAt = Date.now();
        // New settings apply on the next message, so a fresh test chat shows them.
        this.chatKey += 1;
      } catch (error) {
        this.saveError = error.message;
        if (error.fields) {
          this.errors = error.fields;
          this.saveError = 'Some details need a look:';
          this.problems = Object.keys(error.fields).map((path) => `${path}: ${error.fields[path]}`);
        }
      }
      this.isSaving = false;
    },
    capitalize(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    openSheet() {
      this.$store.commit('ui/setTestSheet', true);
    },
  },
};
</script>

<style scoped>
.skeleton {
  border-radius: 0.375rem;
  background-color: var(--color-wash);
  animation: pulse 1.4s ease-in-out infinite;
}

.live-dot {
  animation: breathe 2.4s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@keyframes breathe {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .live-dot {
    animation: none;
  }
}
</style>
