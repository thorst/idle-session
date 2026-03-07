import { test, expect } from '@playwright/test';

test('Smoke Test: Session module is active and healthy', async ({ page }) => {
  await page.goto('/');

  // 1. Verify existence: The module should be exported to global or accessible via window
  const isHealthy = await page.evaluate(() => {
    return window.session !== undefined && typeof window.session.handleActivity === 'function';
  });
  
  expect(isHealthy, "IdleSession should be initialized on the window").toBe(true);

  // 2. Verify Performance: Check for console errors (e.g., CSP blocking BroadcastChannel)
  // Listener must be attached before any action so no messages are missed.
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // Trigger activity to ensure no runtime errors occur.
  await page.mouse.click(0, 0);
  
  expect(consoleErrors.length, "Module should not throw errors on activity").toBe(0);
});