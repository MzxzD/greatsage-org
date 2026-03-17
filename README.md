# The Great Sage — Company site

Source for **greatsage.org**. The Great Sage builds Janet — the offline-first, privacy-first AI companion ecosystem.

- **Static site:** single `index.html`, no build step.
- **Assets:** `assets/` (hero and about imagery).
- **Deploy:** GitHub Pages; `CNAME` = greatsage.org.
- **Security & SEO:** [SECURITY_AND_SEO.md](SECURITY_AND_SEO.md) — HTTPS, canonical, robots, sitemap, JSON-LD.

- **DNS runbook (re-do with less pain):** `Janet-Projects/JanetOS/docs/business/DNS_GREATSAGE_ORG_PAGES.md` — order of operations, all records, troubleshooting, check scripts.
- **Check scripts (run with `bash`):**
  - `./check-greatsage-dns.sh` — Verifies A (4), www CNAME, TXT. Run after adding DNS; when all pass, click Verify in GitHub.
  - `./check-github-pages-verify-txt.sh` — Prints TXT to add; exits 0 when TXT is live so you can click Verify. Set `GITHUB_TXT_VALUE` if GitHub showed a new value.

Full plan (content, social, donations, imagery): `Janet-Projects/JanetOS/docs/business/GREAT_SAGE_WEB_PLAN.md` in the Documents workspace.
