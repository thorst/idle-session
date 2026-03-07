# Contributing

Thanks for taking the time to contribute.

## Reporting bugs

Open an issue at https://github.com/thorst/idle-session/issues. Include:

- A minimal reproduction (ideally a code snippet or failing test)
- What you expected to happen and what actually happened
- Browser and Node version if relevant

## Submitting changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure tests pass and coverage stays complete — `npm test` and `npm run coverage`
4. Open a pull request with a clear description of what changed and why

## Running locally

```bash
npm install
npx playwright install chromium

npm test           # run the test suite
npm run coverage   # run tests with coverage, then open coverage/index.html
npm run dev        # start the kitchen-sink demo at http://localhost:5173
```

## Code style

- Vanilla JS, no build step required for the library itself (`IdleSession.js`)
- Keep the public API surface small — the constructor options and `destroy()` cover the common cases
- New behavior should come with a corresponding test in `tests/session.spec.js`
