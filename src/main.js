import { createApp } from 'vue';

import './assets/main.css';
import router from './router.js';
import store from './store/index.js';
import App from './App.vue';
import { setUnauthorizedHandler } from './api/client.js';

// A rejected token ends the session wherever it happens: clear it, and the
// router guard sends the owner to the sign-in page.
setUnauthorizedHandler(() => {
  store.dispatch('auth/logout');
  router.replace('/sign-in');
});

// The session is picked back up before the first page renders, so a reload on
// /inbox does not bounce through the sign-in page. If the API is down the app
// still opens; the pages show their own error.
store
  .dispatch('auth/tryLogin')
  .catch(() => {})
  .finally(() => {
    const app = createApp(App).use(router).use(store);
    // Wait for the first route to resolve (and its guard to redirect), so the
    // shell never flashes for a signed-out visitor.
    router.isReady().then(() => app.mount('#app'));
  });
