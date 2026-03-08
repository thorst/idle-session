/**
 * Injects an IdleSession nav bar into the generated coverage HTML files.
 * Run after `nyc report` as part of the coverage npm script.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const NAV_HTML = `
<style>
  #is-nav {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #2e3340;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #1c1f26;
    font-family: system-ui, -apple-system, sans-serif;
  }
  #is-nav h1 {
    font-size: 1rem;
    font-weight: 600;
    color: #e8eaf0;
    margin: 0;
  }
  #is-nav h1 span { color: #6b7280; font-weight: 400; }
  .is-gh-link {
    font-size: 0.75rem;
    color: #6b7280;
    text-decoration: none;
    border: 1px solid #2e3340;
    border-radius: 6px;
    padding: 0.2rem 0.6rem;
    transition: color 0.15s, border-color 0.15s;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .is-gh-link:hover { color: #e8eaf0; border-color: #6b7280; }
</style>
<div id="is-nav">
  <h1>IdleSession <span>Coverage</span></h1>
  <a href="https://github.com/thorst/idle-session" target="_blank" rel="noopener" class="is-gh-link">GitHub</a>
  <a href="/idle-session/" class="is-gh-link">Kitchen Sink</a>
</div>
`;

const targets = [
    'coverage/index.html',
    'coverage/lcov-report/index.html',
];

for (const rel of targets) {
    const file = resolve(root, rel);
    let html;
    try {
        html = readFileSync(file, 'utf8');
    } catch {
        continue; // file doesn't exist, skip
    }

    if (html.includes('id="is-nav"')) continue; // already injected

    html = html.replace('<body>', `<body>${NAV_HTML}`);
    writeFileSync(file, html, 'utf8');
    console.log(`Injected nav → ${rel}`);
}
