import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import analyze from 'rollup-plugin-analyzer';
import { externals } from 'shared-base';
import p from './package.json';

const ANALYZE_BUNDLE = false;

export default defineConfig({
    plugins: [dts({})],
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'StoreSeeder',
            formats: ['es', 'umd'],
            fileName: (format) => `store-seeder.${format}.js`,
        },
        rollupOptions: {
            plugins: [ANALYZE_BUNDLE ? analyze() : null],
            ...externals({
                'firebase/app': '',
                'firebase/firestore/lite': '',
                ...p.dependencies,
            }),
        },
    },
});
