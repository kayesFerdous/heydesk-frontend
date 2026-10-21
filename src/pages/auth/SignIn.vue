<template>
  <div class="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
      <BrandMark class="self-start"></BrandMark>

      <div class="my-auto w-full max-w-sm py-12">
        <h1 class="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em]">
          {{ t(`signIn.${mode}Title`) }}
        </h1>
        <p class="mt-2 text-ink-soft">{{ t(`signIn.${mode}Text`, { email }) }}</p>

        <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
          <div v-if="mode === 'signup'">
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

          <div v-if="asksEmail">
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

          <!-- The 6-digit code we emailed: after signup, or to reset a password -->
          <div v-if="asksCode">
            <label class="label" for="code">{{ t('signIn.code') }}</label>
            <input
              id="code"
              v-model.trim="code"
              class="field tabular-nums tracking-[0.3em]"
              :class="{ 'field-invalid': !codeValid }"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              @blur="codeValid = true"
            />
          </div>

          <div v-if="asksPassword">
            <label class="label" for="password">
              {{ mode === 'reset' ? t('signIn.newPassword') : t('signIn.password') }}
            </label>
            <input
              id="password"
              v-model="password"
              class="field"
              :class="{ 'field-invalid': !passwordValid }"
              type="password"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
              @blur="passwordValid = true"
            />
            <p v-if="mode !== 'signin'" class="hint">{{ t('signIn.passwordHint') }}</p>
          </div>

          <p v-if="formError" class="flex items-start gap-2 text-sm text-danger" role="alert">
            <PhWarningCircle :size="18" class="mt-px shrink-0"></PhWarningCircle>
            {{ formError }}
          </p>
          <p v-else-if="sentAgain" class="flex items-start gap-2 text-sm text-success" role="status">
            <PhCheckCircle :size="18" class="mt-px shrink-0"></PhCheckCircle>
            {{ t('signIn.sentAgain') }}
          </p>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            {{ isLoading ? t('signIn.working') : t(`signIn.${mode}Button`) }}
          </button>
        </form>

        <p v-if="mode === 'signin'" class="mt-4 text-sm">
          <button type="button" class="link" @click="go('forgot')">{{ t('signIn.forgot') }}</button>
        </p>
        <p v-if="mode === 'verify'" class="mt-4 text-sm">
          <button type="button" class="link" :disabled="isLoading" @click="sendAgain">
            {{ t('signIn.sendAgain') }}
          </button>
        </p>

        <p class="mt-6 text-sm text-ink-soft">
          <template v-if="mode === 'signin'">
            {{ t('signIn.newHere') }}
            <button type="button" class="link" @click="go('signup')">{{ t('signIn.signupTitle') }}</button>
          </template>
          <template v-else-if="mode === 'signup'">
            {{ t('signIn.haveAccount') }}
            <button type="button" class="link" @click="go('signin')">{{ t('common.signIn') }}</button>
          </template>
          <button v-else type="button" class="link" @click="go('signin')">
            {{ t('signIn.backToSignIn') }}
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

        <!-- The order lands as a passbook entry: dated, coded, stamped. -->
        <div class="step mt-6 overflow-hidden rounded-[var(--radius-panel)] bg-white text-sm text-ink" style="--i: 3">
          <p class="day-head static px-4">{{ t('format.today') }}</p>
          <div class="px-4 py-3.5">
            <InboxRow :row="exampleRow" :time="t('format.justNow')"></InboxRow>
            <p class="mt-2 flex items-center gap-1.5 pl-12 text-xs font-medium text-success">
              <PhSealCheck :size="15" weight="fill" class="shrink-0"></PhSealCheck>
              {{ t('demo.confirmed') }}
            </p>
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
import { PhCheckCircle, PhSealCheck, PhWarningCircle } from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import InboxRow from '../../components/landing/InboxRow.vue';
import { forgotPassword, resendCode } from '../../api/auth.js';
import { formatMoney } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();

// One page, five steps. signin and signup as before; verify is the code emailed after
// signup (no session until it is typed, backend D94); forgot asks for the email and
// reset takes the emailed code and a new password.
// The landing page's "Get started" opens straight on the sign-up form.
const mode = ref(route.query.mode === 'signup' ? 'signup' : 'signin');
const businessName = ref('');
const email = ref('');
const password = ref('');
const code = ref('');
const businessNameValid = ref(true);
const emailValid = ref(true);
const passwordValid = ref(true);
const codeValid = ref(true);
const formError = ref(null);
const sentAgain = ref(false);
const isLoading = ref(false);

const asksEmail = computed(() => ['signin', 'signup', 'forgot'].includes(mode.value));
const asksCode = computed(() => ['verify', 'reset'].includes(mode.value));
const asksPassword = computed(() => ['signin', 'signup', 'reset'].includes(mode.value));
// The example order on the cobalt panel (not a real customer).
const exampleRow = computed(() => ({
  initials: 'TA',
  name: 'Tanvir Ahmed',
  code: 'A-104',
  summary: t('signIn.exampleSummary'),
  amount: formatMoney(90000),
  status: 'new',
}));

function go(next) {
  mode.value = next;
  code.value = '';
  formError.value = null;
  sentAgain.value = false;
}

function validate() {
  businessNameValid.value = mode.value !== 'signup' || businessName.value !== '';
  emailValid.value = !asksEmail.value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
  codeValid.value = !asksCode.value || /^\d{6}$/.test(code.value);
  if (!asksPassword.value) passwordValid.value = true;
  else if (mode.value === 'signin') passwordValid.value = password.value !== '';
  else passwordValid.value = password.value.length >= 8;
  return businessNameValid.value && emailValid.value && codeValid.value && passwordValid.value;
}

// What each step's button does. Returns true once there is a session.
async function run() {
  const form = { email: email.value, password: password.value, code: code.value };
  if (mode.value === 'signup') {
    await auth.signUp({ ...form, workspaceName: businessName.value });
    go('verify');
  } else if (mode.value === 'signin') {
    try {
      await auth.signIn(form);
      return true;
    } catch (error) {
      if (error.code !== 'email_not_verified') throw error;
      // The right password, but the email was never verified: a fresh code, then that step.
      await resendCode(email.value);
      go('verify');
    }
  } else if (mode.value === 'verify') {
    await auth.verify(form);
    return true;
  } else if (mode.value === 'forgot') {
    await forgotPassword(email.value);
    go('reset');
  } else {
    await auth.reset({ ...form, newPassword: password.value });
    return true;
  }
  return false;
}

async function submit() {
  formError.value = null;
  if (!validate()) {
    formError.value = t('signIn.checkFields');
    return;
  }

  isLoading.value = true;
  try {
    if (await run()) router.replace('/');
  } catch (error) {
    formError.value = error.message;
  }
  isLoading.value = false;
}

async function sendAgain() {
  formError.value = null;
  isLoading.value = true;
  try {
    await resendCode(email.value);
    sentAgain.value = true;
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
