# Changelog

All notable changes to this project will be documented in this file.

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
