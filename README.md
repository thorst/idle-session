# IdleSession

[![npm](https://img.shields.io/npm/v/idle-session)](https://www.npmjs.com/package/idle-session)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/idle-session/badge)](https://www.jsdelivr.com/package/npm/idle-session)
[![Tests](https://github.com/thorst/idle-session/actions/workflows/test.yml/badge.svg)](https://github.com/thorst/idle-session/actions)

**Seamless, multi-tab session orchestration for the modern web.**

`IdleSession` is a high-performance, dependency-free ES Module for managing session lifecycles in modern web applications. It eliminates the "timer wars" common in multi-tab environments and is a native-first successor to [jquery-idletimer](https://github.com/thorst/jquery-idletimer).

---

## Key Features

- **Synchronized Multi-Tab State** — Uses the native `BroadcastChannel` API to ensure activity in any open tab resets the session timer globally across all instances.
- **Native-First Architecture** — Zero dependencies, zero jQuery, zero bloat. Built for 2026 standards.
- **Performance-Optimized** — Passive, throttled event listeners ensure zero UI jank and zero timer spam during high-frequency events like `mousemove`.
- **Resilient Heartbeats** — Heartbeats only fire when the user is active. Transient network failures are swallowed; only `401`/`403` responses trigger logout.
- **Session Warning Dialog** — Automatically injects an accessible `<dialog>` element before timeout (configurable via `warningBefore`), letting users extend their session.
- **Network Awareness** — Differentiates between transient network failures and hard authorization failures (`401`/`403`).

---

## Installation

```bash
npm install idle-session
```

Or via CDN (no install needed):

```html
<script type="module">
  import { IdleSession } from 'https://cdn.jsdelivr.net/npm/idle-session/IdleSession.js';
</script>
```

---

## Quick Start

```javascript
import { IdleSession } from 'idle-session';

const session = new IdleSession({
    timeout: 10 * 60 * 1000, // 10 minutes
    onHeartbeat: async () => {
        try {
            const res = await fetch('/api/keep-alive', { method: 'POST' });
            if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        } catch (err) {
            if (err.message === 'Unauthorized') throw err;
            // Swallow network errors — session stays active, retries next interval.
        }
    },
    onLogout: () => window.location.href = '/login?reason=session_expired'
});
```

---

## Configuration Reference

All options are optional. Pass any combination to the constructor to override the defaults.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `timeout` | `number` | `900000` (15m) | Idle time in ms before `onLogout` is triggered. |
| `heartbeatInterval` | `number` | `300000` (5m) | How often (ms) to ping the server when activity is detected. |
| `warningBefore` | `number` | `60000` (1m) | How many ms before `timeout` to show the warning modal. Set to `0` to disable. |
| `channelName` | `string` | `'session_sync'` | `BroadcastChannel` name for cross-tab sync. Override if you run multiple independent apps on the same origin. |
| `onHeartbeat` | `async function` | POSTs to `/api/keep-alive` | Custom async function to ping your backend. Throwing triggers logout. |
| `onLogout` | `function` | Redirects to `/logout` | Callback executed when the session expires or is forcibly revoked. |

---

## Examples

### Basic Setup

Use the defaults for zero-config protection:

```javascript
const session = new IdleSession();
```

### Custom API Client

Override `onHeartbeat` to use a custom HTTP client or send auth headers:

```javascript
const session = new IdleSession({
    onHeartbeat: async () => {
        const response = await apiClient.post('/auth/keep-alive', {
            sessionID: localStorage.getItem('sid')
        });
        // Throwing here triggers automatic logout across all tabs
        if (response.status !== 200) throw new Error('Session terminated by server');
    }
});
```

### Custom Logout Behavior

Override `onLogout` to run cleanup before redirecting:

```javascript
const session = new IdleSession({
    onLogout: async () => {
        await analytics.track('session_expired');
        localStorage.clear();
        window.location.href = '/login?reason=timeout';
    }
});
```

### Cleanup / SPA Route Changes

Call `destroy()` to remove all event listeners, clear timers, close the `BroadcastChannel`, and remove any open warning dialog. Essential when unmounting the session in a single-page application:

```javascript
// React / Vue / etc.
onUnmount(() => session.destroy());

// Or when reinitializing with new config
session.destroy();
session = new IdleSession({ timeout: newTimeout });
```

---

## Network Resilience

The module treats the network as unreliable. Transient network failures inside `onHeartbeat` should be caught and swallowed — only throw on hard auth failures (`401`/`403`) so that connectivity blips do not end the session. The default `onHeartbeat` already does this. If you provide a custom `onHeartbeat`, follow the same pattern:

```javascript
onHeartbeat: async () => {
    try {
        const res = await fetch('/api/keep-alive', { method: 'POST' });
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
    } catch (err) {
        if (err.message === 'Unauthorized') throw err;
        // Network errors are swallowed — session stays active, retries next interval.
    }
}
```

A `401` or `403` response is treated as a hard termination signal, triggering an immediate and synchronized logout across all open tabs.

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
| :--- | :---: | :---: | :---: | :---: |
| `BroadcastChannel` | v54+ | v38+ | v15.4+ | v79+ |
| `<dialog>` element | v37+ | v98+ | v15.4+ | v79+ |

---

## Testing

This library uses a two-tier testing strategy.

### Unit & Integration Tests

Runs all core logic through every branch — including error handling and multi-tab state synchronization — using Playwright.

```bash
npm test
```

For a detailed coverage report:

```bash
npm run coverage
# View the generated coverage/ folder
```

### Smoke Tests

Designed to run against a staging or pre-production environment. Confirms the module initializes correctly, that your Content Security Policy permits `BroadcastChannel` and `fetch`, and that there are no race conditions with your DOM.

```bash
npx playwright test tests/smoke.spec.js
```

---

## License

MIT
