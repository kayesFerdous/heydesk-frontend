const { defineConfig } = require('@vue/cli-service');

// The FastAPI app runs on :8000 and the dev server on :8080. Every /api call is
// proxied to it, so the browser only ever talks to one origin and the backend
// needs no CORS setup in development. Unlike store-manager-vue, the prefix is
// NOT stripped: HeyDesk's own routes already start with /api.
module.exports = defineConfig({
  transpileDependencies: true,
  // vue-i18n's build flags: Composition API only, no legacy API, no devtools in production.
  chainWebpack: (config) => {
    config.plugin('define').tap(([definitions]) => [
      {
        ...definitions,
        __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
        __VUE_I18N_LEGACY_API__: JSON.stringify(false),
        __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
      },
    ]);
  },
  devServer: {
    // Allow the Cloudflare Tunnel's host name, so one public link reaches this dev server.
    allowedHosts: 'all',
    proxy: {
      // The backend's own chat and voice page, at <link>/demo/ (its scripts load relative to it).
      '/demo': {
        target: 'http://localhost:8000',
        pathRewrite: { '^/demo': '' },
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
