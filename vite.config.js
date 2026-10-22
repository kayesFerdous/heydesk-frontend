import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// The FastAPI app runs on :8000 and the dev server on :8080. Every /api call is
// proxied to it, so the browser only ever talks to one origin and the backend
// needs no CORS setup in development. Unlike store-manager-vue, the prefix is
// NOT stripped: HeyDesk's own routes already start with /api.
export default defineConfig({
  // Drop template comments in dev too (production already does). A comment
  // before a page's root is a second root node, and the out-in page
  // <transition> in App.vue can never finish leaving it: the next page stays blank.
  plugins: [vue({ template: { compilerOptions: { comments: false } } }), tailwindcss()],
  // vue-i18n's build flags: Composition API only, no legacy API, no devtools in production.
  define: {
    __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
    __VUE_I18N_LEGACY_API__: JSON.stringify(false),
    __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
  },
  server: {
    port: 8080,
    strictPort: true,
    // Listen on every address, as Vue CLI did, so the tunnel reaches it on 127.0.0.1 too.
    host: true,
    // Allow the Cloudflare Tunnel's and ngrok's host names, so one public link reaches this dev server.
    allowedHosts: true,
    proxy: {
      // The backend's own chat and voice page, at <link>/demo/ (its scripts load relative to it).
      '/demo': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/demo/, ''),
      },
      '/api': {
        target: 'http://localhost:8000',
      },
      // Product photos and the ones visitors send (backend D57).
      '/media': {
        target: 'http://localhost:8000',
      },
      // The payment link the agent sends (/pay/<id>) and the gateway's return (/pay/<id>/back).
      '/pay/': {
        target: 'http://localhost:8000',
      },
    },
  },
});
