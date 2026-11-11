# MARINA GATE PROPERTIES
### FF-002 · Client-ready concept demo, v1.2 / MAP EXPERIENCE V3 · Freelancing Fest 2026

A premium, responsive property-listings website with a **working demonstration backend**, an administrator workspace, **nine independent agent logins**, real property CRUD, agency-level search, owner-attributed inquiries, private follow-up notes and dates, CSV export, basic first-party analytics and a controlled spreadsheet importer.

**This is a judges' functional prototype, NOT a live production deployment.** It generates 60 illustrative properties and 18 fictional inquiries. No private client spreadsheet, photos, agents' actual credentials or live sending service were included in the supplied brief. Required production acceptance tests are documented separately.

## V3 — Interactive map integrated into the agency website

The separate HTML map prototype has been integrated directly into the main website, with **one shared property database**. The homepage contains a large interactive map showcase, a dedicated **`/map`** page is linked from primary navigation, and each property detail page has a deep link to `/map?ref=MGP-0001`. The map fetches **all active properties** from `GET /api/map/listings`; an agent's newly published property appears on refresh, and an archived property disappears. The pin detail panel links to the real public property route. Map inquiries submit to the original `POST /api/inquiries` workflow, retaining server-side listing-to-agent attribution, admin visibility and CSV export.

**Important:** The map's geography and pin positions are custom-drawn and illustrative, not GPS tracking, Google Maps, cadastral information or legal land boundaries. All 60 starting properties, agents and 18 starting inquiries are fictional demo data. Existing external property photos automatically fall back to local concept illustrations when unavailable. The real client spreadsheet, photos, final competitor references and area-guide copy were not supplied.

### Quick start (Windows)

The download ZIP has **no extra nested project folder**. Its root contains `package.json`, `START_DEMO_WINDOWS.bat` and `server.mjs`.

1. Extract the ZIP. Double-click `START_DEMO_WINDOWS.bat` in the same folder as `package.json`.
2. Visit **http://localhost:3000**, click **Map explorer** in the header, or scroll to the map section on the homepage.
3. Use **http://localhost:3000/login** and read the randomly generated demo accounts from `data/demo-credentials.txt`.
4. For commands: `npm run setup`, `npm start`, and in a separate terminal `npm test`. **No `npm install` necessary.**

**Demo script:** `docs/V3_JUDGES_MAP_DEMO_SCRIPT.md` · **Verification and scope:** `docs/V3_RELEASE_AND_TEST_MATRIX.md`.

---

## 🚀 Run on Windows (easiest)

1. Install a supported Node.js runtime — **Node 24 recommended; Node 22.16+ also tested**. Download from https://nodejs.org/
2. Unzip the package. Double-click **`START_DEMO_WINDOWS.bat`**, or use the commands below.
3. Open **http://localhost:3000**.
4. Open **`data/demo-credentials.txt`** (generated on first run). Log in at **http://localhost:3000/login** as administrator or any of the nine agents.
5. Demo and production keys are intentionally NOT pre-configured. Don't use demo passwords for a real business.

## Terminal commands

```powershell
cd MarinaGate_FF002_Judges_Demo
node --version
npm run setup
npm start
```

No `npm install` is required: **this demo has zero third-party npm packages**. All server dependencies are Node built-ins, including the SQLite module. On Node 22, Node may print an "ExperimentalWarning" for built-in SQLite; on newer Node versions, the module maturity changes. The implementation was exercised with Node 22.16.0.

**Browse:** `http://localhost:3000` · **Agent portal:** `http://localhost:3000/login` · **Admin dashboard:** `/portal`.

To run the automated backend tests: `npm test`. **Tests use an isolated temporary database** and will not modify your personal demo data, logins, leads or listings.

### Reset to pristine demonstration data

Stop the server. Delete `data/marina-gate.sqlite`, `data/marina-gate.sqlite-wal`, `data/marina-gate.sqlite-shm` and `data/demo-credentials.txt` if they exist; then run:

```powershell
npm run setup
npm start
```

Passwords are **generated with cryptographic randomness** at the first setup and saved locally with the credentials list. The sample database and credentials file are excluded from this archive.

## 🎭 Walkthrough for a 5–7 minute judging demo

| Time | Navigate | Demonstrate |
|---|---|---|
| 0:00–0:50 | `/` | Luxury positioning, responsive hero, search, communities |
| 0:50–1:20 | `/map` | Custom drawn map, 60 database-backed pins, apartment/house/plot filters, click for details |
| 1:20–1:55 | `/properties` | Buy/rent, location, type, bedrooms, price, furnishing, sorting |
| 1:55–2:40 | Open property | Gallery, amenities, floor area, Google map, responsible agent, WhatsApp / call |
| 2:30–3:10 | Submit inquiry | Saved reference, immutable listing-to-agent attribution |
| 3:10–4:20 | `/login` as **admin** | Stats, entire listing set, all leads, CSV export, nine agent profiles |
| 4:20–5:30 | Agent login | Only the agent's properties and leads; create/edit/feature a listing |
| 5:30–6:30 | `/portal/import` and `/portal/activity` | CSV import approach and audit trail; explain real data migration plan |
| 6:30–7:00 | `docs/JUDGES_PITCH.md` | 8-week timeline, acceptance gates, $2,000 proposal |

**Present responsibly:** sample data is illustrative. Email API requests are *not sent* unless a real sending provider and domain are configured. The UI labels unsent notifications. The agent role limitation is enforced by backend authorization, not by hiding buttons.

## What's working in this prototype

**Public website:** image-led landing page, native schematic interactive map on the homepage and `/map` (connected to the working property catalogue), sale/rental filters, searchable 60-property catalogue (including six conceptual plot listings), price/date sorting, clean deep-link property routes, detail gallery of up to 20 images, amenities, map, agent contact card, WhatsApp/call links, inquiry forms, mobile navigation, three sample neighbourhood guides, about and contact pages, canonical/OG metadata, dynamic sitemap and robots.txt.

