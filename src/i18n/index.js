import { createI18n } from 'vue-i18n';

import en from './en.js';
import bn from './bn.js';

// The two languages the console speaks. English is the fallback: a key that
// has no Bangla yet shows its English words, never the key itself.
export const LOCALES = [
  { code: 'en', label: 'English', tag: 'en-US' },
  { code: 'bn', label: 'বাংলা', tag: 'bn-BD' },
];

const STORAGE_KEY = 'heydesk_locale';

// The owner's last choice, else the browser's language, else English.
function startingLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.some((l) => l.code === saved)) return saved;
  } catch (error) {
    // Private mode: fall through to the browser's language.
  }
  return navigator.language && navigator.language.startsWith('bn') ? 'bn' : 'en';
}

const i18n = createI18n({
  legacy: false,
  locale: startingLocale(),
  fallbackLocale: 'en',
  messages: { en, bn },
});

document.documentElement.lang = i18n.global.locale.value;

export function setLocale(code) {
  i18n.global.locale.value = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (error) {
    // Private mode: the choice lasts until the tab closes.
  }
}

// The Intl tag for numbers and dates: Bangla mode shows Bangla digits.
export function localeTag() {
  const current = LOCALES.find((l) => l.code === i18n.global.locale.value);
  return current ? current.tag : 'en-US';
}

// For plain JS files (lib/, api/) that cannot call useI18n(). Reading it inside
// a computed is still reactive: the locale is a ref.
export const t = (...args) => i18n.global.t(...args);

export default i18n;
