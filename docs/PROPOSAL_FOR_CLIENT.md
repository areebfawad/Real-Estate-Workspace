# Client Proposal — Marina Gate Properties LLC
### FF-002 | Property Listings & Lead Ownership Platform

**Proposed price: USD 2,000** fixed-price, paid by accepted milestones. **Delivery: eight weeks maximum**, provided client content, access and approvals arrive within agreed windows. This fits the client's **USD 1,500–2,200** indicative band and **30 / 30 / 25 / 15** milestones.

## The business problem

Today the brokerage relies on two property portals. That creates subscription costs, limited ownership of inquiries, brand-credibility friction for overseas investors and disputes over which of nine agents receives a lead. An old static website failed because agents could not update inventory. Building another brochure would repeat the same mistake.

**Our solution:** a fast, elegant property catalogue that builds trust from a WhatsApp visit and a private portal where nine agents own and maintain their property portfolios. A visitor's inquiry is attached to one property and its assigned agent, while the owner sees every inquiry and can export the record.

## Scope and deliverables

**Public brand experience:** bespoke luxury visual identity, homepage, search/filter catalogue, 3 areas, detail pages, galleries (max 20), location, amenities, agent card, direct WhatsApp/tap-to-call, lead inquiry, mobile layouts, page metadata, sitemap, analytics setup and formatting of the client's three supplied area guides.

**Operations:** 1 admin role and 9 restricted agent users; listing create/edit/remove/feature; agent-owned photo upload with optimization; admin oversight; lead attribution, notifications to agent plus admin copy; status tracking, CSV export; import/migration of all 60 real properties and reference-linked photos once supplied; cheat sheet and recorded training session.

**Quality:** iPhone/iPad Safari QA, search reconciliation against spreadsheet, image/performance optimization to the under-3-second-on-4G target, email verification (correct agent and admin within two minutes), security and backup checks, SEO/analytics validation, deployment and handover.

**Explicit exclusions:** Arabic, portal feed syndication, mortgage calculator, blog, original photography and writing additional area-guide content. Price separately on request.

## Milestones and acceptance gates

| Timing | Demonstrable deliverable | Acceptance criteria | Payment |
|---|---|---|---:|
| **End W2** | Homepage, listing detail, design system / Figma direction | Design approved by both partners (allow 3 days) | **$600 (30%)** |
| **End W4** | Authentication, agent/admin listing system, search, ten client sample rows | Demonstrate agent ownership + working filters | **$600 (30%)** |
| **End W6** | All 60 real listings, associated photo folders, enquiries, export, training | Spreadsheet reconciliation + agent can add listing in under 10 min | **$500 (25%)** |
| **By W8** | Live site, domain, SEO, email, performance, Safari checks | Live property filter checks; inbox lead in under 2 min; working iPhone; measured 4G performance | **$300 (15%)** |

**Total: $2,000.** This quotation is a competition proposal, not a signed agreement. The user should confirm scope, business/legal responsibilities and payment terms directly with the client.

## Project execution plan

**Week 1:** Client discovery; spreadsheet and image-folder audit; three competitor links reviewed; page map; brand references; data-import schema. Weekly Dubai-morning call.

**Week 2:** Mobile-first high-fidelity homepage and property details; review cycle allowing up to three days for two-partner decisions. Freeze approved UI direction.

**Weeks 3–4:** Build authentication, role isolation, admin/agent CRUD, search, inquiries and 10 sample rows. Demonstrate backend permission checks, not only visual access control.

**Weeks 5–6:** Reconcile client spreadsheet against property IDs, transfer Google Drive photos by ref, record exceptions, verify all 60; train nine agents with a recorded screen-share and one-page guide.

**Weeks 7–8:** Optimizations, Safari iPhone/iPad and 4G profiling, DNS/SSL, SEO, mail/domain setup, admin acceptance test, launch, monitoring and handover.

## Recommendation in plain language

The current prototype uses a small, dependency-free JavaScript server with a local relational database; it proves the workflows immediately. For live operations, the hosting and database architecture must be validated against the owner's cPanel plan, actual traffic, photo volumes and backup policies. Our recommendation is to keep the user experience and business logic, use a production-supported Node environment with secure managed storage if needed, and ensure the team can manage the listings without developer involvement. We **will not promise** the existing cPanel supports Node until we verify it.

**Costs:** $0/year in plugins/licenses for the supplied prototype. Production hosting, domain, email service and possible CDN/object storage are separate operating charges; quote them before approval. The client's **~$150/year cap applies to plugins and licenses**, not necessarily infrastructure.

## Dependencies on client

Spreadsheet containing 60 live listings; Google Drive photo folders labelled by reference; three competitor websites; three area guide texts; approved logo/brand details; nine actual agent names and business contact addresses; principal notification address; DNS/hosting/cPanel access via secure handover; commercial mail sender/domain; acceptance reviewers and published privacy terms.

## Working relationship and change control

- Decisions by email. WhatsApp for short operational questions only.
- One 30-minute meeting per week in a Dubai morning time slot.
- One business-day response expectation on both sides.
- Design approvals have a maximum three-business-day buffer in the schedule.
- Document any additional scope before development; no silent feature creep.

## What makes this proposal different

The demo already proves the hardest workflows: separate agent access, administrator control, agent-attributed inquiries, mobile catalogue, editability and export. The acceptance gates are measurable and are tied to the client's actual pain: faster direct leads, accurate ownership, reliable update workflows and confidence on iPhone.
