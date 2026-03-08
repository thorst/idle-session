import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        if (process.env.VITE_COVERAGE === 'true') {
            // Snapshot coverage to localStorage on beforeunload so it survives navigation.
            await page.addInitScript(() => {
                window.addEventListener('beforeunload', () => {
                    if (window.__coverage__) {
                        try { localStorage.setItem('__coverage_snapshot__', JSON.stringify(window.__coverage__)); } catch (_) {}
                    }
                });
            });
        }
        await use(page);
        if (process.env.VITE_COVERAGE !== 'true') return;
        const coverage = await page.evaluate(() => {
            // Prefer localStorage snapshot: captured pre-navigation via beforeunload or
            // manually by a test. window.__coverage__ may be a fresh empty object if the
            // page navigated and Vite re-served index.html (reinitialising coverage).
            try {
                const snap = localStorage.getItem('__coverage_snapshot__');
                if (snap) { const parsed = JSON.parse(snap); if (parsed) return parsed; }
            } catch (_) {}
            if (window.__coverage__) return window.__coverage__;
            return null;
        }).catch(() => null);
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
