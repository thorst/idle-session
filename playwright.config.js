import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testIgnore: ['**/smoke.spec.js', '**/fixtures.js', '**/global.setup.js'],
    use: {
        baseURL: 'http://localhost:5173',
    },
    globalSetup: process.env.VITE_COVERAGE === 'true' ? './tests/global.setup.js' : undefined,
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
    },
});
