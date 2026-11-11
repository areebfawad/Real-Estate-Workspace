# Testing & Acceptance Plan

## Automated tests executed for the demo

Run:

```bash
npm test
```

The integration suite starts a real HTTP server and verifies:

1. Public buy/rent + area + bedrooms + price ordering.
2. Admin sees all listings; each agent only their own.
3. Agent cannot delete another agent's listing.
4. Session authentication, forbidden admin area and CSRF rejection.
5. Agent create / feature / update / soft-delete lifecycle.
6. New inquiry becomes visible only to assigned agent and admin; lead status mutation authorization.
7. Admin lead CSV export, safe image rejection and sitemap/SEO metadata.

**Observed in development:** all 10 Node test checks passed. Tests may mutate a local demo database; regenerate clean sample data before presenting.

### Additional smoke checks

- JavaScript syntax: `node --check server.mjs` and `node --check public/assets/app.js`.
- Desktop/browser static layout successfully rendered with a headless Chromium environment using injected responses because direct browser network navigation was restricted in the execution environment.
- 390px responsive snapshots for home, catalogue, login and dashboard showed no document-level horizontal overflow after styling fixes.
- These checks **do not** replace end-to-end tests in normal deployed Chrome/Safari with real HTTP traffic.

## Client acceptance test protocol

| Test | Method | Pass condition | Status |
|---|---|---|---|
| 60-row migration | Compare DB export to original spreadsheet on ref, price, purpose, size, agent, amenities | All 60 match / written exception list signed | Pending actual data |
| Google Drive photos | Join folder name to property reference; check 1–20 images per property | Every photo belongs to correct listing; no broken links | Pending photos |
| Agent independence | Sign in as each agent; attempt other agent's ID via API | Unauthorized access denied; own CRUD works | Demo automated; real accounts pending |
| Under-10-minute listing | Give guide to untrained agent, time first complete listing | Finished in under 10 minutes without developer help | Pending measured test |
| Inquiry email routing | Contact 3 different agent listings and inspect inbox timestamps | Correct agent receives; principal copied; under 2 min | Pending real mail |
| Email failure | Temporarily reject provider request | Lead safely stored, failure visible, safe retry | Provider exercise pending |
| Mobile Safari | iPhone 13/15/16 representative iOS Safari and iPad | No functional regression, touch/forms/gallery okay | Not executed on Safari |
| 4G performance | Lighthouse/WebPageTest or equivalent with representative 20 photos | Property detail fully useful within 3s on agreed 4G target | Not measured |
| SEO | Crawl sitemap, canonical routes and content | Search Console validates pages, no unexpected 404/duplicate | Partial demo implementation |
| Security | Sessions, role escalation, CSRF, XSS, rate limits, uploads, logs | Pen test no critical/high findings | Demo integration only |
| Data protection | Retention policy, delete/export process, privacy disclosures | Client legal approval | Pending |
| Recovery | Backup restore to staging and DNS/SSL checklist | Restore works with verified RPO/RTO | Pending production |
| Training | 9 agents, 1 recorded screen-share and cheat sheet | Video + sheet delivered and client acceptance | Cheat sheet supplied; recording pending |

## Test strategy by stage

- **W1–2:** Figma reviews and mobile task walkthrough; no code functionality acceptance yet.
- **W3–4:** unit/integration tests with 10 real client sample listings, auth/permission negative cases.
- **W5–6:** migration reconciliation, import idempotency, 20-image file tests, training/agent speed trial.
- **W7–8:** deployed end-to-end scenarios, iPhone Safari QA, real email inbox timed tests, 4G benchmarks, SEO, monitoring, backup recovery and UAT sign-off.

## Known demo constraints

- No actual spreadsheet and property photo assets (current 60 are fictional).
- External Unsplash sample imagery needs Internet; offline fallback is a local SVG illustration.
- First-party analytics uses aggregate page views and does not identify individual users.
- Image compression in demo is client-side; production requires additional server-side re-encoding/CDN and adversarial media validation.
- Email API is disabled by default, and delivery is not guaranteed by a successful provider submission.
- Node's built-in SQLite is convenient for demo but should receive a dedicated production support review.
