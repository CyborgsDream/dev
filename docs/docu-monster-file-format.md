# Docu Monster Document File Format

This document defines the JSON structure used by Docu Monster Studio Pro for saving and exchanging publications. The format is intentionally human-readable and reusable so other applications can interoperate with Docu Monster documents.

## 1. File container

* **MIME type:** `application/json`
* **Recommended extension:** `.json`
* **Root value:** a single JSON object referred to as the *document model*.
* **Character encoding:** UTF-8.

Consumers should tolerate additional fields that may appear in future versions. Unknown properties must be preserved when possible.

## 2. Top-level document object

| Field | Type | Description |
| --- | --- | --- |
| `version` | string | Semantic version of the layout preset currently applied. Defaults come from the active template. 【F:apps/app1/documonster.html†L1194-L1203】 |
| `docVersion` | string | Application-specific document schema revision. Mirrors template defaults if absent. 【F:apps/app1/documonster.html†L1194-L1203】 |
| `codename` | string | Marketing or internal codename for the preset (e.g., “Heritage Gazette”). 【F:apps/app1/documonster.html†L738-L785】 |
| `docName` | string | Human-facing product name (defaults to “Docu Monster Studio Pro”). Must be non-empty. 【F:apps/app1/documonster.html†L1194-L1202】 |
| `releaseNotes` | array of strings | Optional changelog or context paragraphs shown in the sidebar. If omitted or empty it falls back to template-provided notes. 【F:apps/app1/documonster.html†L1194-L1202】 |
| `pages` | array of [Page objects](#3-page-object) | Ordered list of publication spreads. At least one page is required; defaults are injected if the list is empty. 【F:apps/app1/documonster.html†L1194-L1227】 |

Applications may add extra metadata alongside these fields. Docu Monster merges unknown properties when loading, so additional data is safe as long as it remains valid JSON. 【F:apps/app1/documonster.html†L1194-L1203】

## 3. Page object

Each entry in `pages` describes a single sheet/spread rendered inside the layout workspace.

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Primary heading. Defaults to `"Untitled Page N"` when missing. 【F:apps/app1/documonster.html†L1215-L1223】 |
| `subtitle` | string | Secondary heading shown below the title. Defaults to empty. 【F:apps/app1/documonster.html†L1215-L1223】 |
| `deck` | string | Introductory blurb above the body content. Defaults to empty. 【F:apps/app1/documonster.html†L1410-L1418】 |
| `theme` | string | Visual theme identifier. Acceptable values are `standard`, `newsprint`, or `midnight`. Invalid values revert to `standard`. 【F:apps/app1/documonster.html†L666-L673】【F:apps/app1/documonster.html†L1206-L1226】 |
| `elements` | array of [Element objects](#4-element-types) | Layout blocks rendered in reading order. Missing or invalid entries are replaced with a default single-column block. 【F:apps/app1/documonster.html†L1215-L1258】 |
| `footerLeft` | string | Left footer template. Tokens `{{page}}`, `{{total}}`, `{{version}}`, and `{{codename}}` are replaced at render time. Defaults to `Docu Monster Studio Pro`. 【F:apps/app1/documonster.html†L1215-L1223】【F:apps/app1/documonster.html†L1553-L1582】 |
| `footerRight` | string | Right footer template using the same substitution tokens as `footerLeft`. Defaults to `Page {{page}}`. 【F:apps/app1/documonster.html†L1215-L1223】【F:apps/app1/documonster.html†L1553-L1582】 |

### 3.1 Footer tokens

The following placeholders can appear in any footer string:

* `{{page}}` – 1-based index of the current page.
* `{{total}}` – Total number of pages in the document.
* `{{version}}` – Document `version` string.
* `{{codename}}` – Document `codename` string.

## 4. Element types

The `elements` array supports two element families: column blocks and frames. Every element must contain a `type` field whose value is either `"columns"` or `"frame"`.

### 4.1 Column block (`type: "columns"`)

Column blocks host rich-text HTML content split into up to four columns.

| Field | Type | Description |
| --- | --- | --- |
| `columns` | integer | Number of windows to display (clamped between 1 and 4). 【F:apps/app1/documonster.html†L695-L719】【F:apps/app1/documonster.html†L1234-L1258】 |
| `windows` | array of strings | HTML fragments for each column window. Empty or whitespace-only entries are replaced with `"<p>Start typing…</p>"`. 【F:apps/app1/documonster.html†L695-L719】【F:apps/app1/documonster.html†L1234-L1258】 |
| `windowLayout` | array of objects | Per-window sizing overrides expressed in millimetres (`{ "width": number\|null, "height": number\|null }`). Values outside finite numbers fall back to `null`. 【F:apps/app1/documonster.html†L695-L719】【F:apps/app1/documonster.html†L1234-L1255】【F:apps/app1/documonster.html†L1431-L1447】 |
| `style` | string | Visual treatment for the entire block. Accepted values: `standard`, `accent`, `note`, `inverse`. Unknown styles revert to `standard`. 【F:apps/app1/documonster.html†L666-L683】【F:apps/app1/documonster.html†L1210-L1213】【F:apps/app1/documonster.html†L1409-L1418】 |
| `html` | string | Convenience cache containing `windows` concatenated together. Editors may regenerate this value from the `windows` array when saving. 【F:apps/app1/documonster.html†L695-L719】【F:apps/app1/documonster.html†L1234-L1258】【F:apps/app1/documonster.html†L1449-L1457】 |

Applications should preserve unrecognized fields to remain forward-compatible. During editing Docu Monster keeps the `windowLayout` array synchronized with live measurements and updates `html` whenever a window changes. 【F:apps/app1/documonster.html†L1409-L1457】

### 4.2 Frame (`type: "frame"`)

Frames represent floating or block-level regions that can contain either text or image content.

| Field | Type | Description |
| --- | --- | --- |
| `frameType` | string | Either `text` or `image`. Anything else is coerced to `text`. 【F:apps/app1/documonster.html†L1260-L1272】 |
| `mode` | string | Placement strategy. Accepted values: `overlay`, `float-left`, `float-right`, `block`. Missing values default to `overlay`. 【F:apps/app1/documonster.html†L1260-L1272】【F:apps/app1/documonster.html†L1686-L1710】 |
| `x`, `y` | numbers | Overlay origin in millimetres from the page’s top-left corner. Used only when `mode` is `overlay`. Defaults to `30` mm horizontally and `40` mm vertically. 【F:apps/app1/documonster.html†L1260-L1267】【F:apps/app1/documonster.html†L1686-L1696】 |
| `width`, `height` | numbers | Frame dimensions in millimetres. Defaults are `60`×`40`. Values below editor minimums are clamped at runtime. 【F:apps/app1/documonster.html†L1260-L1269】【F:apps/app1/documonster.html†L1686-L1694】 |
| `content` | string | Rich-text HTML payload used when `frameType` is `text`. Non-string values fall back to `<p>Frame content</p>`. 【F:apps/app1/documonster.html†L1260-L1270】【F:apps/app1/documonster.html†L1584-L1614】 |
| `src` | string | Image source URL used when `frameType` is `image`. Defaults to the empty string. 【F:apps/app1/documonster.html†L1260-L1271】【F:apps/app1/documonster.html†L1596-L1604】 |
| `caption` | string | Figcaption text displayed under the frame. Defaults to empty. 【F:apps/app1/documonster.html†L1260-L1271】【F:apps/app1/documonster.html†L1606-L1613】 |
| `style` | string | Visual skin for the frame. Supported values: `standard`, `outline`, `shadow`, `banner`. Unknown styles revert to `standard`. 【F:apps/app1/documonster.html†L666-L683】【F:apps/app1/documonster.html†L1210-L1213】【F:apps/app1/documonster.html†L1681-L1688】 |

Frame positioning is resolved in millimetres and converted to pixels at render time. Overlay frames use absolutely positioned coordinates, while the float and block modes rely on standard layout rules with preset margins. 【F:apps/app1/documonster.html†L1686-L1710】

## 5. Measurement units

All physical measurements inside the document (column layouts and frame rectangles) are stored in millimetres. Rendering code converts values to pixels using the current DPI configuration. Consumers should apply the same unit to remain consistent with Docu Monster’s rulers and export pipeline. 【F:apps/app1/documonster.html†L1185-L1186】【F:apps/app1/documonster.html†L1686-L1707】【F:apps/app1/documonster.html†L1431-L1447】

## 6. Text content expectations

`windows` strings and text `content` fields are HTML fragments. They may contain inline markup, headings, lists, and classes relied on by theme CSS (for example, `class="news-rail"`). Consumers should sanitize or scope styles according to their runtime requirements.

## 7. Persistence and compatibility guidelines

* Preserve unknown properties at both the document and element level to remain compatible with future releases. The editor merges the saved JSON with template defaults instead of discarding fields. 【F:apps/app1/documonster.html†L1194-L1203】【F:apps/app1/documonster.html†L1230-L1272】
* When generating documents programmatically, always provide at least one page with one element to avoid empty layouts.
* Applications may omit convenience caches like `html`; Docu Monster rebuilds them when loading. 【F:apps/app1/documonster.html†L1234-L1258】【F:apps/app1/documonster.html†L1409-L1457】
* Use UTF-8 encoding and normalize line endings to LF for cross-platform consistency.

## 8. Example (abridged)

```json
{
  "version": "1.3.0",
  "docVersion": "1.3.0",
  "codename": "Heritage Gazette",
  "docName": "Docu Monster Studio Pro",
  "releaseNotes": [
    "Two-page broadsheet kit inspired by 1940s U.S. metropolitan newspapers."
  ],
  "pages": [
    {
      "title": "THE EVENING LEDGER",
      "subtitle": "Founded 1898 • Final Edition",
      "deck": "Compose a commanding banner…",
      "theme": "standard",
      "elements": [
        {
          "type": "columns",
          "columns": 3,
          "windows": ["<p>…</p>", "<p>…</p>", "<p>…</p>"],
          "windowLayout": [
            { "width": 55, "height": 115 },
            { "width": 55, "height": 115 },
            { "width": 55, "height": 115 }
          ],
          "style": "standard"
        },
        {
          "type": "frame",
          "frameType": "image",
          "mode": "block",
          "width": 160,
          "height": 80,
          "caption": "Swap in a wire-service photograph with a crisp cutline beneath the fold.",
          "style": "outline"
        }
      ],
      "footerLeft": "The Evening Ledger • City Desk",
      "footerRight": "Edition {{version}} • Page {{page}} of {{total}}"
    }
  ]
}
```

This example omits the optional `html` cache and secondary page entries for brevity.
