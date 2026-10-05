<template>
  <div class="grid min-h-dvh lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
    <div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
      <brand-mark></brand-mark>

      <div class="my-auto w-full max-w-sm py-12">
        <h1 class="text-[1.75rem] leading-tight font-semibold tracking-tight">
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
            <p v-if="isSignup" class="mt-1.5 text-xs text-ink-soft">
              At least 8 characters.
            </p>
          </div>

          <p v-if="formError" class="text-sm text-danger" role="alert">
            {{ formError }}
          </p>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            {{ buttonLabel }}
          </button>
        </form>

        <p class="mt-6 text-sm text-ink-soft">
          {{ isSignup ? 'Already have an account?' : 'New to HeyDesk?' }}
          <button
            type="button"
            class="font-semibold text-brand hover:underline"
            @click="toggleMode"
          >
            {{ isSignup ? 'Sign in' : 'Create your business account' }}
          </button>
        </p>
      </div>
    </div>

    <!-- The brand panel: Gigalogy's constellation of connected dots, drawn as a
         faint dot grid, with one plain sentence. Hidden on small screens. -->
    <div class="node-panel relative hidden bg-rail text-white lg:flex lg:flex-col lg:justify-end">
      <div class="relative max-w-lg p-16">
        <p class="text-[1.75rem] leading-snug font-semibold tracking-tight">
          Your front desk answers every customer, even when you are busy.
        </p>
        <p class="mt-3 text-white/70">Orders and messages arrive in one inbox.</p>
      </div>
    </div>
  </div>
</template>

<script>
import BrandMark from '../../components/ui/BrandMark.vue';

export default {
  components: { BrandMark },
  data() {
    return {
      mode: 'signin',
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
.node-panel {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgb(127 176 255 / 0.28) 1.5px,
    transparent 0
  );
  background-size: 36px 36px;
}
</style>
