<template>
  <div class="flex min-h-dvh flex-col bg-surface">
    <header class="flex items-center justify-between border-b border-hairline px-5 py-4 sm:px-10">
      <brand-mark></brand-mark>
      <button type="button" class="btn btn-quiet btn-sm" @click="signOut">
        Sign out
      </button>
    </header>

    <main class="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-16 sm:px-10">
      <ol class="flex items-center gap-3 text-sm" aria-label="Progress">
        <li
          v-for="(label, index) in steps"
          :key="label"
          class="flex items-center gap-3"
          :class="index > 0 ? 'flex-1' : ''"
        >
          <span v-if="index > 0" class="h-px flex-1 bg-hairline"></span>
          <span class="flex items-center gap-2" :aria-current="index === step ? 'step' : undefined">
            <span
              class="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold"
              :class="index <= step ? 'bg-brand text-white' : 'bg-hover text-ink-soft'"
            >
              <ph-check v-if="index < step" :size="14" weight="bold"></ph-check>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span :class="index === step ? 'font-semibold' : 'text-ink-soft'">{{ label }}</span>
          </span>
        </li>
      </ol>

      <!-- Step 1: choose -->
      <section v-if="step === 0" class="mt-12">
        <h1 class="text-[1.75rem] font-semibold tracking-[-0.025em]">What should your agent do?</h1>
        <p class="mt-2 text-ink-soft">Pick a starting point. You can change everything later.</p>

        <p v-if="loadError" class="mt-8 text-sm text-danger" role="alert">
          {{ loadError }}
          <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="loadPresets">
            Try again
          </button>
        </p>

        <div v-else class="mt-8 grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Preset">
          <button
            v-for="preset in presets"
            :key="preset.id"
            type="button"
            role="radio"
            :aria-checked="preset.id === presetId"
            class="choice"
            :class="{ 'choice-selected': preset.id === presetId }"
            @click="presetId = preset.id"
          >
            <span class="grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-brand-tint text-brand">
              <component :is="iconFor(preset.id)" :size="24"></component>
            </span>
            <span class="mt-4 block text-base font-semibold">{{ preset.label }}</span>
            <span class="mt-1 block text-sm leading-relaxed text-ink-soft">{{ preset.description }}</span>
            <ph-check-circle
              v-if="preset.id === presetId"
              :size="22"
              weight="fill"
              class="absolute top-4 right-4 text-brand"
            ></ph-check-circle>
          </button>
        </div>

        <div class="mt-10 flex items-center justify-between">
          <p class="text-sm text-ink-soft">You will be live in about five minutes.</p>
          <button type="button" class="btn btn-primary" :disabled="!presetId" @click="step = 1">
            Continue
          </button>
        </div>
      </section>

      <!-- Step 2: details -->
      <section v-else-if="step === 1" class="mt-12">
        <h1 class="text-[1.75rem] font-semibold tracking-[-0.025em]">Tell us about your business</h1>
        <p class="mt-2 text-ink-soft">Just the basics. Opening hours, menu and the rest come next.</p>

        <form class="mt-8 flex max-w-lg flex-col gap-5" novalidate @submit.prevent="create">
          <div>
            <label class="label" for="business-name">Business name</label>
            <input
              id="business-name"
              v-model.trim="businessName"
              class="field"
              :class="{ 'field-invalid': fieldErrors.business_name }"
              type="text"
              autocomplete="organization"
              @input="onBusinessInput"
            />
            <p v-if="fieldErrors.business_name" class="error-text">
              {{ fieldErrors.business_name }}
            </p>
          </div>

          <div>
            <label class="label" for="agent-name">What should customers call your agent?</label>
            <input
              id="agent-name"
              v-model.trim="agentName"
              class="field"
              :class="{ 'field-invalid': fieldErrors.name }"
              type="text"
              @input="agentNameEdited = true"
            />
            <p v-if="fieldErrors.name" class="error-text">{{ fieldErrors.name }}</p>
          </div>

          <div>
            <label class="label" for="address">Address <span class="font-normal text-ink-soft">(optional)</span></label>
            <input id="address" v-model.trim="address" class="field" type="text" autocomplete="street-address" />
          </div>

          <p v-if="formError" class="text-sm text-danger" role="alert">{{ formError }}</p>

          <div class="mt-2 flex items-center justify-between">
            <button type="button" class="btn btn-quiet" :disabled="isCreating" @click="step = 0">Back</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreating">
              {{ isCreating ? 'Creating your agent...' : 'Create my agent' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Step 3: try it -->
      <section v-else class="mt-12">
        <h1 class="text-[1.75rem] font-semibold tracking-[-0.025em]">Your agent is ready. Try it.</h1>
        <p class="mt-2 text-ink-soft">
          Say hello, ask a question, or place a test order. This is what your customers will see.
        </p>

        <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div class="h-[28rem] overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-wash">
            <agent-chat v-if="publicKey" :public-key="publicKey"></agent-chat>
          </div>

          <div class="flex flex-col gap-6">
            <copy-field v-if="publicKey" label="Chat link" :value="link"></copy-field>
            <div v-if="missing.length" class="rounded-[var(--radius-panel)] border border-hairline bg-wash p-4 text-sm">
              <p class="font-semibold">Still to fill in</p>
              <ul class="mt-2 list-disc pl-5 text-ink-soft">
                <li v-for="item in missing" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div class="flex flex-col gap-2">
              <router-link to="/agent" class="btn btn-primary">Finish setting up</router-link>
              <router-link to="/home" class="btn btn-quiet">Go to Home</router-link>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { PhCheck, PhCheckCircle } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import CopyField from '../../components/ui/CopyField.vue';
import AgentChat from '../../components/chat/AgentChat.vue';
import { presetIcon, chatLink } from '../../lib/presets.js';

export default {
  components: { BrandMark, CopyField, AgentChat, PhCheck, PhCheckCircle },
  data() {
    return {
      step: 0,
      steps: ['Choose', 'Your details', 'Try it'],
      presetId: null,
      businessName: '',
      agentName: '',
      agentNameEdited: false,
      address: '',
      fieldErrors: {},
      formError: null,
      loadError: null,
      isCreating: false,
    };
  },
  computed: {
    // Most common first; a preset the frontend has not heard of goes last.
    presets() {
      const order = ['restaurant', 'receptionist', 'clinic'];
      const rank = (p) => (order.includes(p.id) ? order.indexOf(p.id) : order.length);
      return [...this.$store.getters['agent/presets']].sort((a, b) => rank(a) - rank(b));
    },
    publicKey() {
      return this.$store.getters['agent/publicKey'];
    },
    missing() {
      return this.$store.getters['agent/missing'];
    },
    link() {
      return chatLink(this.publicKey);
    },
  },
  async created() {
    // An agent already exists: this wizard is only for the first run.
    try {
      await this.$store.dispatch('agent/load');
    } catch (error) {
      this.loadError = error.message;
      return;
    }
    if (this.$store.getters['agent/hasAgent']) {
      this.$router.replace('/agent');
      return;
    }

    const business = this.$store.getters['auth/business'];
    this.businessName = business ? business.name : '';
    this.agentName = this.suggestedName();
    this.loadPresets();
  },
  methods: {
    iconFor: presetIcon,
    async loadPresets() {
      this.loadError = null;
      try {
        await this.$store.dispatch('agent/loadPresets');
      } catch (error) {
        this.loadError = error.message;
      }
    },
    suggestedName() {
      return this.businessName ? `${this.businessName} assistant` : '';
    },
    // The agent's name follows the business name until the owner types their own.
    onBusinessInput() {
      if (!this.agentNameEdited) this.agentName = this.suggestedName();
    },
    async create() {
      this.fieldErrors = {};
      this.formError = null;
      if (!this.businessName) {
        this.fieldErrors = { business_name: 'Enter your business name.' };
        return;
      }
      if (!this.agentName) {
        this.fieldErrors = { name: 'Give your agent a name.' };
        return;
      }

      this.isCreating = true;
      try {
        await this.$store.dispatch('agent/create', {
          preset: this.presetId,
          config: {
            business_name: this.businessName,
            name: this.agentName,
            knowledge: this.address ? { address: this.address } : {},
          },
        });
        this.step = 2;
      } catch (error) {
        this.formError = error.message;
        if (error.fields) this.fieldErrors = error.fields;
      }
      this.isCreating = false;
    },
    signOut() {
      this.$store.dispatch('auth/logout');
      this.$router.replace('/sign-in');
    },
  },
};
</script>

<style scoped>
.choice {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-panel);
  padding: 1.25rem;
  text-align: left;
  background-color: var(--color-surface);
  transition: border-color 0.2s var(--ease-settle),
    background-color 0.2s var(--ease-settle);
}

.choice:hover {
  border-color: var(--color-line-strong);
  background-color: var(--color-wash);
}

.choice-selected,
.choice-selected:hover {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 1px var(--color-brand);
  background-color: var(--color-brand-tint);
}
</style>
