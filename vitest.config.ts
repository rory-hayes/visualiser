/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const baseConfig = defineConfig({
    plugins: [react(), tsconfigPaths()],
});

const testConfig = {
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
};

export default mergeConfig(baseConfig, testConfig); 