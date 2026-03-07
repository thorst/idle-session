# Security Policy

## Supported versions

Only the latest published version on npm receives security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them privately via GitHub's built-in security advisory tool:
https://github.com/thorst/idle-session/security/advisories/new

Include as much detail as you can — a description of the issue, steps to reproduce,
and an assessment of impact. You'll receive a response within 7 days.

## Scope

This library runs entirely in the browser and has no server-side component. The main
areas of concern are:

- **XSS via `onLogout` or `onHeartbeat` callbacks** — these are caller-supplied and
  must not be constructed from untrusted input
- **Session fixation** — the `BroadcastChannel` is same-origin only, so cross-origin
  interference is not possible
- **Dependency vulnerabilities** — this package ships zero runtime dependencies;
  devDependencies are not included in the published artifact
