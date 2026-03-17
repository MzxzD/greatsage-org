# Security & SEO (greatsage.org)

## Security

- **HTTPS:** GitHub Pages serves the site over HTTPS. Ensure **Enforce HTTPS** is enabled: repo **Settings → Pages → Enforce HTTPS** (check the box). GitHub provisions the certificate for greatsage.org once DNS points to them.
- **Referrer policy:** `index.html` includes `<meta name="referrer" content="strict-origin-when-cross-origin">` so full URLs are not sent to third-party sites on downgrade.
- **No custom headers on GitHub Pages:** You cannot set CSP or X-Frame-Options via this static setup; GitHub sets their own. For stricter CSP you’d need a proxy or different host.

## Google / indexability

- **Canonical:** `<link rel="canonical" href="https://greatsage.org/">` so search engines treat this as the canonical URL.
- **Robots:** `<meta name="robots" content="index, follow">`. No blocking of indexing.
- **robots.txt:** Allows all user-agents and points to `https://greatsage.org/sitemap.xml`.
- **sitemap.xml:** Single entry for the homepage. Submit in [Google Search Console](https://search.google.com/search-console) (add property greatsage.org) for faster discovery.
- **Structured data:** JSON-LD for `Organization` and `WebSite` so Google can show rich results if applicable.

## Accessibility

- **Skip link:** "Skip to main content" for keyboard users (index.html, understand.html).
- **Reduced motion:** `prefers-reduced-motion` respected — animations and transitions minimized.
- **Focus styles:** Visible `:focus-visible` outlines on buttons, links, and interactive elements.
- **ARIA:** Semantic HTML, `aria-label` on nav/buttons, `aria-hidden` on decorative icons, tab panels with correct `aria-controls`/`role="tabpanel"`.
- **Dark mode:** Blue palette (Janet-aligned) with system preference support; manual toggle available.
- **Gradient text:** Fallback `color` for hero and section headings when gradient is unsupported.

## Optional next steps

- **Google Search Console:** Add `https://greatsage.org` as a property and submit the sitemap.
- **Favicon:** Add a `favicon.ico` or `apple-touch-icon` and link it in `<head>` for bookmarks and tabs.
- **og:image:** Currently set to `https://greatsage.org/assets/hero-mascot.png`. Use a 1200×630 image for best social previews if you change it later.
