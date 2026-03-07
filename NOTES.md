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

### First Publish

```bash
npm login               # one-time: authenticate with npm
gh auth login           # one-time: authenticate GitHub CLI (install from cli.github.com)
npm run coverage        # run tests and coverage
npm run build           # build the minified dist
npm pack --dry-run      # sanity check: preview what will be published
npm publish             # publish to npm
git push && git push --tags
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

> The first publish requires `npm login` and the package name `idle-session` to be available on the npm registry.

### Subsequent Releases

```bash
npm run coverage        # run tests and coverage
npm run build           # build the minified dist
npm version patch       # 1.0.0 → 1.0.1  bug fixes
# npm version minor     # 1.0.0 → 1.1.0  new backwards-compatible features
# npm version major     # 1.0.0 → 2.0.0  breaking changes
npm publish
git push && git push --tags
gh release create v1.0.1 --generate-notes  # update version number to match
```

`npm version` automatically bumps `package.json`, commits the change, and creates a git tag. `gh` is the GitHub CLI — install from cli.github.com and run `gh auth login` once to authenticate. `--generate-notes` auto-generates release notes from commits since the last tag.

---

## Future Work

### cdnjs Submission

Submit to cdnjs after a few npm versions are published to establish a track record.
- Submission: https://github.com/cdnjs/packages

### TypeScript: Stricter Public API Surface

The `.d.ts` currently exposes internal properties (`timer`, `warningTimer`, `channel`, etc.) because tests access them directly. A future version could use `private` declarations or a separate internal interface to keep the public-facing types clean.
