<template>
  <!-- Settings that belong to the person signed in, not to the business or
       the agent: their language, their sign-in. Future personal settings
       (notifications, password) are one more SettingsGroup here. -->
  <section>
    <PageHeader :title="t('shell.account')"></PageHeader>

    <div class="max-w-4xl px-5 pb-12 sm:px-8">
      <SettingsGroup :title="t('common.language')" :tip="t('account.languageTip')">
        <!-- Each language is shown in its own words and digits, so the way
             back is readable whichever one is on. -->
        <div class="border-t border-hairline" role="radiogroup" :aria-label="t('common.language')">
          <button
            v-for="option in LOCALES"
            :key="option.code"
            type="button"
            role="radio"
            :aria-checked="locale === option.code"
            :lang="option.code"
            class="row flex w-full items-center gap-4 px-3 py-3.5 text-left"
            :class="{ 'row-selected': locale === option.code }"
            @click="setLocale(option.code)"
          >
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">{{ option.label }}</span>
              <span class="mt-0.5 block text-sm text-ink-soft">{{ sample(option) }}</span>
            </span>
            <PhCheckCircle v-if="locale === option.code" :size="22" weight="fill" class="shrink-0 text-brand" aria-hidden="true"></PhCheckCircle>
            <PhCircle v-else :size="22" class="shrink-0 text-line-strong" aria-hidden="true"></PhCircle>
          </button>
        </div>

        <!-- The question every owner asks next: does this change the agent? -->
        <p class="flex items-start gap-2 text-sm text-ink-soft">
          <PhChatCircleDots :size="18" class="mt-px shrink-0 text-ink-faint"></PhChatCircleDots>
          {{ t('account.agentLanguage') }}
        </p>
      </SettingsGroup>

      <SettingsGroup :title="t('account.signedIn')">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-semibold text-brand" aria-hidden="true">
              {{ email.charAt(0).toUpperCase() }}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold">{{ email }}</span>
              <span class="block text-sm text-ink-soft">{{ auth.isAdmin ? t('shell.heyDeskAdmin') : t('shell.owner') }}</span>
            </span>
          </div>
          <button type="button" class="btn btn-secondary" @click="signOut">
            <PhSignOut :size="16"></PhSignOut>
            {{ t('common.signOut') }}
          </button>
        </div>
      </SettingsGroup>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PhChatCircleDots, PhCheckCircle, PhCircle, PhSignOut } from '@phosphor-icons/vue';

import PageHeader from '../../components/ui/PageHeader.vue';
import SettingsGroup from '../../components/ui/SettingsGroup.vue';
import { LOCALES, setLocale } from '../../i18n/index.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

const router = useRouter();
const { t, locale } = useI18n();
const auth = useAuthStore();

const email = computed(() => auth.me?.email ?? '');

// What the console looks like in that language: its words and its digits.
function sample(option) {
  return t(
    'account.languageSample',
    { n: formatNumber(3, undefined, option.tag), money: formatMoney(184000, option.tag) },
    { locale: option.code },
  );
}

function signOut() {
  auth.logout();
  router.replace('/sign-in');
}
</script>
