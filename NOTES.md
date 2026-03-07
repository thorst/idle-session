# IdleSession — Notes

---

## CDN Publishing

Both jsDelivr and unpkg **automatically serve any package once it is published to npm** — no separate submission needed.

### jsDelivr (recommended)

```html
<script type="module">
  import { IdleSession } from 'https://cdn.jsdelivr.net/npm/idle-session/IdleSession.js';
</script>
```

- Supports ES Module imports directly
- Global CDN with high availability and automatic purging on new npm versions
- URL format: `https://cdn.jsdelivr.net/npm/{package}@{version}/{file}`

### unpkg

```html
<script type="module">
  import { IdleSession } from 'https://unpkg.com/idle-session/IdleSession.js';
</script>
```

- URL format: `https://unpkg.com/{package}@{version}/{file}`

### Minified Build via CDN

After running `npm run build`, the minified build at `dist/idle-session.min.js` is included in the npm package (covered by `"files"` in package.json) and is also available via CDN:

```html
<script type="module">
  import { IdleSession } from 'https://cdn.jsdelivr.net/npm/idle-session/dist/idle-session.min.js';
</script>
```

### cdnjs

cdnjs requires a **manual submission** via a pull request to their repository. Do this after the npm package has had a few published versions.
- Submission: https://github.com/cdnjs/packages

---

## Publishing Workflow

```bash
# 1. Run tests and coverage
npm run coverage

# 2. Build the minified dist
npm run build

# 3. Preview what will be published (sanity check)
npm pack --dry-run

# 4. Publish
npm publish
```

> The first publish requires `npm login` and the package name `idle-session` to be available on the npm registry.

---

## Future Work

### cdnjs Submission

Submit to cdnjs after a few npm versions are published to establish a track record.
- Submission: https://github.com/cdnjs/packages

### TypeScript: Stricter Public API Surface

The `.d.ts` currently exposes internal properties (`timer`, `warningTimer`, `channel`, etc.) because tests access them directly. A future version could use `private` declarations or a separate internal interface to keep the public-facing types clean.
