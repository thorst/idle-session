# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] — 2026-03-07

### Fixed

- Built-in warning dialog now centers vertically on the screen (`margin: auto` was missing from the `<dialog>` CSS rule).

---

## [1.1.0] — 2026-03-07

### Added

- **`onWarning` callback** — pass a function to replace the built-in warning dialog entirely. The callback receives `{ extend, logout }`: call `extend()` to reset the idle timer or `logout()` to end the session immediately.
- **Styled built-in dialog** — the default `<dialog>` is now fully themed via CSS custom properties (`--idle-bg`, `--idle-color`, `--idle-heading`, `--idle-muted`, `--idle-border`, `--idle-accent`, `--idle-accent-text`), allowing deep visual customization without touching the library.
- **README examples** for integrating Bootstrap and Tailwind (Alpine.js) modals via `onWarning`.

---

## [1.0.0] — 2026-03-07

Initial public release.

### Features

- Idle timeout with configurable duration (`timeout`, default 15 min)
- Automatic logout via a configurable `onLogout` callback
- Warning modal shown 60 seconds before expiry, with "Stay Logged In" and "Log Out" actions
- Heartbeat support — pings a configurable endpoint while the user is active, with resilient handling of transient network errors
- Multi-tab synchronization via the native `BroadcastChannel` API — activity in any tab resets the timer in all tabs
- `destroy()` method for full cleanup of timers, event listeners, and the broadcast channel
- Zero dependencies, ships as a plain ES module
