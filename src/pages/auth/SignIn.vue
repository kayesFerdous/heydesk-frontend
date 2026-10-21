<template>
  <div class="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
      <BrandMark class="self-start"></BrandMark>

      <div class="my-auto w-full max-w-sm py-12">
        <!-- The code steps lead back to where the owner came from. -->
        <button v-if="isCodeStep" type="button" class="btn btn-quiet btn-sm -ml-3 mb-8" @click="goBack">
          <PhArrowLeft :size="16"></PhArrowLeft>
          {{ mode === 'verify' && cameFrom === 'signup' ? t('signIn.changeEmail') : t('signIn.backToSignIn') }}
        </button>

        <span v-if="stepIcon" class="mb-5 grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-brand-tint text-brand" aria-hidden="true">
          <component :is="stepIcon" :size="22"></component>
        </span>

        <h1 class="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-balance">
          {{ t(`signIn.${mode}Title`) }}
        </h1>
        <!-- Where the code went, with the address in ink so a typo shows at a glance. -->
        <i18n-t
          v-if="mode === 'verify' || mode === 'reset'"
          :keypath="`signIn.${mode}Text`"
          tag="p"
          class="mt-2 text-ink-soft text-pretty"
          scope="global"
        >
          <template #email>
            <span class="inline-block max-w-full font-medium break-all text-ink">{{ email }}</span>
          </template>
        </i18n-t>
        <p v-else class="mt-2 text-ink-soft text-pretty">{{ t(`signIn.${mode}Text`) }}</p>

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
              ref="emailInput"
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
            <CodeInput
              id="code"
              ref="codeInput"
              v-model="code"
              :invalid="codeWrong"
              :disabled="isLoading"
              @complete="onCodeComplete"
            ></CodeInput>
            <p class="hint flex flex-wrap items-center gap-x-1">
              <span>{{ t('signIn.noCode') }}</span>
              <button v-if="cooldown === 0" type="button" class="link" @click="sendAgain">
                {{ t('signIn.sendAgain') }}
              </button>
              <span v-else>{{ t('signIn.sendAgainIn', { seconds: formatNumber(cooldown) }) }}</span>
            </p>
          </div>

          <div v-if="asksPassword">
            <label class="label" for="password">
              {{ mode === 'reset' ? t('signIn.newPassword') : t('signIn.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                ref="passwordInput"
                v-model="password"
                class="field pr-11"
                :class="{ 'field-invalid': !passwordValid }"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                @blur="passwordValid = true"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[var(--radius-control)] text-ink-faint transition-colors hover:text-ink focus-visible:text-ink"
                :aria-label="showPassword ? t('signIn.hidePassword') : t('signIn.showPassword')"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? PhEyeSlash : PhEye" :size="18"></component>
              </button>
            </div>
            <p v-if="mode !== 'signin'" class="hint">{{ t('signIn.passwordHint') }}</p>
            <p v-else class="hint">
              <button type="button" class="link" @click="go('forgot')">{{ t('signIn.forgot') }}</button>
            </p>
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

        <p v-if="mode === 'signin' || mode === 'signup'" class="mt-6 text-sm text-ink-soft">
          {{ mode === 'signin' ? t('signIn.newHere') : t('signIn.haveAccount') }}
          <button type="button" class="link" @click="go(mode === 'signin' ? 'signup' : 'signin')">
            {{ mode === 'signin' ? t('signIn.signupTitle') : t('common.signIn') }}
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
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  PhArrowLeft,
  PhCheckCircle,
  PhEnvelopeSimpleOpen,
  PhEye,
  PhEyeSlash,
  PhLockKey,
  PhSealCheck,
  PhWarningCircle,
} from '@phosphor-icons/vue';

import BrandMark from '../../components/ui/BrandMark.vue';
import CodeInput from '../../components/ui/CodeInput.vue';
import InboxRow from '../../components/landing/InboxRow.vue';
import { forgotPassword, resendCode } from '../../api/auth.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
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
const cameFrom = ref('signin'); // where Back goes from a code step
const businessName = ref('');
const email = ref('');
const password = ref('');
const code = ref('');
const showPassword = ref(false);
const businessNameValid = ref(true);
const emailValid = ref(true);
const passwordValid = ref(true);
const codeWrong = ref(false);
const formError = ref(null);
const sentAgain = ref(false);
const isLoading = ref(false);

const emailInput = ref(null);
const codeInput = ref(null);
const passwordInput = ref(null);

const asksEmail = computed(() => ['signin', 'signup', 'forgot'].includes(mode.value));
const asksCode = computed(() => ['verify', 'reset'].includes(mode.value));
const asksPassword = computed(() => ['signin', 'signup', 'reset'].includes(mode.value));
const isCodeStep = computed(() => ['verify', 'forgot', 'reset'].includes(mode.value));
const stepIcon = computed(() => {
  if (asksCode.value) return PhEnvelopeSimpleOpen;
  return mode.value === 'forgot' ? PhLockKey : null;
});
// The example order on the cobalt panel (not a real customer).
const exampleRow = computed(() => ({
  initials: 'TA',
  name: 'Tanvir Ahmed',
  code: 'A-104',
  summary: t('signIn.exampleSummary'),
  amount: formatMoney(90000),
  status: 'new',
}));

// "Send it again" waits a minute after each email: the code takes a moment to arrive,
// and the backend allows three an hour.
const COOLDOWN_SECONDS = 60;
const cooldown = ref(0);
let timer = null;

function startCooldown() {
  cooldown.value = COOLDOWN_SECONDS;
  clearInterval(timer);
  timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0) clearInterval(timer);
  }, 1000);
}

