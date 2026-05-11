# Orbit OS WordPress Port Reference Package

This folder is a curated **static export** of the Orbit OS / Cybernoid desktop demo from this repository, prepared as a reference package for building the future WordPress plugin **`cybernoid-vos-shell`**.

## Purpose

Use this package as a portability baseline to:
- preserve the current Orbit OS desktop UX (menu bar, icons, draggable windows, app launching);
- identify which files should become plugin assets/templates;
- support incremental migration into a WordPress shortcode renderer.

## Derived from original repository

Primary source entry:
- `apps/app1/app-index.html`

Supporting sources copied because they are referenced by the desktop shell and app launcher:
- `apps/app1/app-data/app1.json`
- `apps/app1/app-js/*.js`
- `shared/consolelogs.js`
- app iframe pages: `html-studio.html`, `documonster.html`, `comic-issue-forge.html`, `scanx.html`, `cloud-storage.html`, `retro-list.html`
- app-specific styles: `apps/app1/app-css/*.css`

## How to use this package for plugin work

1. Treat `app-index.html` as the canonical visual/behavior reference.
2. Move inline CSS/JS into plugin-enqueued files during WordPress integration.
3. Replace relative paths with plugin URL/path helpers (`plugins_url`, `plugin_dir_url`, etc.).
4. Keep the app registry (`app-data/app1.json`) concept; map it to a configurable plugin option or JSON file.
5. Preserve vanilla JS behavior and existing module boundaries unless required by WordPress constraints.

## Out of scope for this export

- No rewrite of existing GitHub Pages demo.
- No minification/build tooling added.
- No dependency upgrades.
