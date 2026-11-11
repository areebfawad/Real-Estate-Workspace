# Marina Gate FF-002 · Version 3 | Release & acceptance matrix

## Scope addressed in this iteration

- Brought the standalone hand-drawn property map into the public homepage, introduced `/map` as a first-class website route, linked from desktop/mobile navigation and footer.
- Connected the map to the same SQLite database used by search and the agent/admin dashboards through read-only `GET /api/map/listings` (maximum 300 active properties). No second store or duplicate property definitions.
- Added 6 fictional plots to the clean 60-listing demo seed to demonstrate apartment / house / plot interaction. They are not actual Dubai parcels.
- Implemented 60 separated tappable pins, search by title/area/reference, sale/rent and type filters, drag/zoom, mobile bottom sheet, detail preview, local favourites, and full listing navigation.
- Map inquiry form now posts to the existing `POST /api/inquiries`, which records the immutable listing-to-agent attribution and makes the lead visible to the agent and admin. No email claims unless configured.
- Added property detail → map deep links, improved public navigation, map section styling, focus states, mobile spacing and plot-specific statistics.
- Updated Content Security Policy to allow **only the same-origin map frame**; the map frame uses X-Frame-Options SAMEORIGIN while main pages retain DENY. Other protections remain as in V2.
- Isolated automated tests from the presentation database with `MG_DATA_DIR` and a unique temporary data directory so `npm test` is repeatable and does not modify the demo credentials.

## QA evidence

- **14/14** Node integration tests passed, repeated twice from the updated source. Includes login, agent/admin authorization, listing CRUD, private notes, CSV, uploads, CSRF, sitemap, map catalog and map sync on create/archive.
- Browser rendering was exercised in headless Chromium **using the exact CSS/JS and local API fixture data in an offline page**, because the browser environment restricted navigation to local HTTP. Desktop 1300px and mobile 390px map: 60 pins rendered, first property opened, no uncaught page errors or horizontal overflow. Plots filtering returned 6.
- Homepage styling checked at desktop 1440px and mobile 390px; admin dashboard, agent listings, lead table and login were rendered from API response fixtures with no uncaught page errors or root overflow. Screenshots in `docs/previews/` are previews produced with these fixture-driven browser renders, not captures from a deployed live browser session.
- Server HTTP smoke checks passed for `/health`, `/`, `/map`, `/api/map/listings`, `/api/listings?type=Plot`, `/assets/map-explorer.html`, and `/assets/map-integrated.js`; CSP and frame permissions were verified.

## Key routes

| URL | Intended user | Function |
|---|---|---|
| `/` | Visitor | Luxury homepage + interactive map section |
| `/map` | Visitor | Expanded hand-drawn SVG property explorer |
| `/map?ref=MGP-0001` | Visitor | Map deep-link auto-focuses matching sample property |
| `/properties` | Visitor | Search and filter all demo listings |
| `/buy/...` or `/rent/...` | Visitor | Property detail, gallery, Google Maps embed, adviser, inquiry |
| `/login` | Staff | Login |
| `/portal` | Authenticated agent/admin | Role-scoped overview |
| `/portal/listings` | Staff | Owner-scoped/admin-wide listing management |
| `/portal/listings/new` | Staff | New listing + up to 20 uploaded photos |
| `/portal/leads` | Staff | Role-scoped leads and follow-up |
| `/portal/team`, `/portal/import`, `/portal/activity` | Admin only | Agent management, CSV import, audit trail |
| `/portal/settings` | Staff | Password change |

## Client brief: pending external delivery / acceptance

These are **not** claimed complete: actual spreadsheet migration of 60 real records and Drive photographs, verified supplier email reaching agent and admin within two minutes, production domain/hosting/backup and security hardening, physical iPhone/iPad Safari acceptance, 4G under-three-seconds measurement, official client-written area guides, competitor design approvals, recorded agent training and production deployment.

The current map is intentionally **illustrative**, not a real GIS layer. For production map locations, plan accurate client-confirmed property geocoding and decide whether Google Maps, Mapbox or another mapping provider is appropriate (API costs and terms require review). Never present these schematic pins as official land boundaries.

## Local verification

```bash
node --version
npm run setup
npm test
npm start
```

Use Node 24 (Node >=22.16 minimum as described in the README). No external npm packages are needed.