onUnmounted(() => clearInterval(timer));

// Typing again after a wrong code takes the red away.
watch(code, (now) => {
  if (now.length) codeWrong.value = false;
});

function go(next) {
  if (next === 'verify' || next === 'forgot') cameFrom.value = mode.value;
  mode.value = next;
  code.value = '';
  codeWrong.value = false;
  showPassword.value = false;
  formError.value = null;
  sentAgain.value = false;
  nextTick(() => {
    if (next === 'forgot') emailInput.value?.focus();
  });
}

function goBack() {
  go(mode.value === 'verify' ? cameFrom.value : 'signin');
}

function validate() {
  businessNameValid.value = mode.value !== 'signup' || businessName.value !== '';
  emailValid.value = !asksEmail.value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
  const codeValid = !asksCode.value || code.value.length === 6;
  if (!asksPassword.value) passwordValid.value = true;
  else if (mode.value === 'signin') passwordValid.value = password.value !== '';
  else passwordValid.value = password.value.length >= 8;
  return businessNameValid.value && emailValid.value && codeValid && passwordValid.value;
}

// The last digit of the code: verify goes at once; reset still needs the new password.
function onCodeComplete() {
  if (mode.value === 'verify') submit();
  else if (password.value.length < 8) passwordInput.value?.focus();
  else submit();
}

// What each step's button does. Returns true once there is a session.
async function run() {
  const form = { email: email.value, password: password.value, code: code.value };
  if (mode.value === 'signup') {
    await auth.signUp({ ...form, workspaceName: businessName.value });
    go('verify');
    startCooldown();
  } else if (mode.value === 'signin') {
    try {
      await auth.signIn(form);
      return true;
    } catch (error) {
      if (error.code !== 'email_not_verified') throw error;
      // The right password, but the email was never verified: a fresh code, then that step.
      await resendCode(email.value);
      go('verify');
      startCooldown();
    }
  } else if (mode.value === 'verify') {
    await auth.verify(form);
    return true;
  } else if (mode.value === 'forgot') {
    await forgotPassword(email.value);
    go('reset');
    startCooldown();
  } else {
    await auth.reset({ ...form, newPassword: password.value });
    return true;
  }
  return false;
}

async function submit() {
  if (isLoading.value) return;
  formError.value = null;
  sentAgain.value = false;
  if (!validate()) {
    formError.value = asksCode.value && code.value.length < 6 ? t('signIn.codeShort') : t('signIn.checkFields');
    return;
  }

  isLoading.value = true;
  try {
    if (await run()) router.replace('/');
  } catch (error) {
    formError.value = error.message;
    // A wrong or expired code (403): empty the cells for another try.
    if (asksCode.value && error.status === 403) {
      code.value = '';
      codeWrong.value = true;
    }
  }
  isLoading.value = false;
  // A code step's cells take the typing (they were disabled while this ran).
  if (asksCode.value) nextTick(() => codeInput.value?.focus());
}

async function sendAgain() {
  formError.value = null;
  isLoading.value = true;
  try {
    // The reset step's code comes from "forgot"; the verify step's from signup.
    if (mode.value === 'reset') await forgotPassword(email.value);
    else await resendCode(email.value);
    sentAgain.value = true;
    code.value = '';
    startCooldown();
  } catch (error) {
    formError.value = error.message;
  }
  isLoading.value = false;
  nextTick(() => codeInput.value?.focus());
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
