# IdleSession

[![npm](https://img.shields.io/npm/v/idle-session)](https://www.npmjs.com/package/idle-session)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/idle-session/badge)](https://www.jsdelivr.com/package/npm/idle-session)
[![Tests](https://github.com/thorst/idle-session/actions/workflows/test.yml/badge.svg)](https://github.com/thorst/idle-session/actions)

**Seamless, multi-tab session orchestration for the modern web.**

`IdleSession` is a high-performance, dependency-free ES Module for managing session lifecycles in modern web applications. It eliminates the "timer wars" common in multi-tab environments and is a native-first successor to [jquery-idletimer](https://github.com/thorst/jquery-idletimer).

## Live Demo

Try it in your browser: **[thorst.github.io/idle-session](https://thorst.github.io/idle-session/)**

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
| `warningBefore` | `number` | `60000` (1m) | How many ms before `timeout` to show the warning. Set to `0` to disable. |
| `channelName` | `string` | `'session_sync'` | `BroadcastChannel` name for cross-tab sync. Override if you run multiple independent apps on the same origin. |
| `onHeartbeat` | `async function` | POSTs to `/api/keep-alive` | Custom async function to ping your backend. Throwing triggers logout. |
| `onLogout` | `function` | Redirects to `/logout` | Callback executed when the session expires or is forcibly revoked. |
| `onWarning` | `function` | Built-in `<dialog>` | Called instead of the built-in warning modal when the session is about to expire. Receives `{ extend, logout }` — call `extend()` to reset the session, `logout()` to force-end it. If omitted, the default styled `<dialog>` is used. |

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

### Custom Warning UI

Provide `onWarning` to replace the built-in dialog with your own UI. The callback receives `{ extend, logout }`:

```javascript
const session = new IdleSession({
    onWarning: ({ extend, logout }) => {
        // Show your own modal, toast, banner — anything.
        myModal.open({
            onStayLoggedIn: extend,   // resets the idle timer
            onLogOut:       logout,   // ends the session immediately
        });
    }
});
```

The default built-in dialog is used only when `onWarning` is not provided.

#### Styling the Built-in Dialog

If you omit `onWarning`, the default `<dialog>` can be themed without touching the library — just set CSS custom properties anywhere in your stylesheet:

```css
/* Example: match a dark application theme */
:root {
    --idle-bg:          #1c1f26;
    --idle-color:       #e8eaf0;
    --idle-heading:     #f59e0b;
    --idle-muted:       #9ca3af;
    --idle-border:      #2e3340;
    --idle-accent:      #6366f1;
    --idle-accent-text: #ffffff;
}
```

| Property | Controls | Default |
| :--- | :--- | :--- |
| `--idle-bg` | Dialog background | `#ffffff` |
| `--idle-color` | Body text | `#111827` |
| `--idle-heading` | Heading color | inherits `--idle-color` |
| `--idle-muted` | Subtext and secondary button | `#6b7280` |
| `--idle-border` | Dialog border and button borders | `#e5e7eb` |
| `--idle-accent` | Primary button background | `#2563eb` |
| `--idle-accent-text` | Primary button text | `#ffffff` |

---

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

### Prerequisites

After cloning the repository, run the following before any test or coverage commands:

```bash
npm install              # install dev dependencies
npx playwright install   # download Playwright browser binaries (required once per machine)
```

To verify the dev server runs correctly before testing:

```bash
npm run dev   # starts Vite at http://localhost:5173 — open in a browser to confirm
```

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
