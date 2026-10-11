import { createApp } from 'vue';
import { createPinia } from 'pinia';

import './assets/main.css';
import i18n from './i18n/index.js';
import router from './router.js';
import App from './App.vue';
import { setUnauthorizedHandler } from './api/client.js';
import { useAuthStore } from './stores/auth.js';

const app = createApp(App).use(createPinia()).use(i18n);
const auth = useAuthStore();

// A rejected token ends the session wherever it happens: clear it, and the
// router guard sends the owner to the sign-in page.
setUnauthorizedHandler(() => {
  auth.logout();
  router.replace('/sign-in');
});

// The session is picked back up before the first page renders, so a reload on
// /inbox does not bounce through the sign-in page. If the API is down the app
// still opens; the pages show their own error.
auth
  .tryLogin()
  .catch(() => {})
  .finally(() => {
    app.use(router);
    // Wait for the first route to resolve (and its guard to redirect), so the
    // shell never flashes for a signed-out visitor.
    router.isReady().then(() => app.mount('#app'));
  });
