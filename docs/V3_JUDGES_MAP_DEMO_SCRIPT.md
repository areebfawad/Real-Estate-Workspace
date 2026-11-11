# Marina Gate · Judges' 7-minute live demo (V3)

1. **00:00–00:50 — Homepage.** Start at `/`, show hero, search, curated listings. Scroll to the large embedded property map. Explain this is not a static marketing site: listings come from an editable agency database.
2. **00:50–01:40 — Explore the map.** Use the header link to `/map`. Show 60 clickable pins, zoom/pan and filtering between for-sale, rentals, apartments, houses, plots. Tap a pin and open its detail, then click **View full listing**. All locations are illustrative.
3. **01:40–02:30 — Full property page.** Explain gallery, amenities, area, indicative Google Maps view, assigned adviser, WhatsApp/call and private-viewing form. Click **Locate this property on the interactive map** to demonstrate deep linking to `/map?ref=…`.
4. **02:30–03:20 — Live inquiry.** Return to the property page or map and submit a demo name, email and phone. The inquiry is saved by the backend and linked to the specific listing and agent; live outgoing email is in demo mode unless credentials are verified.
5. **03:20–04:25 — Administrator.** Open `/login` with the administrator credential from `data/demo-credentials.txt`. Demonstrate global listing count, lead tracker, CSV export, team of nine agents, import tab and audit log. Find the newly created lead.
6. **04:25–05:50 — Agent.** Log out and use one agent account. Show own-only property list, create/edit/feature/soft-remove workflow. Revisit map to show the listing lifecycle. Try another agent's API route if asked — server returns forbidden.
7. **05:50–07:00 — Clear proposal.** Client PDF FF-002 defines 8 weeks and 30/30/25/15 payments. State which demo features work today and which are genuine delivery stages: original 60 records/photos, real email delivery, training, iPhone and 4G acceptance.

**Prohibited demonstration claims:** Do not call map pins actual plot locations, production mail delivered, 60 imported real client records, or Safari/4G acceptance completed.

**Contingency:** If external Unsplash imagery is unavailable, local architectural SVG fallbacks keep the gallery/layout working. If internet is unavailable, the locally hosted SVG map and agent workflows continue to work. Start the server before opening the browser.
