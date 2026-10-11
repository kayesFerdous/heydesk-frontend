<template>
  <div class="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
      <div class="flex items-center justify-between gap-4">
        <BrandMark></BrandMark>
        <LanguageSwitch></LanguageSwitch>
      </div>

      <div class="my-auto w-full max-w-sm py-12">
        <h1 class="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em]">
          {{ isSignup ? t('signIn.createTitle') : t('signIn.welcomeBack') }}
        </h1>
        <p class="mt-2 text-ink-soft">
          {{ isSignup ? t('signIn.createText') : t('signIn.welcomeText') }}
        </p>

        <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
          <div v-if="isSignup">
            <label class="label" for="business">{{ t('common.businessName') }}</label>
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
            <label class="label" for="email">{{ t('common.email') }}</label>
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
            <label class="label" for="password">{{ t('signIn.password') }}</label>
            <input
              id="password"
              v-model="password"
              class="field"
              :class="{ 'field-invalid': !passwordValid }"
              type="password"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              @blur="passwordValid = true"
            />
            <p v-if="isSignup" class="hint">{{ t('signIn.passwordHint') }}</p>
          </div>

          <p v-if="formError" class="flex items-start gap-2 text-sm text-danger" role="alert">
            <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
            {{ formError }}
          </p>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            {{ buttonLabel }}
          </button>
        </form>

        <p class="mt-6 text-sm text-ink-soft">
          {{ isSignup ? t('signIn.haveAccount') : t('signIn.newHere') }}
          <button type="button" class="link" @click="toggleMode">
            {{ isSignup ? t('common.signIn') : t('signIn.createTitle') }}
          </button>
        </p>
      </div>
    </div>

    <!-- The brand panel: one cobalt field showing the product doing its job.
         An example conversation (not real data): the agent reads the order
         back, the customer says yes, and only then does it reach the inbox. -->
    <div class="relative hidden overflow-hidden bg-brand text-white lg:flex lg:flex-col lg:justify-center">
      <div class="mx-auto w-full max-w-lg px-12 py-16">
        <p class="text-xs font-medium text-white/60">{{ t('signIn.example') }}</p>

        <div class="mt-4 flex flex-col gap-2.5 text-sm leading-relaxed">
          <p class="step max-w-[85%] self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-white/12 px-4 py-2.5" style="--i: 0">
            {{ t('signIn.exampleAsk') }}
          </p>
          <p class="step max-w-[85%] rounded-[var(--radius-panel)] rounded-tl-sm bg-white px-4 py-2.5 text-ink" style="--i: 1">
            {{ t('signIn.exampleReadBack') }}
          </p>
          <p class="step self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-white/12 px-4 py-2.5" style="--i: 2">
            {{ t('signIn.exampleYes') }}
          </p>
        </div>

        <div class="step mt-6 rounded-[var(--radius-panel)] bg-white p-4 text-ink shadow-[var(--shadow-float)]" style="--i: 3">
          <div class="flex items-center gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand">TA</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold">Tanvir Ahmed <span class="font-normal text-ink-soft">A-104</span></p>
              <p class="text-sm text-ink-soft">{{ t('signIn.exampleSummary') }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-sm font-semibold">{{ formatMoney(90000) }}</span>
              <StatusChip status="new"></StatusChip>
            </div>
          </div>
        </div>

        <p class="mt-12 text-[1.625rem] leading-snug font-semibold tracking-[-0.02em] text-balance">
          {{ t('signIn.pitch') }}
        </p>
        <p class="mt-3 text-white/75">{{ t('signIn.pitchText') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhWarningCircle } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import LanguageSwitch from '../../components/ui/LanguageSwitch.vue';
import StatusChip from '../../components/ui/StatusChip.vue';
import { formatMoney } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();

// The landing page's "Get started" opens straight on the sign-up form.
const mode = ref(route.query.mode === 'signup' ? 'signup' : 'signin');
const businessName = ref('');
const email = ref('');
const password = ref('');
const businessNameValid = ref(true);
const emailValid = ref(true);
const passwordValid = ref(true);
const formError = ref(null);
const isLoading = ref(false);

const isSignup = computed(() => mode.value === 'signup');
const buttonLabel = computed(() => {
  if (isLoading.value) return isSignup.value ? t('signIn.creating') : t('signIn.signingIn');
  return isSignup.value ? t('signIn.createAccount') : t('common.signIn');
});

function toggleMode() {
  mode.value = isSignup.value ? 'signin' : 'signup';
  formError.value = null;
}

function validate() {
  businessNameValid.value = !isSignup.value || businessName.value !== '';
  emailValid.value = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
  passwordValid.value = isSignup.value ? password.value.length >= 8 : password.value !== '';
  return businessNameValid.value && emailValid.value && passwordValid.value;
}

async function submit() {
  formError.value = null;
  if (!validate()) {
    formError.value = t('signIn.checkFields');
    return;
  }

  isLoading.value = true;
  try {
    if (isSignup.value) {
      await auth.signUp({ email: email.value, password: password.value, workspaceName: businessName.value });
    } else {
      await auth.signIn({ email: email.value, password: password.value });
    }
    router.replace('/');
  } catch (error) {
    formError.value = error.message;
  }
  isLoading.value = false;
}
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
