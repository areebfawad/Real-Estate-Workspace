# Figma & UI/UX Specification

This file describes a design system that can be reproduced as reusable Figma components. Figma source files have **not** been generated in this deliverable. The functional browser UI is the design reference.

## Brand idea — Quiet Luxury, Modern Dubai

Avoid gold overload, generic dark-neon animations and crowded listing interfaces. The experience should feel like a boutique architecture publication with practical real-estate search.

- **Dark jade:** `#19312E`, used for navigation contrast, premium CTA and adviser interface.
- **Warm white:** `#F9F8F5`, used for breathable backgrounds.
- **Ivory stone:** `#F1F0EB`, secondary panels.
- **Brass:** `#B39A70`, accent on section labels, dividers and premium status.
- **Text charcoal:** `#1C2B2A`, readable headline and body ink.
- **Muted sage:** `#73807B`, secondary metadata.
- **Headings:** editorial Georgia/serif in prototype; substitute a licensed, carefully kerned brand serif if client approves.
- **Body:** clean neutral sans-serif, avoiding heavy display fonts in tables.

## Recommended Figma frames

| Frame | Canvas | Priorities |
|---|---|---|
| Homepage desktop | 1440 px wide | Cinematic photo hero, readable contrast, white overlay search, featured cards |
| Homepage tablet | 768 px wide | Search rows and 2-card grids |
| Homepage iPhone | 390 × 844 px | Viewport-safe header, sticky-safe cards, no horizontal scroll |
| Property catalogue desktop | 1440 px | 260px filter sidebar + 2-card results grid |
| Property catalogue mobile | 390 px | Filters above grid, clear sorting, one-column result cards |
| Property detail desktop | 1440 px | Gallery 2:1 split, details + sticky agent inquiry card |
| Property detail mobile | 390 px | Swipe/tap photos, fully readable specs, inline agent CTA |
| Login desktop | 1440 px | Photo left, restrained authentication card right |
| Agent dashboard desktop | 1440 px | Dark sidebar, metrics, listings/leads |
| Agent dashboard mobile | 390 px | Slide-out sidebar, 2×2 stats, horizontally scrollable tables |
| Listing editor | 1440 / 390 | Four numbered sections, image uploader and a single clear Save CTA |
| Admin team & leads | 1440 / 390 | Attribution, sorting/status, CSV export, agent activation |

## Figma components

**Primitives:** badge, transaction chip, brand lockup, section eyebrow, icon button, CTA buttons, toast, input/select, responsive containers, stat card, modal, confirmation state.

**Business components:** property card, image gallery, agent contact card, inquiry form, search filters, desktop sidebar, portal data table, status pill, photo uploader, agent profile card, CSV import panel.

**States to design:** skeleton/loading, empty results, invalid form field, wrong credentials, forbidden agent operation, successful inquiry, email provider failed, no photos/fallback, agent account disabled, csv validation failure, disabled Save during upload.

## Flow maps

### Visitor inquiry
Home → filters → property detail → review images/specs → contact selected agent → submit inquiry → receive reference → assigned agent sees inquiry → manager sees it in global queue.

### Agent listing maintenance
Login → agent dashboard → My Listings → Add New → title & reference → financial/specs → photos (automatically resized) → amenities/map → preview → Save → appears in search if active.

### Admin operations
Login → overview → view all leads → change lead stage/export → Team → manage agent accounts → Import CSV → audit activity. Account restrictions are enforced on the server.

## Mobile and accessibility details

- Body width remains within 390px in local responsive rendering checks; portal tables scroll inside their panels.
- Tap targets are generally ~40px or larger; form labels are explicit and errors produce visible toast feedback.
- CSS supports `prefers-reduced-motion` and keyboard focus indicators.
- Content is not dependent on hover-only controls, except gallery navigation is also available by tap/focus on mobile.
- Real iPhone Safari and screen-reader validation are **not yet verified**.

## Design sign-off

Give client three curated reference-site analyses once URLs arrive, then two high-fidelity directions based on their preferred traits. Obtain written approval from both partners by end of week two, allowing up to three business days for consolidated decisions. Freeze approved key screens and change budget for further significant redesigns.
