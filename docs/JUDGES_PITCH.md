# Judges' Pitch & Negotiation Notes

## 90-second pitch (natural, client-facing English)

> Marina Gate Properties isn't simply buying a website. It's trying to take control of its brand, its listings and — most importantly — its leads.
>
> Today, nine agents work through expensive third-party property portals. Leads arrive in a shared system, and the agency cannot always establish ownership. A static site failed once before because agents couldn't update their listings.
>
> We've approached this as an operational platform, not a brochure. On the public side, clients get a premium mobile-first browsing experience with proper property filters, beautiful listing pages, maps and direct agent contact. Behind the scenes, each of the nine agents signs in to manage only their own portfolio. When a buyer makes an inquiry, we attach it to that listing and its assigned agent. The manager can see every lead and export a complete record.
>
> The working prototype you see today demonstrates these workflows with 60 clearly labelled sample properties — not fabricated client data. We have an eight-week delivery plan that includes migrating the actual 60 listings, training agents, checking Safari and measuring performance on 4G.
>
> Our proposed fixed price is $2,000, split precisely across your four milestones. This is designed to become a real operating system for the agency, with zero recurring plugin license fees in the proposed custom approach.

## Demonstration sequence

1. **Open homepage:** explain premium experience aimed at AED 2M investors and WhatsApp traffic.
2. **Search:** filter for rent → JBR → 2+ beds → furnished; sort by price.
3. **Property detail:** show price, sqft, beds/baths, amenities, map, assigned agent, WhatsApp/call and the inquiry form.
4. **Submit inquiry:** show the inquiry reference. Explicitly state demo email is not sent; production sends via verified domain.
5. **Admin portal:** sign in with the locally generated admin password; show all listings, all leads, CSV export and nine agent accounts.
6. **Agent portal:** sign out, sign in as agent #1; show only their listings, create/edit/feature, explain ownership is checked by the server.
7. **Finish with timeline:** show $600 / $600 / $500 / $300 milestone structure and final checks.

## Questions judges or client may ask

**“Why not just WordPress?”** WordPress is viable, but agent-specific permissions, lead attribution and complex listing management often depend on multiple plugins and upkeep. For this brief, a small purpose-built workflow keeps the business logic under direct control and eliminates plugin licensing. We would still assess cPanel compatibility and maintenance before final selection.

**“Where are the real 60 listings?”** The client hasn't supplied the actual spreadsheet or Google Drive photo folders yet. The demo uses 60 fictional properties to prove filtering and permissions. The contract includes migration, row reconciliation and photo-folder matching once access is granted.

**“Will email go to the correct agent?”** The server reads the agent directly from the property record; it does not accept an agent ID from the visitor's form. With the email provider configured, the notification is sent to that agent and copied to the principal. We test actual inbox arrival before launch. Demo notification statuses are transparently labelled.

**“Can agents see another agent's listings?”** No, not through the portal API. Authorization checks the logged-in agent against each listing's `agent_id` at the database boundary. Automated tests include a denied cross-agent delete attempt.

**“Can this handle 20 phone photos?”** The upload screen supports up to 20 images, resizes and compresses in-browser and validates content on the backend. A production server-side image pipeline and real-world 4G benchmarks are explicit pre-launch work.

**“What if the client wants Arabic, blog or mortgage calculator?”** Those were excluded in the brief and should be separately scoped and priced.

**“Can you guarantee 3 seconds and a 2-minute email?”** We will contract those as acceptance targets and verify on agreed test hardware, network and inboxes. We don't claim them as already measured.

## Positioning

The differentiator is not a flashy animation. It is a polished client journey connected to a secure property-and-lead operating workflow. The client asked for the **clearest plan**, not the cheapest quote. Lead attribution, self-service, imported data and measurable handover are the message.
