# WordPress Port Plan: `cybernoid-vos-shell`

## Target shortcode

`[cybernoid_vos_shell]`

## Implementation plan

1. **Plugin bootstrap**
   - Create plugin with main file `cybernoid-vos-shell.php`.
   - Register shortcode `cybernoid_vos_shell`.
   - Shortcode output renders a container and Orbit OS template markup.

2. **Asset strategy (no build step)**
   - Move inline CSS from `app-index.html` into `assets/css/orbit-shell.css`.
   - Move inline JS from `app-index.html` into `assets/js/orbit-shell.js`.
   - Copy `app-js/*.js` into `assets/js/apps/`.
   - Copy `app-data/app1.json` into `assets/data/app1.json` or provide via localized config.
   - Enqueue only on pages where shortcode is present (`has_shortcode`).

3. **URL/path abstraction**
   - Replace hardcoded relative paths with plugin URL config object:
     - `appDataUrl`
     - `appsBaseUrl`
     - `sharedBaseUrl`
     - `traceAppUrl`
   - Inject with `wp_add_inline_script` or `wp_localize_script`.

4. **App/window system extraction**
   - Preserve current window manager functions (`openWindow`, drag, maximize/minimize, task bar sync).
   - Keep app registry model from JSON.
   - Keep lazy app script loading pattern from `gui-api.js`.

5. **TRACE app integration (first app)**
   - Add TRACE as first icon in registry.
   - Define type `trace` with iframe window target.
   - Default URL: `/trace-workspace/`.
   - Make configurable via plugin option (admin setting), with fallback default.

6. **Iframe app policy**
   - Maintain iframe launch for external/internal apps.
   - Add safety checks for same-origin URLs by default.
   - Use sandbox attributes as needed for content isolation.

7. **Console + diagnostics**
   - Keep `shared/consolelogs.js` behavior for the Console window.
   - Optionally add plugin debug mode to expose internal logs.

8. **Compatibility hardening**
   - Namespace global functions where possible to avoid theme/plugin conflicts.
   - Ensure unique DOM IDs if shortcode can render multiple instances.
   - Scope CSS under root container class to avoid global bleeding.

## Recommended plugin structure

- `cybernoid-vos-shell.php`
- `includes/`
  - `class-cybernoid-vos-shell.php`
- `assets/css/`
  - `orbit-shell.css`
- `assets/js/`
  - `orbit-shell.js`
  - `apps/*.js`
  - `shared/consolelogs.js`
- `assets/data/`
  - `app1.json`
- `templates/`
  - `shell-root.php`

## What to keep unchanged initially

- Existing window interaction model and UI behavior.
- Existing app metadata schema from `app1.json`.
- Vanilla JS architecture.

## What to change for production WordPress

- Remove hardcoded relative paths.
- Reduce external dependencies (Google Fonts/Monaco CDN) or self-host optionally.
- Add option sanitization/escaping for configurable URLs.
- Add plugin settings for TRACE URL and optional feature toggles.
