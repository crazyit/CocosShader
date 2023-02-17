const { defineConfig } = require('vite');

exports.config = defineConfig({
    build: {
        rollupOptions: {
            external: ['electron'],
        },
    },
});

exports.libs = {
    'index': './source/index.ts',
    'panel': './source/panel.ts',
    'hooks': './source/hooks.ts',
};
