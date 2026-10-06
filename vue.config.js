const { defineConfig } = require('@vue/cli-service');

// The FastAPI app runs on :8000 and the dev server on :8080. Every /api call is
// proxied to it, so the browser only ever talks to one origin and the backend
// needs no CORS setup in development. Unlike store-manager-vue, the prefix is
// NOT stripped: HeyDesk's own routes already start with /api.
module.exports = defineConfig({
  transpileDependencies: true,
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
    },
  },
});
