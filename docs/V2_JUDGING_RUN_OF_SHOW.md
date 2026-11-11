# FF-002 — Judges' live demonstration (8 minutes)

**Main argument:** We do not sell another pretty property page. We give Marina Gate ownership of its listings, leads and agent attribution. This is an executable prototype with 9 distinct agent accounts and 60 clearly fictional listings.

## Before judges enter

- Install Node.js 24 if available. Unzip the package. Run `npm run setup` then `npm start`.
- Open `/` and `/portal` in browser tabs. Have `data/demo-credentials.txt` open **privately**; never put credentials on a public projector.
- Confirm you have no real secrets or real client contact details in the demo database.
- Keep the proposal PDF open, but lead with the live application.

| Time | Screen | What you say and demonstrate |
| --- | --- | --- |
| 0:00–0:55 | Homepage | Premium, mobile-first brand presence; the site is a reusable CMS, not a static brochure. |
| 0:55–1:50 | `/properties` | Filter buy/rent, Dubai Marina/JBR/Business Bay, unit type, bedrooms, furnished, price; sort low-to-high and reset. |
| 1:50–2:35 | Property details | Gallery, specs, amenities, location, adviser ownership, WhatsApp/call affordances and inquiry form. Note that illustrated sample visuals are not real units. |
| 2:35–3:35 | Inquiry and admin portal | Submit a safe fictional inquiry. Find it in admin inquiries with its assigned agent, property reference and email notification **demo-not-sent** label. |
| 3:35–4:50 | Agent view | Sign in as an agent. See only own listings and leads. Open new listing form, show featured state and photo upload workflow. Explain server-side authorization. |
| 4:50–5:40 | Follow-up planner | Open an inquiry, add internal notes and a follow-up date. Explain these details do not appear in public listing responses. |
| 5:40–6:25 | Team + account security | Admin sees nine agent profiles and can deactivate or reset an account. Agent can change own password, revoking other sessions. |
| 6:25–7:10 | CSV migration + audit | Show import by reference, private lead CSV export and action audit trail. Original 60 client properties still require the real spreadsheet and photo folders. |
| 7:10–8:00 | Proposal PDF | 8-week plan; client approvals at week 2, working inventory week 4, migrated inventory and training week 6, launch by week 8; 30/30/25/15 payments. |

## Questions to anticipate

**Why not WordPress?** Both WordPress and a bespoke app are viable. We chose a dependency-light Node prototype to demonstrate fully working role-scoped management, fast iteration and no paid plugins. Production hosting must be checked against the client's existing cPanel capability. Do not claim deployment is final.

**Are the 60 properties the client's actual inventory?** No. They are fictional data to prove search and permissions. The client's source workbook and Drive folders have not been shared.

**Is email delivery guaranteed under two minutes?** No. The system stores leads immediately and has a provider integration path; live deliverability, recipient mapping, SPF/DKIM and actual inbox receipt need acceptance testing after genuine credentials are configured.

**Why the illustrations?** Judges may have unreliable Wi-Fi. We bundled differentiated original concept fallback visuals so pages remain coherent offline. They must not be represented as listing photography.

**Is this production ready?** It is a runnable demo foundation. Production requires a security review, managed storage and backups, genuine assets, live email tests, Safari/iPhone testing and measured 4G performance.
