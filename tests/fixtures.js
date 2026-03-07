import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        await use(page);
        if (process.env.VITE_COVERAGE !== 'true') return;
        const coverage = await page.evaluate(() => window.__coverage__ ?? null).catch(() => null);
        if (!coverage) return;
        const dir = path.join(process.cwd(), '.nyc_output');
        fs.mkdirSync(dir, { recursive: true });
        const safeName = testInfo.title.replace(/[^a-z0-9]/gi, '_').slice(0, 60);
        fs.writeFileSync(
            path.join(dir, `${safeName}_${Date.now()}.json`),
            JSON.stringify(coverage)
        );
    }
});

export { expect };
