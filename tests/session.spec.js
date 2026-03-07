import { test, expect } from './fixtures.js';

// ── Initialization ────────────────────────────────────────────────────────────

test('module initializes correctly', async ({ page }) => {
    await page.goto('/');
    const initialized = await page.evaluate(() => !!window.session);
    expect(initialized).toBe(true);
});

// ── Warning Modal ─────────────────────────────────────────────────────────────

test('warning modal renders at threshold', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.session.renderWarningModal());
    const modalExists = await page.evaluate(() => !!document.getElementById('idle-warning-modal'));
    expect(modalExists).toBe(true);
});

test('renderWarningModal is idempotent — only one modal created', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.session.renderWarningModal();
        window.session.renderWarningModal();
    });
    const count = await page.evaluate(() => document.querySelectorAll('#idle-warning-modal').length);
    expect(count).toBe(1);
});

test('"Stay Logged In" button dismisses modal and resets timers', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.session.renderWarningModal());
    await page.click('#stay-logged-in');
    await expect(page.locator('#idle-warning-modal')).toHaveCount(0);
});

test('"Log Out" button in warning modal triggers logout', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.session.renderWarningModal();
        window.session.logout = () => { window.__logoutCalled = true; };
    });
    await page.click('#logout-now');
    const called = await page.evaluate(() => !!window.__logoutCalled);
    expect(called).toBe(true);
});

// ── Activity Handling ─────────────────────────────────────────────────────────

test('handleActivity throttles rapid duplicate calls within 500ms', async ({ page }) => {
    await page.goto('/');
    const throttled = await page.evaluate(() => {
        window.session.handleActivity();         // sets _lastHandled
        const stamp = window.session._lastHandled;
        window.session.handleActivity();         // should be ignored
        return window.session._lastHandled === stamp;
    });
    expect(throttled).toBe(true);
});

// ── Timer Reset ───────────────────────────────────────────────────────────────

test('resetTimers sets warning timer when timeout exceeds 60s', async ({ page }) => {
    await page.goto('/');
    const timerSet = await page.evaluate(() => {
        window.session.timeout = 120000;
        window.session.resetTimers();
        return !!window.session.warningTimer;
    });
    expect(timerSet).toBe(true);
});

test('resetTimers skips warning timer when timeout is 60s or less', async ({ page }) => {
    await page.goto('/');
    const timerSet = await page.evaluate(() => {
        window.session.timeout = 30000;
        window.session.warningTimer = null;
        window.session.resetTimers();
        return !!window.session.warningTimer;
    });
    expect(timerSet).toBe(false);
});

// ── Heartbeat ─────────────────────────────────────────────────────────────────

// These tests create a fresh IdleSession with the *default* onHeartbeat (which
// actually calls fetch) so that page.route() interceptions have effect.

test('triggerHeartbeat is a no-op when no activity has occurred', async ({ page }) => {
    await page.goto('/');
    const logoutCalled = await page.evaluate(async () => {
        let called = false;
        window.session.logout = () => { called = true; };
        window.session.needsHeartbeat = false;
        await window.session.triggerHeartbeat();
        return called;
    });
    expect(logoutCalled).toBe(false);
});

test('heartbeat network error does not trigger logout (resilience)', async ({ page }) => {
    await page.goto('/');
    await page.route('**/api/keep-alive', route => route.abort('failed'));

    await page.evaluate(async () => {
        window.session.destroy();
        window.session = new window.IdleSession();   // uses default fetch-based onHeartbeat
        window.session.needsHeartbeat = true;
        await window.session.triggerHeartbeat();
    });

    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/logout');
});

test('heartbeat 401 response triggers logout', async ({ page }) => {
    await page.goto('/');
    await page.route('**/api/keep-alive', route => route.fulfill({ status: 401 }));

    await page.evaluate(async () => {
        window.session.destroy();
        window.session = new window.IdleSession();   // uses default fetch-based onHeartbeat
        window.session.needsHeartbeat = true;
        await window.session.triggerHeartbeat();
    });

    await page.waitForURL('**/logout');
    expect(page.url()).toContain('/logout');
});

test('heartbeat 403 response triggers logout', async ({ page }) => {
    await page.goto('/');
    await page.route('**/api/keep-alive', route => route.fulfill({ status: 403 }));

    await page.evaluate(async () => {
        window.session.destroy();
        window.session = new window.IdleSession();   // uses default fetch-based onHeartbeat
        window.session.needsHeartbeat = true;
        await window.session.triggerHeartbeat();
    });

    await page.waitForURL('**/logout');
    expect(page.url()).toContain('/logout');
});

test('heartbeat auth failure triggers logout callback', async ({ page }) => {
    await page.goto('/');
    await page.route('**/api/keep-alive', route => route.fulfill({ status: 401 }));
    const logoutCalled = await page.evaluate(async () => {
        window.session.destroy();
        let called = false;
        window.session = new window.IdleSession({ onLogout: () => { called = true; } });
        window.session.needsHeartbeat = true;
        await window.session.triggerHeartbeat();
        return called;
    });
    expect(logoutCalled).toBe(true);
});

// ── Logout ────────────────────────────────────────────────────────────────────

test('_doLogout removes warning modal if one is open', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.session.renderWarningModal();
        window.session.logout = () => {};           // prevent redirect
        window.session._doLogout();
    });
    const exists = await page.evaluate(() => !!document.getElementById('idle-warning-modal'));
    expect(exists).toBe(false);
});

test('enforce logout after idle timeout', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.session.timeout = 1000;
        window.session.logout = () => window.location.href = '/logout';
        window.session.resetTimers();
    });
    await page.waitForURL('**/logout');
    expect(page.url()).toContain('/logout');
});

// ── Destroy ───────────────────────────────────────────────────────────────────

test('destroy removes warning modal and cleans up', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.session.renderWarningModal());
    await page.evaluate(() => window.session.destroy());
    const exists = await page.evaluate(() => !!document.getElementById('idle-warning-modal'));
    expect(exists).toBe(false);
});

// ── Constructor Options ───────────────────────────────────────────────────────

test('channelName creates BroadcastChannel with that name', async ({ page }) => {
    await page.goto('/');
    const name = await page.evaluate(() => {
        window.session.destroy();
        window.session = new window.IdleSession({ channelName: 'my_app_session' });
        return window.session.channel.name;
    });
    expect(name).toBe('my_app_session');
});

test('warningBefore controls when warning timer fires', async ({ page }) => {
    await page.goto('/');
    const timerSet = await page.evaluate(() => {
        window.session.destroy();
        // warningBefore=4000 with timeout=5000 → warnAt=1000 > 0, so warningTimer is set
        window.session = new window.IdleSession({ timeout: 5000, warningBefore: 4000 });
        return !!window.session.warningTimer;
    });
    expect(timerSet).toBe(true);
});

// ── Cross-Tab Sync ────────────────────────────────────────────────────────────

test('activity in Tab A resets timers in Tab B', async ({ context }) => {
    const [pageA, pageB] = await Promise.all([context.newPage(), context.newPage()]);
    await pageA.goto('/');
    await pageB.goto('/');

    await pageB.evaluate(() => {
        window.session.timeout = 2000;
        window.session.resetTimers();
    });

    await pageA.waitForTimeout(1500);
    await pageA.mouse.click(100, 100);

    await pageB.waitForTimeout(1000);
    expect(pageB.url()).not.toContain('/logout');
});
