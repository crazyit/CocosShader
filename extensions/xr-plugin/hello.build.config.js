const { defineConfig } = require('vite');

exports.config = defineConfig({
    build: {
        rollupOptions: {
            external: ['electron'],
        },
    },
});

exports.libs = {
    'browser': './source/browser.ts',
    'hierarchy-menu': './source/hierarchy-menu.ts',
};
