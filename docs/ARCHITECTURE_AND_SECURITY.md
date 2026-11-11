# Architecture, Data Model and Security

## Architecture

```text
[Visitor: Safari / Chrome / Mobile]
      |
      | HTTPS (local demo: HTTP)
      v
[Responsive browser UI] -- /api/listings -> [Node HTTP service]
      |                                        |   |
      | inquiry + reference                    |   +--> [SQLite relational demo DB]
      |                                        |             users / sessions
      |                                        |             properties / inquiries
      |                                        |             audit_logs / analytics_views
      |                                        |
      |                                        +--> [Resend API, optional]
      |                                               to: assigned agent
      |                                               cc: manager
      v
[Admin or Agent Portal] -- HTTP-only session --> [Backend role checks]
                                                | Admin: all
                                                | Agent: own properties/leads only
                                                v
                                          [CSV + image uploads]
```

**Prototype tech:** Node 22.16+ (Node 24 recommended), built-in `node:http`, `node:crypto`, `node:sqlite`, ES modules, HTML5 / CSS3 / vanilla JavaScript. No npm third-party runtime dependencies. The database is persistent across restarts and created by `npm run setup`.

**Production architecture target:** use a supported Node-compatible host (verify existing cPanel's Node app support, reverse proxy, TLS, persistent storage and backup capabilities), relational production database, object storage plus server-side image transformations, verified transactional email, centralized monitoring/backup. SQLite here is an intentional portable demo database, not a claim of a production-ready horizontally scaled setup. Migration to PostgreSQL requires a planned database adapter change and end-to-end retest.

## Database relationships

```text
users (1 admin + 9 agents)
  | 1 --> N sessions
  | 1 --> N properties
  | 1 --> N inquiries [assigned to this agent]
  | 1 --> N audit_logs [nullable actor for visitors]
properties
  | N --> 1 users [agent_id]
  | 1 --> N inquiries [property_id]
  | amenities_json = array of validated amenities
  | photos_json = 0..20 validated image URLs
inquiries
  | N --> 1 properties
  | N --> 1 users [agent_id copied from property on submit]
analytics_views
  | indexed by [date, public pathname], aggregate counts only
```

### Important design invariant: attribution

The inquiry endpoint accepts `property_id`, name, email, phone and message. It **never** takes `agent_id` from the visitor. Before saving it loads the property, checks that it is active, reads its assigned `agent_id`, writes both IDs to the lead record, then tries the configured email provider. Lead record and attribution persist even if sending fails.

This prevents attribution from being manipulated by client-side forms or URL parameters. The administrator sees all rows; an agent's SQL queries always filter by their own identity. Production should additionally define whether historical inquiries retain original attribution when a listing transfers to another agent (current demo does).

## Permission matrix

| Capability | Visitor | Agent | Administrator |
|---|:---:|:---:|:---:|
| View/search active listings | ✓ | ✓ | ✓ |
| Submit inquiry | ✓ | ✓ | ✓ |
| Access private portal | — | ✓ | ✓ |
| Create listing | — | ✓ self | ✓ assign agent |
| Edit/feature/archive listing | — | ✓ own | ✓ any |
| Upload property image | — | ✓ | ✓ |
| View inquiries | — | ✓ own | ✓ all |
| Change inquiry stage | — | ✓ own | ✓ all |
| Export inquiry CSV | — | ✓ own | ✓ all |
| Manage agent profile / deactivation | — | — | ✓ |
| Reset agent password | — | — | ✓ |
| Bulk import/update property CSV | — | — | ✓ |
| View audit logs | — | — | ✓ |

`GET /api/portal/team` and `/api/portal/audit` return 403 for an agent. The browser hiding a menu item is never considered the authorization control.

## Security controls implemented

- Salted 64-byte scrypt-derived password hashes, compared with `crypto.timingSafeEqual`. Demo passwords are cryptographically random and unique per account.
- 256-bit random login session tokens; only the SHA-256 token hash is stored server-side.
- HTTP-only, SameSite=Lax session cookies with 7-day expiry; `Secure` when production HTTPS is active.
- CSRF token per active session required for authenticated writes; same-origin check for mutation requests.
- Allowed-list validation of listing types, areas, status, purpose and role; upper bounds on numbers, lengths and photo counts.
- Prepared SQLite statements; strict sort-order allowlist; no user-driven SQL identifiers.
- Backend ownership checks on listing edit/archive, lead read/status and CSV output.
- Image upload accepts magic-byte validated JPG/PNG/WebP; random UUID filenames; 2MB maximum optimized upload; upload folder does not allow arbitrary extensions or scripts.
- Browser optimization downsizes photo to 1600px, WebP where possible and JPEG fallback. The browser fallback also supports iOS engines without `createImageBitmap`.
- Security headers: CSP, no MIME sniffing, frame deny, referrer policy and production HSTS.
- Email API keys read from `.env`, never shipped; agency leads not exposed in unauthenticated endpoints.
- Rate limits on password attempts, public inquiries, uploads and analytics view submissions.
- CSV export neutralizes possible spreadsheet formula execution by prefixing spreadsheet-control leading characters.
- Activity trail of login, logout, listing CRUD, photo uploads, inquiry creation/status, imports, agent updates and password resets.

## Additional production controls before launch

1. HTTPS verified end-to-end and reverse proxy trust configured only for actual ingress.
2. Real credential provisioning, secure password-change/recovery flow and optional MFA for principal.
3. Automated database backups, encryption-at-rest and tested restore procedure.
4. Server-side image decode/re-encode to safe dimensions; malware checks; image CDN/object storage.
5. Email sending domain verified (SPF/DKIM/DMARC), delivery webhooks, failure alerts and two-minute live inbox test.
6. Anti-spam abuse service or CAPTCHA based on real inquiry traffic; IP/device rate limits in shared infrastructure if multiple instances.
7. Production monitoring, exception alerts, logs/PII retention, operational runbook.
8. Security test with actual account states, inactive-agent data retention and ownership changes.
9. Privacy notice, data retention/export/delete policy, approved cookie/analytics disclosures and applicable client legal review.
10. Independent Safari + real 4G testing, accessibility audit and a crawler/structured data review.

## API summary

**Public:**
- `GET /api/listings?purpose=buy&area=JBR&bedrooms=2&minPrice=...&maxPrice=...&furnished=yes&sort=price_asc&page=1`
- `GET /api/listings/:slug`
- `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/inquiries`
- `POST /api/analytics/view` (aggregate only)
- `GET /sitemap.xml`, `GET /robots.txt`

**Authenticated:**
- `GET /api/portal/stats`, `/api/portal/listings`, `/api/portal/leads`
- `POST /api/portal/listings`
- `PATCH|DELETE /api/portal/listings/:id`
- `PATCH /api/portal/leads/:id`
- `GET /api/portal/leads/export.csv`
- `POST /api/portal/leads/:id/retry-email`
- `POST /api/uploads` (base64 optimized photo)

**Admin only:**
- `GET /api/portal/team`, `PATCH /api/portal/team/:id`
- `POST /api/portal/team/:id/reset-password`
- `POST /api/portal/import`
- `GET /api/portal/audit`

All admin/agent write requests must include the session's `x-csrf-token`. Error payloads include appropriate HTTP status and a human-readable message. Server validates payloads regardless of client-side form constraints.

## Additional controls in v1.1

- Password change requires current password, password complexity, a valid CSRF token, and a signed-in account. All other sessions for that identity are immediately invalidated.
- Internal lead notes and follow-up dates are private server-side fields. Agent access checks run before writes or reads; general visitors cannot access portal inquiries. CSV export requires session authentication.
- Demo SVG visual backups load from the application origin; no third-party image availability is needed to present the concept.
