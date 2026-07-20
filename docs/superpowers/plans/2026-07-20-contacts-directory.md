# Staff Contacts Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a `/contacts` staff directory page — data schema, empty content file, loader, page, and navigation — so real contacts can be dropped in later by editing one JSON file.

**Architecture:** Follows this codebase's existing content-driven page pattern (see `nearby-places.json` → `nearbyPlacesSchema` → `loadNearbyPlaces()` → `app/explore/page.tsx`): a Zod schema validates a committed JSON file, a loader in `lib/content.ts` parses it at request time, and a server component page renders it (or an `EmptyState` when there's nothing yet). No client-side interactivity is added — nothing to filter with an empty/small dataset.

**Tech Stack:** Next.js (app router, server components), Zod, Vitest (unit), Playwright (e2e). No new dependencies.

## Global Constraints

- Route is `/contacts`; nav label is exactly "Directory" (spec: Navigation section).
- `department` is a free-text `z.string()` field, not an enum — the real department set isn't known yet (spec: Data model).
- No client component / search UI for this page (spec: Explicitly out of scope).
- Page content width and card styling follow `app/disclaimer/page.tsx`: outer wrapper `mx-auto max-w-3xl`, section cards `rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm`.
- `content/contacts.json` ships with `{ "contacts": [] }` — no fake/sample data (spec: Purpose; user decided against placeholder entries).

---

### Task 1: Contact schema and empty content fixture

**Files:**
- Modify: `lib/schema.ts` (append after `nearbyPlacesSchema`, end of file)
- Create: `content/contacts.json`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Produces: `contactSchema` (Zod schema), `Contact` (type), `contactsSchema` (Zod schema, shape `{ contacts: Contact[] }`), `ContactsDirectory` (type) — all exported from `lib/schema.ts`. Task 2 imports `contactsSchema` and `ContactsDirectory` from here.

- [ ] **Step 1: Write the failing schema tests**

Append to `tests/schema.test.ts` (after the existing `nearbyPlacesSchema` describe block, same file already imports `fs`/`path`/`readJSON`):

```ts
import { contactsSchema } from "@/lib/schema";
```

Add this import to the existing top-of-file import from `@/lib/schema` instead of a new line — change:

```ts
import { activityMonthSchema, menuWeekSchema, nearbyPlacesSchema, visitDaysSchema } from "@/lib/schema";
```

to:

```ts
import { activityMonthSchema, contactsSchema, menuWeekSchema, nearbyPlacesSchema, visitDaysSchema } from "@/lib/schema";
```

Then append at the end of the file:

```ts
describe("contactsSchema", () => {
  test("accepts the committed empty contacts fixture", () => {
    const parsed = contactsSchema.parse(readJSON("content/contacts.json"));
    expect(parsed.contacts).toEqual([]);
  });
  test("accepts a fully populated contact", () => {
    const parsed = contactsSchema.parse({
      contacts: [
        {
          id: "jane-smith",
          name: "Jane Smith",
          role: "Executive Director",
          department: "Administration",
          phone: "(770) 555-0100",
          email: "jane.smith@example.com",
        },
      ],
    });
    expect(parsed.contacts[0].name).toBe("Jane Smith");
  });
  test("rejects duplicate contact ids", () => {
    const contact = {
      id: "same",
      name: "Jane Smith",
      role: "Executive Director",
      department: "Administration",
      phone: null,
      email: null,
    };
    expect(() => contactsSchema.parse({ contacts: [contact, contact] })).toThrow(/duplicate contact/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/schema.test.ts`
Expected: FAIL — `contactsSchema` is not exported from `@/lib/schema` (module has no export named 'contactsSchema'), and `content/contacts.json` does not exist.

- [ ] **Step 3: Add the schema to `lib/schema.ts`**

Append to the end of `lib/schema.ts`:

