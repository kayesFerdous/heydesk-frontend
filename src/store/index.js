import { createStore } from 'vuex';

import authModule from './modules/auth/index.js';
import inboxModule from './modules/inbox/index.js';
import agentModule from './modules/agent/index.js';
import uiModule from './modules/ui/index.js';

const store = createStore({
  modules: {
    auth: authModule,
    inbox: inboxModule,
    agent: agentModule,
    ui: uiModule,
  },
});

export default store;
