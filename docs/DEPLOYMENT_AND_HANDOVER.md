# Deployment, Operational Readiness & Handover

## 1. Local demonstration

1. Verify `node --version` is at least `v22.16.0`. Node 24 is recommended for continued support.
2. Run `npm run setup`; check credentials in the newly generated `data/demo-credentials.txt`.
3. Run `npm start`; visit `http://localhost:3000` and `/login`.
4. Run `npm test`; reset the database after test mutations for a pristine presentation.
5. Keep the server process active during the judging session. The provided Windows launcher performs local setup.

## 2. Hosting review before contracting production

Inspect the client's cPanel environment: Node.js application manager, runtime version, persistent disk, process restart, reverse proxy, TLS certificates, outbound HTTPS for email, image file limits, DNS ownership, backups and logs. **Do not claim compatibility without access.** If Node is not supported or process management is fragile, quote a managed Node runtime. If the current PHP-only host is compulsory, the backend would require a separately planned Laravel/PHP rebuild, not a copy-and-paste deploy.

## 3. Secrets / mail

Copy `.env.example` to `.env`. Provide actual values only through a secure client-approved channel. The prototype supports these settings:

- `PORT`, `HOST`, `APP_BASE_URL`, `NODE_ENV`.
- `COOKIE_SECURE=1` for HTTPS; production mode also sets Secure and HSTS.
- `TRUST_PROXY=1` only if an authenticated reverse proxy forwards trustworthy metadata.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to activate the transactional email provider API.
- `ADMIN_NOTIFICATION_EMAIL` for the managing partner's CC address.

Do not put secrets in version control or presentations. Ensure `RESEND_FROM_EMAIL` domain authentication is verified. For accepted notification calls, a status of *provider accepted* is not proof of inbox receipt. Log actual inbox test timestamps; confirm sender/SPF/DKIM/DMARC and any delivery webhooks.

## 4. Content and data migration

- Receive the original spreadsheet and all 60 reference-named folders, audit malformed/duplicate references.
- Normalize location labels, unit types, furnished flag, transaction units and owner/agent mapping.
- Import the CSV via admin portal using column headers in the template.
- Move authentic images through the uploader or a dedicated production batch image pipeline, matching ref to folder; avoid hotlinking client Drive photos.
- Reconcile all imported rows back to the source sheet with a sample sign-off log.
- Replace fictional area guide copy with the client's three supplied texts.
- Replace sample nine accounts with real verified agent details, separately delivered strong passwords and documented access policy.
- Remove all fictional leads and photos from production database.

## 5. Infrastructure requirements for production

- Persistent production DB with backups, recovery drill and migration scripts.
- Secure asset storage, private origin access for writes and controlled public CDN for resized images.
- HTTPS/TLS, automatic certificate renewal, locked reverse-proxy headers, network firewall.
- A verified mail provider, monitored failures, alerting and periodic deliverability checks.
- Log aggregation with PII redaction, audit retention, basic uptime monitoring and error alerting.
- Analytics consent and Search Console/domain verification where applicable.
- Load testing with representative active inventory and user traffic.

## 6. Operational handover

Provide: live URL, admin/agent onboarding instructions, 1-page cheat sheet, recorded 30–45-minute screen share, reference mapping report for 60 properties, backup/restore runbook, mail notification proof, Safari/4G test logs, DNS/domain credentials access transfer, agreed warranty/maintenance terms and support escalation.

**Costs:** No annual third-party plugin license charges in this demo. Production hosting, storage, CDN, transactional email and domain are separate operating expenses; obtain quotes before client sign-off. Avoid promising any provider's pricing without a live quote.
