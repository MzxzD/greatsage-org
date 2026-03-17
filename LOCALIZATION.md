# Localization — Great Sage Website

## How It Works

**Approach:** Client-side i18n with JSON translation files and `data-i18n` attributes.

1. **Translation files:** `i18n/en.json`, `i18n/de.json`, etc. — flat key-value structure
2. **Markup:** Elements with `data-i18n="key"` get their text replaced on load and on lang switch
3. **Script:** `i18n.js` loads the active locale, walks the DOM, replaces content
4. **Persistence:** User choice stored in `localStorage` (`greatsage-lang`)
5. **Detection:** On first visit, uses `navigator.language` to pick closest supported locale

## Supported Languages

| Code | Language |
|------|----------|
| en | English |
| de | German |
| es | Spanish |
| hr | Croatian |
| ja | Japanese |

## Adding a New Language

1. Copy `i18n/en.json` to `i18n/xx.json`
2. Translate all values (keep keys unchanged)
3. Add to lang switcher in `index.html`
4. Add to `SUPPORTED_LOCALES` in `i18n.js`

## Attributes

| Attribute | Purpose |
|----------|---------|
| `data-i18n="key"` | Replace element textContent with translation |
| `data-i18n-html="key"` | Replace element innerHTML (for links, etc.) |
| `data-i18n-placeholder="key"` | Replace placeholder attribute |
| `data-i18n-attr="title:key"` | Replace title (or other attr) with translation |

## SEO Notes

- `document.documentElement.lang` is updated on switch
- For per-locale URLs (better SEO), consider static `/de/`, `/es/` pages or SSR later
