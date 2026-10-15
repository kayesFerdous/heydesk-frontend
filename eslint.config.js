import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

// The same rules as before the move to Vite: ESLint's recommended set plus
// eslint-plugin-vue's essential Vue 3 rules.
export default [
  { ignores: ['dist/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // ESLint 9 started flagging an unused `catch (error)`; ESLint 7 did not.
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  // The config files run in Node.
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
