import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Self-Destructing Cache',
    description: "An extension which deletes cookies and cache after closing a site.",
    homepage_url: "https://github.com/geerteltink/self-destructing-cache",
    action: {
      default_title: 'Self-Destructing Cache',
    },
    permissions: [
      "cookies",
      "storage",
      "alarms",
      "browsingData",
      "tabs"
    ],
    host_permissions: [
      "<all_urls>"
    ],
  },
});
