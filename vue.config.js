const { defineConfig } = require('@vue/cli-service');

// The FastAPI app runs on :8000 and the dev server on :8080. Every /api call is
// proxied to it, so the browser only ever talks to one origin and the backend
// needs no CORS setup in development. Unlike store-manager-vue, the prefix is
// NOT stripped: HeyDesk's own routes already start with /api.
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
      },
    },
  },
});
