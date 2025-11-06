// import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: "./",
    // root: resolve(__dirname, 'src'),
    // build: {
    //     outDir: './dist'
    // },
    // server: {
    //     port: 8080
    // },
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: [
                    'import',
                    'color-functions',
                    'global-builtin',
                    'legacy-js-api',
                ],
            },
        },
    },
});