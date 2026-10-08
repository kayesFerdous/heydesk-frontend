<template>
  <div class="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
      <brand-mark></brand-mark>

      <div class="my-auto w-full max-w-sm py-12">
        <h1 class="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em]">
          {{ isSignup ? 'Create your business account' : 'Welcome back' }}
        </h1>
        <p class="mt-2 text-ink-soft">
          {{
            isSignup
              ? 'Set up your AI front desk in about five minutes.'
              : 'Sign in to see what your agent took today.'
          }}
        </p>

        <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
          <div v-if="isSignup">
            <label class="label" for="business">Business name</label>
            <input
              id="business"
              v-model.trim="businessName"
              class="field"
              :class="{ 'field-invalid': !businessNameValid }"
              type="text"
              autocomplete="organization"
              @blur="businessNameValid = true"
            />
          </div>

          <div>
            <label class="label" for="email">Email</label>
            <input
              id="email"
              v-model.trim="email"
              class="field"
              :class="{ 'field-invalid': !emailValid }"
              type="email"
              autocomplete="email"
              @blur="emailValid = true"
            />
          </div>

          <div>
            <label class="label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              class="field"
              :class="{ 'field-invalid': !passwordValid }"
              type="password"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              @blur="passwordValid = true"
            />
            <p v-if="isSignup" class="hint">At least 8 characters.</p>
          </div>

          <p v-if="formError" class="flex items-start gap-2 text-sm text-danger" role="alert">
            <ph-warning-circle :size="18" class="mt-px shrink-0"></ph-warning-circle>
            {{ formError }}
          </p>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            {{ buttonLabel }}
          </button>
        </form>

        <p class="mt-6 text-sm text-ink-soft">
          {{ isSignup ? 'Already have an account?' : 'New to HeyDesk?' }}
          <button type="button" class="link" @click="toggleMode">
            {{ isSignup ? 'Sign in' : 'Create your business account' }}
          </button>
        </p>
      </div>
    </div>

    <!-- The brand panel: one cobalt field showing the product doing its job.
         An example conversation (not real data): the agent reads the order
         back, the customer says yes, and only then does it reach the inbox. -->
    <div class="relative hidden overflow-hidden bg-brand text-white lg:flex lg:flex-col lg:justify-center">
      <div class="mx-auto w-full max-w-lg px-12 py-16">
        <p class="text-xs font-medium text-white/60">An example conversation</p>

        <div class="mt-4 flex flex-col gap-2.5 text-sm leading-relaxed">
          <p class="step max-w-[85%] self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-white/12 px-4 py-2.5" style="--i: 0">
            Two chicken biryani for pickup at 8, please.
          </p>
          <p class="step max-w-[85%] rounded-[var(--radius-panel)] rounded-tl-sm bg-white px-4 py-2.5 text-ink" style="--i: 1">
            That is 2 Chicken Biryani, ৳900 in total, ready at 8:00 PM. Shall I place the order?
          </p>
          <p class="step self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-white/12 px-4 py-2.5" style="--i: 2">
            Yes
          </p>
        </div>

        <div class="step mt-6 rounded-[var(--radius-panel)] bg-white p-4 text-ink shadow-[var(--shadow-float)]" style="--i: 3">
          <div class="flex items-center gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand">TA</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold">Tanvir Ahmed <span class="font-normal text-ink-soft">A-104</span></p>
              <p class="text-sm text-ink-soft">2 Chicken Biryani, pickup 8:00 PM</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-sm font-semibold">৳900</span>
              <status-chip status="new"></status-chip>
            </div>
          </div>
        </div>

        <p class="mt-12 text-[1.625rem] leading-snug font-semibold tracking-[-0.02em] text-balance">
          Your front desk answers every customer, even when you are busy.
        </p>
        <p class="mt-3 text-white/75">
          Every order is read back and confirmed before it reaches your inbox.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { PhWarningCircle } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import StatusChip from '../../components/ui/StatusChip.vue';

export default {
  components: { BrandMark, StatusChip, PhWarningCircle },
  data() {
    return {
      // The landing page's "Get started" opens straight on the sign-up form.
      mode: this.$route.query.mode === 'signup' ? 'signup' : 'signin',
      businessName: '',
      email: '',
      password: '',
      businessNameValid: true,
      emailValid: true,
      passwordValid: true,
      formError: null,
      isLoading: false,
    };
  },
  computed: {
    isSignup() {
      return this.mode === 'signup';
    },
    buttonLabel() {
      if (this.isLoading) {
        return this.isSignup ? 'Creating account...' : 'Signing in...';
      }
      return this.isSignup ? 'Create account' : 'Sign in';
    },
  },
  methods: {
    toggleMode() {
      this.mode = this.isSignup ? 'signin' : 'signup';
      this.formError = null;
    },
    validate() {
      this.businessNameValid = !this.isSignup || this.businessName !== '';
      this.emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email);
      this.passwordValid = this.isSignup
        ? this.password.length >= 8
        : this.password !== '';
      return this.businessNameValid && this.emailValid && this.passwordValid;
    },
    async submit() {
      this.formError = null;
      if (!this.validate()) {
        this.formError = 'Check the highlighted fields and try again.';
        return;
      }

      this.isLoading = true;
      try {
        if (this.isSignup) {
          await this.$store.dispatch('auth/signup', {
            email: this.email,
            password: this.password,
            workspaceName: this.businessName,
          });
        } else {
          await this.$store.dispatch('auth/login', {
            email: this.email,
            password: this.password,
          });
        }
        this.$router.replace('/');
      } catch (error) {
        this.formError = error.message;
      }
      this.isLoading = false;
    },
  },
};
</script>

<style scoped>
/* The one authored moment on the front door: the example plays out once, a
   beat apart, in the order it happens. Visible from the start without motion. */
@media (prefers-reduced-motion: no-preference) {
  .step {
    animation: arrive 0.5s var(--ease-settle) both;
    animation-delay: calc(0.25s + var(--i) * 0.45s);
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
