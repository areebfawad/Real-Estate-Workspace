# FF-002 Requirements Matrix

Source of truth: **Property Listings Website for a Real Estate Agency**, FF-002, pages 2–3. Client: Marina Gate Properties LLC, Dubai. The implementation distinguishes *working demo*, *integration blocked by missing client inputs*, and *production acceptance pending*.

| # | Client requirement | Demo implementation | Production acceptance / gap |
|---|---|---|---|
| 01 | Brand-new premium website | Image-led responsive landing, editorial typography, gold and deep green identity | Client must approve aesthetics and competitor-based direction |
| 02 | Nine agents | 9 generated, distinct agent accounts + 1 administrator | Actual agent names/emails/photos required |
| 03 | Agent login / self-management | Password login, agent dashboard, CRUD and feature toggles | Real credentials, account recovery and training |
| 04 | Admin full control | View/manage all listings and inquiries; manage nine accounts | Confirm exact approval/ownership business rules |
| 05 | Agents restricted to own listings | Backend ownership checks on reads, update and delete | Authorization penetration tests before go-live |
| 06 | Import 60 client listings | 60 **fictional** seeded properties and admin CSV import/upsert | Original spreadsheet needed; all 60 real rows must be reconciled |
| 07 | Google Drive photos organised by reference | Reference-linked upload UI and up to 20 photos | Actual Drive folders/files needed; automate mapping and verification |
| 08 | Buy/rent | Full filter and clear transaction tags | Check actual dataset against source |
| 09 | Area | Dubai Marina, JBR, Business Bay | Source spreadsheet mapping |
| 10 | Property type | Apartment, Penthouse, Villa, Townhouse, Studio | Align with client's real taxonomy |
| 11 | Bedrooms | Numeric minimum selector including studios | Source spot-check |
| 12 | Price range | Minimum and maximum AED | Source spot-check; sales/rent unit clarity |
| 13 | Furnishing | Furnished / unfurnished | Source spot-check |
| 14 | Sort price/date | Sort dropdown + deterministic backend ordering | Dataset spot-check |
| 15 | Property details | Gallery, up to 20 images, AED, sqft, beds/baths, amenities | Actual content and image quality approval |
| 16 | Google Maps | Google Maps embed from coordinates; area-based approximate map | Exact location pin approval; maps quota/API if needed |
| 17 | Agent WhatsApp and phone | Agent-specific WA and telephone links | Real contact data, mobile verification |
| 18 | Property inquiry form | Validated visitor form, persisted lead with timestamp and property | Privacy notice and live delivery acceptance |
| 19 | Email to listing's agent | Resend API option, transactional submit and retry | Sender domain, live emails and inbox receipts not provided |
| 20 | Email copy to principal | CC to configured admin notification address | Client-owned address and live proof |
| 21 | All leads visible in admin | Admin inquiries dashboard | Access retention/export sign-off |
| 22 | Agent lead attribution | `property_id` + backend-derived `agent_id` saved; scoped access | Verify with real nine agents |
| 23 | Inquiry export | Admin CSV download; agent only own | Confirm export format with client |
| 24 | Mobile-first / WhatsApp | Mobile breakpoints and touch-friendly controls | Test physical iPhone models in Safari |
| 25 | Huge photo resize / compression | Browser Canvas resize max 1600px before validated upload | Add server-side re-encoding, CDN/image transformations |
| 26 | Property pages under 3s on 4G | Lazy loading, limited per-page cards, optimized upload path | Must benchmark real photo assets on 4G; not yet verified |
| 27 | iOS Safari compatibility | Standards-based CSS and native controls, browser image fallback | Safari iPhone/iPad QA pending |
| 28 | Clean SEO-friendly URLs | `/rent/dubai-marina/slug`, `/buy/jbr/slug` | Redirects, Search Console, structured data validation |
| 29 | Sitemap and SEO metadata | Dynamic sitemap, robots, canonical, OG and per-property title/description | Full SEO crawl and JS-rendering/SSR audit pending |
| 30 | Analytics | First-party aggregated page views without tracking cookies | Optional client GA4 setup with consent requirements |
| 31 | Three area guides | Three **illustrative** guide panels | Replace with client's three supplied texts; not received |
| 32 | 6–8 weeks | Scoped implementation plan | Weekly call and 3-day design approval cushion |
| 33 | Week 2 designs approved | UI styles, homepage/property detail prototypes | Figma sign-off and two-partner approval pending |
| 34 | Week 4 system/search + 10 samples | Working backend/search and 60 seeded sample records | Client sample dataset acceptance |
| 35 | Week 6 all 60 and training | CSV pipeline + training cheat sheet | Actual 60, recorded screen-share and manual QA outstanding |
| 36 | Week 8 launch | Deployment runbook prepared | Live hosting/DNS/inbox/UAT pending |
| 37 | $150/year cap on plugin/licenses | Zero third-party npm runtime packages or licensing fee in demo | Infrastructure/email charges quoted separately |
| 38 | cPanel host | Environment verification steps documented | Host's Node support unknown; recommend managed hosting if absent |
| 39 | No portal syndication | Not implemented, by design | Out of scope |
| 40 | No Arabic version yet | English only | Separately quoted option |
| 41 | No mortgage calculator/blog | Not implemented, by design | Separately quoted options |
| 42 | No photo shoot/content writing | Not included | Client assets/copy required |
| 43 | Final agent entry within 10 min | Single guided property form | Timed real-agent usability test with cheat sheet |
| 44 | Inquiry email within 2 min | Immediate provider call + limited automatic retry when configured | Timed real inbox arrival tests pending |
| 45 | 30/30/25/15 staged payments | Exact breakdown in proposal | Contract/acceptance confirmation |

**Rules:** Never confuse 60 seeded demo properties with the client's 60 real spreadsheet rows. No real emails are sent in default demo mode.

## V1.1 voluntary enhancements

- Authenticated account security: agents and admin can change passwords; password change revokes all other sessions.
- Lead follow-up: private notes and date planner with server-side agent ownership control; notes remain absent from public listing APIs.
- Offline fallback visuals: distinct concept illustrations bundled for all demo sessions without reliable connectivity; not real property images.
