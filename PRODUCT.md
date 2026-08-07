# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are one resident of Magnolia Place of Roswell and the resident's family members. They use the companion primarily on phones and tablets, with laptops as a secondary context, to answer practical daily questions without searching through paper handouts: what is happening now or next, what meals are being served, which medications are scheduled, who to contact, what the resident handbook says, which holidays are approaching, and what nearby outings may be suitable.

Facility staff are not product users. They remain the authoritative source for official, urgent, medical, or time-sensitive information. A family maintainer publishes and corrects content from a Mac through the repository workflow.

## Product Purpose

Magnolia Companion turns scattered facility handouts and personal reference material into one time-aware, senior-readable daily companion. Success means the resident or a family member can quickly find and act on routine information with confidence, while retaining clear paths to the original scan or the appropriate staff contact when verification matters.

## Positioning

This is a personal companion for one resident and family, not a general facility portal. Its distinctive mechanism combines facility handouts, resident-specific routines, handbook guidance, public contacts, and nearby-place research in a single accessible interface. Printed activities and menus are transcribed into structured data, validated, reviewed against their source scans, and presented in the context of the current day and time.

## Operating Context

- Residents and family members consult the site throughout the day on mixed devices, often for an immediate answer rather than an extended browsing session.
- The source material includes printed monthly activity calendars, weekly menus, the Pegasus Senior Living Resident Handbook, public contact information, medication routines, holiday data, and researched nearby places.
- Publishing is a local, human-reviewed workflow: acquire source material, ingest or edit repository JSON, compare the local site with the source, commit, and push. Vercel then rebuilds the static site.
- Dates and time-aware features use America/New_York.
- Important or changeable information is confirmed with Magnolia Place staff; the site is not an official communication channel.

## Capabilities and Constraints

- Daily and weekly activities, including current/up-next context, calendar browsing, wellness dimensions, and source-scan viewing.
- Daily and weekly meal information, serving-time context, and original menu scans.
- Morning and evening medication routines, refill reminders, and a complete medication reference.
- A directory of publicly available Magnolia, emergency, doctor, and pharmacy contacts.
- Searchable resident-handbook answers, upcoming holidays, and nearby places grouped by trip time and senior-friendly considerations.
- Static Next.js site with repository JSON as the data store; there are no accounts, database, in-browser administration, or production API calls.
- Anyone with the link may view the site. This is intentional because the resident's name and other identifying information are never published, and all directory contacts are already public.
- Resident birthdays from printed calendars are excluded. Future content must preserve the same no-resident-PII rule.
- Medication information is reference-only. The product must not present medical advice, care instructions, emergency guidance, or official notices as its own authority.
- Extracted content is schema-validated and human-reviewed. Missing content must produce a clear unavailable state rather than an invented answer.
- The product serves a single resident at a single facility. Accounts, multi-tenancy, and multi-facility support are out of scope.

## Brand Commitments

- The product name is Magnolia Companion.
- It is independently developed, unofficial, and not operated by, affiliated with, endorsed by, or sponsored by Magnolia Place of Roswell, Pegasus Senior Living, or their affiliates.
- The facility and operator names are used only to identify the community served.
- Product language is dignified, plain, reassuring, and senior-respectful; it must never feel childish or falsely authoritative.
- The existing magnolia name and logo assets are established identifiers within the product. They must not imply official facility branding or endorsement.

## Evidence on Hand

- Approved product and feature specifications live in `docs/superpowers/specs/`.
- Activity and menu records live in `content/activities/` and `content/menus/`; available source photographs live in `public/scans/`.
- Current structured references include `content/medications.json`, `content/contacts.json`, `content/holidays.json`, and `content/nearby-places.json`.
- Resident-handbook source material lives in `magnolia-handbook-faq.md`, with product-ready FAQ content in `lib/faqs.ts`.
- The application itself demonstrates its workflows across home, menu, medications, directory, calendar, explore, holidays, FAQ, and disclaimer routes.
- No testimonials, customer logos, press, benchmarks, or performance claims are on hand. Future work must not fabricate them.

## Product Principles

1. Answer the immediate daily question first.
2. Make important information readable and operable for the resident without sacrificing dignity.
3. Earn trust through source traceability, validation, candid limitations, and clear routes to human confirmation.
4. Preserve privacy by excluding resident identity and other resident PII, even though the site is accessible by link.
5. Prefer a simple, human-reviewed publishing system over infrastructure the product does not need.

## Accessibility & Inclusion

- Maintain at least WCAG AA contrast, a 17px default text floor, large touch targets, clear focus states, and responsive behavior across phone, tablet, and desktop.
- Preserve user controls for larger text, extra-large text, high contrast, and reduced motion.
- Respect the system `prefers-reduced-motion` setting in addition to the product's own reduced-motion control.
- Favor plain language, predictable navigation, visible status, and error states that do not require technical knowledge.