**Agent portal:** secure hashed-password login, HTTP-only sessions with CSRF checks, account password changes with other-session revocation, agent-scoped listings and leads, create/edit/feature/archive property listings, browser-side image resize/compression with validation and upload, lead status updates, private follow-up notes and date planning, and own-lead CSV export.

**Administrator:** access to the agency's listings/leads, nine agent profiles and activation status, agent password reset, global lead CSV export, spreadsheet CSV import/update by reference, activity trail, portfolio metrics and privacy-preserving page-view totals.

**Notifications:** lead is persisted before notification; optional Resend API submission routes to listing agent, copies the managing partner, records the result, and retries failed provider requests up to three attempts. Without configured keys it stays in explicit demo/not-sent mode. Actual inbox receipt is NOT verified.

## Not included as real client deliverables yet

The brief mentions 60 real listings with photo folders in Google Drive; **none were provided**, so actual migration has not occurred. The client's three competitor examples and three area-guide texts were not provided. Nor have client emails, domain/DNS, live hosting credentials or analytics accounts been connected. A recorded agent-training session, iPhone Safari acceptance, measured 4G performance, and production mail delivery tests remain project milestones—not claims of the demo.

Other exclusions follow the client brief: Arabic localization, portal syndication feeds, mortgage calculator, blog and photography are **out of scope** (optional separately priced).

## Stack & deployment intent

**Prototype:** responsive HTML5/CSS3 and vanilla ES2022 JavaScript; dependency-free Node.js HTTP server; Node's `node:sqlite` for persistent relational data; built-in `crypto.scryptSync` password hashing; browser Canvas photo optimization. This choice runs in minutes, avoids annual plugin fees and demonstrates the business workflows without external setup.

**Production proposal:** maintain the same design and domain workflows; move to a production-managed database and image pipeline if load/hosting review indicates it, add verified transactional mail, backups, deployment monitoring and automated Safari / 4G tests. A Node-capable cPanel plan may be usable, **but the client's current cPanel configuration must be checked**. If Node deployment is unsupported, recommend a managed Node host before work is contracted. A PHP/Laravel implementation is an alternative only if retaining the existing PHP-only host is mandatory; it is not included in this ZIP.

Licensing for this demo is **$0 per year**. Hosting, transactional email, domain renewal and any CDN/storage charges are separate from the client's ~$150/year license/plugin ceiling.

## Security highlights

Backend-enforced access checks; agent-scoped writes and reads; salted scrypt password hashes; random session bearer tokens stored hashed; HTTP-only SameSite cookies; per-session CSRF tokens; Origin validation; login/inquiry/upload rate limits; server-side validation and prepared SQL statements; image magic-byte checks and 2 MB cap for optimized uploads; private audit and lead tables; CSV formula-injection defense; CSP / security headers; no secrets in source.

**Production hardening still required:** verified HTTPS reverse proxy, operational backups/restore drills, security review, optional admin MFA, abuse control, server-side image re-encoding/CDN, email domain authentication, structured monitoring and actual Safari/performance acceptance. This prototype is not a substitute for a production audit.

## Project files

```text
MarinaGate_FF002_Judges_Demo/
├── START_DEMO_WINDOWS.bat
├── README.md
├── .env.example
├── package.json
├── server.mjs                  # Routing, backend API, auth policies, CSV, mail, uploads
├── src/
│   ├── database.mjs           # Schema, prepared queries, security helpers
│   └── seed.mjs               # 9 agents, admin, 60 fictional properties, 18 sample leads
├── scripts/setup.mjs          # Local first-run seeding and random credentials
├── public/
│   ├── index.html             # Page shell, accessibility and SEO injection
│   ├── assets/app.js          # Public + portal UI/UX and client interactions
│   ├── assets/styles.css      # Responsive luxury design system
│   ├── assets/map-explorer.html  # Self-drawn SVG property map UI
│   ├── assets/map-integrated.js  # Backend listing data, 60 pins, filters, inquiry form
│   ├── assets/fallback.svg    # Offline photography fallback illustration
│   └── uploads/               # Validated images added by agents
├── tests/integration.test.mjs # API / auth / ownership / inquiry / SEO checks
├── docs/                      # Project proposal, scope, architecture, walkthrough
└── data/                      # Database + credentials GENERATED at setup (not shipped)
```

See `docs/` for the detailed client requirements matrix, roles/permissions, architecture, milestone proposal, acceptance tests, deployment instructions, image sources and agent training guide.


## Phase 2 — usability and security refinements (v1.1)

- **`/portal/settings`**: logged-in admin and agents can change their own passwords with current-password verification; all other sessions are revoked. Includes a strong password policy.
- **`/portal/leads`**: assign a pipeline stage, schedule a follow-up date and save internal notes. Notes are restricted to that agent and the administrator, stored server-side, and appear in authorised CSV exports only.
- **Offline-safe previews**: 12 distinct original SVG architectural *concept illustrations* ship with the ZIP. Remote Unsplash placeholder images fall back automatically when Wi-Fi, CDN or browser access is unavailable. Illustrations are **not actual photos of the sample listings**. The original client's Drive photos replace these at handover.
- **Tests**: extended suite covers follow-up ownership/privacy, strict date validation, password verification and session revocation, and the local fallback assets.

### Recommended on-stage addition (60 seconds)

After creating an inquiry, visit **Agent → Inquiries → Plan follow-up**, enter an internal note and next-contact date, then switch to a different agent and show that the inquiry does not appear. End with **Account & security → Change password** and explain that other sessions are revoked.