```ts
export const contactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(1).nullable(),
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

- [ ] **Step 4: Create the empty content fixture**

Create `content/contacts.json`:

```json
{
  "contacts": []
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/schema.test.ts`
Expected: PASS — all `contactsSchema` tests green, no other test files affected.

- [ ] **Step 6: Commit**

```bash
git add lib/schema.ts content/contacts.json tests/schema.test.ts
git commit -m "feat: add contact schema and empty contacts fixture"
```

---

### Task 2: Content loader

**Files:**
- Modify: `lib/content.ts`
- Test: `tests/lookup.test.ts`

**Interfaces:**
- Consumes: `contactsSchema`, `ContactsDirectory` from `lib/schema.ts` (Task 1).
- Produces: `loadContacts(): ContactsDirectory` exported from `lib/content.ts`. Task 3's page imports this.

- [ ] **Step 1: Write the failing loader test**

In `tests/lookup.test.ts`, change the import line:

```ts
import { loadActivityMonths, loadMenuWeeks, loadVisitDays } from "@/lib/content";
```

to:

```ts
import { loadActivityMonths, loadContacts, loadMenuWeeks, loadVisitDays } from "@/lib/content";
```

Then add, near the top-level `const visitDays = loadVisitDays();` line, a new constant:

```ts
const contacts = loadContacts();
```

And add a test inside the existing `describe("loaders", ...)` block (alongside `"loads and validates committed fixtures"`):

```ts
  test("loadContacts returns the committed (currently empty) directory", () => {
    expect(contacts.contacts).toEqual([]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lookup.test.ts`
Expected: FAIL — `loadContacts` is not exported from `@/lib/content`.

- [ ] **Step 3: Add the loader**

Append to `lib/content.ts` (it already imports `contactsSchema`-adjacent siblings; extend the top import and add the function):

Change:

```ts
import {
  activityMonthSchema, menuWeekSchema, nearbyPlacesSchema, visitDaysSchema,
  type ActivityMonth, type MenuWeek, type NearbyPlacesDirectory, type VisitDay,
} from "./schema";
```

to:

```ts
import {
  activityMonthSchema, contactsSchema, menuWeekSchema, nearbyPlacesSchema, visitDaysSchema,
  type ActivityMonth, type ContactsDirectory, type MenuWeek, type NearbyPlacesDirectory, type VisitDay,
} from "./schema";
```

Then append at the end of `lib/content.ts`:

```ts
export function loadContacts(): ContactsDirectory {
  const file = path.join(CONTENT_DIR, "contacts.json");
  if (!fs.existsSync(file)) return { contacts: [] };
  try {
    return contactsSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (err) {
    throw new Error(`content/contacts.json: ${err instanceof Error ? err.message : err}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lookup.test.ts`
Expected: PASS — new `loadContacts` test green, existing loader/lookup tests unaffected.

- [ ] **Step 5: Run the full unit suite**

Run: `npm test`
Expected: PASS — all test files green (this catches any accidental break in `lib/schema.ts` or `lib/content.ts` from Task 1/2 edits).

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts tests/lookup.test.ts
git commit -m "feat: add loadContacts loader"
```

---

### Task 3: Contacts page and navigation

**Files:**
- Create: `app/contacts/page.tsx`
- Modify: `components/BottomNav.tsx`
- Modify: `components/SiteHeader.tsx`
- Modify: `components/Breadcrumbs.tsx`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `loadContacts()` from `lib/content.ts` (Task 2), `Contact` type from `lib/schema.ts` (Task 1), `EmptyState` from `components/EmptyState.tsx`, `Breadcrumbs` from `components/Breadcrumbs.tsx`.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts` (after the `"disclaimer: identifies the app as independent and unofficial"` test):

```ts
test("contacts: staff directory shows the coming-soon empty state", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Directory" }).click();

  await expect(page).toHaveTitle("Staff Directory | Magnolia Companion");
  await expect(page.getByRole("heading", { name: "Staff Directory" })).toBeVisible();
  await expect(page.getByText("Staff directory is coming soon.")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/smoke.spec.ts -g "contacts"`
Expected: FAIL — no "Directory" link in the header nav, `/contacts` returns 404.

- [ ] **Step 3: Add navigation entries**

In `components/BottomNav.tsx`, change the `MORE` array:

```ts
const MORE = [
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/disclaimer", label: "About & Disclaimer" },
];
```

to:

```ts
const MORE = [
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Directory" },
  { href: "/disclaimer", label: "About & Disclaimer" },
];
```

In `components/SiteHeader.tsx`, change the `NAV` array:

```ts
const NAV = [
  { href: "/", label: "Activities" },
  { href: "/menu", label: "Meals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/explore", label: "Explore" },
  { href: "/visits", label: "Holidays" },
  { href: "/faq", label: "FAQ" },
];
```

to:

```ts
const NAV = [
  { href: "/", label: "Activities" },
  { href: "/menu", label: "Meals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/explore", label: "Explore" },
  { href: "/visits", label: "Holidays" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Directory" },
];
```

In `components/Breadcrumbs.tsx`, change `ROUTE_LABELS`:

```ts
const ROUTE_LABELS: Record<string, string> = {
  "/": "Activities",
  "/menu": "Meals",
  "/calendar": "Calendar",
  "/explore": "Explore",
  "/visits": "Holidays",
  "/faq": "FAQ",
  "/disclaimer": "Disclaimer",
};
```

to:

```ts
const ROUTE_LABELS: Record<string, string> = {
  "/": "Activities",
  "/menu": "Meals",
  "/calendar": "Calendar",
  "/explore": "Explore",
  "/visits": "Holidays",
  "/faq": "FAQ",
  "/contacts": "Directory",
  "/disclaimer": "Disclaimer",
};
```

and `ROUTE_WIDTHS`:

```ts
const ROUTE_WIDTHS: Record<string, string> = {
  "/": "max-w-5xl",
  "/menu": "max-w-5xl",
  "/calendar": "max-w-6xl",
  "/explore": "max-w-6xl",
  "/visits": "max-w-4xl",
  "/faq": "max-w-5xl",
  "/disclaimer": "max-w-3xl",
};
```

to:

```ts
const ROUTE_WIDTHS: Record<string, string> = {
  "/": "max-w-5xl",
  "/menu": "max-w-5xl",
  "/calendar": "max-w-6xl",
  "/explore": "max-w-6xl",
  "/visits": "max-w-4xl",
  "/faq": "max-w-5xl",
  "/contacts": "max-w-3xl",
  "/disclaimer": "max-w-3xl",
};
```

- [ ] **Step 4: Create the page**

Create `app/contacts/page.tsx`:

```tsx
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { loadContacts } from "@/lib/content";
import type { Contact } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Staff Directory | Magnolia Companion",
  description: "Staff contacts for Magnolia Place of Roswell.",
};

type ContactGroup = { department: string; contacts: Contact[] };

function groupByDepartment(contacts: Contact[]): ContactGroup[] {
  const groups: ContactGroup[] = [];
  const indexByDepartment = new Map<string, number>();
  for (const contact of contacts) {
    const existingIndex = indexByDepartment.get(contact.department);
    if (existingIndex === undefined) {
      indexByDepartment.set(contact.department, groups.length);
      groups.push({ department: contact.department, contacts: [contact] });
    } else {
      groups[existingIndex].contacts.push(contact);
    }
  }
  return groups;
}

export default function ContactsPage() {
  const { contacts } = loadContacts();
  const groups = groupByDepartment(contacts);

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs />
      <div className="max-w-2xl">
        <p className="font-semibold uppercase tracking-wide text-copper">Get in touch</p>
        <h1 className="mt-1 font-display text-title font-semibold">Staff Directory</h1>
        <p className="mt-3 text-moss">
          Contacts for Magnolia Place of Roswell staff, by department.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState message="Staff directory is coming soon." />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map((group) => (
            <section
              key={group.department}
              className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm"
            >
              <h2 className="font-display text-2xl font-semibold">{group.department}</h2>
              <ul className="mt-3 space-y-4">
                {group.contacts.map((contact) => (
                  <li key={contact.id}>
                    <p className="font-semibold text-ink">{contact.name}</p>
                    <p className="text-moss">{contact.role}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-copper underline-offset-4 hover:underline"
                        >
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-copper underline-offset-4 hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test e2e/smoke.spec.ts -g "contacts"`
Expected: PASS.

- [ ] **Step 6: Run the full e2e suite to check for nav regressions**

Run: `npx playwright test e2e/smoke.spec.ts`
Expected: PASS — in particular, `"nav: current page is marked active"` and `"mobile: footer clears the fixed navigation without excess space"` still pass since the `NAV`/`MORE` arrays only gained an entry, not a reorder of existing ones.

- [ ] **Step 7: Run the full unit suite once more**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/contacts/page.tsx components/BottomNav.tsx components/SiteHeader.tsx components/Breadcrumbs.tsx e2e/smoke.spec.ts
git commit -m "feat: add staff directory page and wire up navigation"
```

---

## Self-Review Notes

- **Spec coverage:** Data model → Task 1. Content file → Task 1. Loader → Task 2. Page (empty state + grouped rendering) → Task 3. Navigation (BottomNav, SiteHeader, Breadcrumbs) → Task 3. Testing section (loader tests, manual/e2e empty-state check) → Tasks 1–3. All spec sections covered.
- **Placeholder scan:** No TBD/TODO; every step has literal code and exact commands.
- **Type consistency:** `Contact` / `ContactsDirectory` types from Task 1 are the exact names imported in Tasks 2 and 3; `loadContacts()` signature (`(): ContactsDirectory`) matches its Task 3 call site (`const { contacts } = loadContacts();`).
