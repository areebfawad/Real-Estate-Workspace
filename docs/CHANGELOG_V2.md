# Version 1.1 — continuation changes

1. Added authenticated `/portal/settings` page for admin and agent account management.
2. Implemented `/api/auth/change-password`, checking current password and enforcing 12+ characters with mixed character classes. Changes revoke other active sessions and are logged.
3. Added `internal_notes` and `follow_up_at` to inquiry storage with idempotent migrations for older demo databases.
4. Extended existing lead PATCH endpoint with strict date validation and preserved server-side access checks.
5. Added a private follow-up editor dialog on inquiry management and additional authorised CSV export columns.
6. Added 12 original editorial architectural SVG fallbacks so the public property gallery remains visually populated when remote placeholder URLs fail. These are demo concept visuals, not real client photos.
7. Added test cases for lead note isolation, CSV export, invalid dates, password changes, session revocation and local visual assets.
8. Added updated 8-minute judging walkthrough; production constraints remain documented and unchanged.

**Test count:** 13 successful Node test assertions/subtests on development runtime v22.16.0. The browser sandbox did not allow loopback navigation for an additional automated Chromium walkthrough; no claim of new Safari/iPhone acceptance is made.
