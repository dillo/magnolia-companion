# Staff Contacts Directory — Design

## Purpose

Add a `/contacts` page listing staff contacts (Executive Director, Health &
Wellness Director, Maintenance, Dining Services, etc. — the roles already
referenced throughout the FAQ page). Real contact details aren't available
yet, so this is a scaffold: the data layer, page, and navigation are built
now; content is added later by editing a JSON file.

## Data model

New Zod schema in `lib/schema.ts`, following the existing
`nearbyPlaceSchema` / `nearbyPlacesSchema` pattern:

```ts
export const contactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  cell: z.string().min(1).nullable(),
  main: z.string().min(1).nullable(),
  fax: z.string().min(1).nullable(),
  email: z.string().email().nullable(),
});
export type Contact = z.infer<typeof contactSchema>;

export const contactsSchema = z
  .object({ contacts: z.array(contactSchema) })
  .superRefine((directory, ctx) => {
    const seen = new Set<string>();
    for (const contact of directory.contacts) {
      if (seen.has(contact.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate contact ${contact.id}` });
      }
      seen.add(contact.id);
    }
  });
export type ContactsDirectory = z.infer<typeof contactsSchema>;
```

## Content file

`content/contacts.json`:

```json
{ "contacts": [] }
```

## Loader

`lib/content.ts` — add `loadContacts()` mirroring `loadNearbyPlaces()`:
returns `{ contacts: [] }` if the file is missing, throws a descriptive
error (file path + Zod message) if present but invalid, otherwise returns
the parsed directory.

## Page

`app/contacts/page.tsx` — server component (no client-side state needed
yet; nothing to filter or search with zero/few entries). Structure follows
`app/disclaimer/page.tsx`:

- `Breadcrumbs`
- Eyebrow / `<h1>` "Staff Directory" + short subhead
- If `contacts.length === 0`: render `EmptyState` with a message like
  "Staff directory is coming soon."
- Otherwise: render a responsive card for each contact — name, role, labeled
  cell/main/fax numbers, and email when present.

`export const metadata` follows the pattern in other pages (title +
description).

## Navigation

Added in the same three places FAQ/Disclaimer are, so the scaffold is
reachable even with no data:

- `components/BottomNav.tsx` — add `{ href: "/contacts", label: "Directory" }`
  to the `MORE` array.
- `components/SiteHeader.tsx` — add `{ href: "/contacts", label: "Directory" }`
  to the `NAV` array.
- `components/Breadcrumbs.tsx` — add `/contacts: "Directory"` to
  `ROUTE_LABELS` and a width entry (`max-w-3xl`, matching Disclaimer) to
  `ROUTE_WIDTHS`.

## Explicitly out of scope

- Search/filter UI — nothing to filter with an empty or small dataset;
  revisit once real data exists (`FaqClient` is the precedent if needed).
- Resident directories, family/emergency contacts, or third-party provider
  contacts — this scaffold covers staff contacts only, per user decision.

## Testing

- Existing content-loading tests (if any cover `lib/content.ts`) get a
  companion case for `loadContacts()` — empty-file fallback and a valid
  sample parse.
- Manual check: page renders the empty state with no `content/contacts.json`
  entries, and renders contact cards once sample data is added locally.
