# U.S. AutoForce — Navigator Hub

A companion to **Driver Hub**, built for the Driver Trainer / Navigator who works
with HR: it keeps every benefit program's **actual dollar values** straight, per
location, and produces the one-page driver sheet from those values.

> **Status:** working prototype. Values in the [demo](https://joshwheeler8206-cell.github.io/navigator-hub/demo/)
> are samples — real figures come from HR.

## What it does

| Tab | Purpose |
| --- | --- |
| **Home** | Completeness at a glance + a "needs attention" inbox (locations missing values, drafts, unanswered HR questions) |
| **Locations** | One card per terminal: drivers covered, benefit year, carriers, union, and the four people drivers call |
| **Benefits** | The seven programs with amount & unit, eligibility, how to claim, effective date and who confirmed it — filterable, copyable between locations |
| **Rides** | Ride-along log: what was briefed, which programs were covered, and questions that need HR to answer |
| **Sheet** | Branded one-page summary per location; prints straight to PDF with a **PENDING** banner while values are missing |
| **Huddle** | The weekly Safety Huddle Generator, embedded — current ISO week's topic, prints straight to PDF. Use the controls inside the page for other weeks, the zoom and the 3D deck |

### The seven programs

1. Uniforms & dress code — shirt sets + sweatshirts after the waiting period
2. Safety shoe reimbursement
3. Wellness equipment — running shoes, gym, fitness watch
4. Walking / step-goal program — monthly reward
5. RAVE recognition — points redeemable for store credit / gift cards
6. Driver of the Month — parking spot, RAVE points, lunch
7. Annual health screen — insurance premium discount

## Details that matter

- **No fake numbers.** A program counts as complete only when amount, eligibility
  and how-to-claim are all filled in; each value carries a status of
  **TBD → Needs review → Confirmed**, plus who confirmed it and when.
- **Nothing prints dirty.** The location sheet prints blank lines and a red
  PENDING banner for anything not confirmed, so an incomplete sheet can never be
  mistaken for the final answer.
- **Copy between locations.** Most programs are identical across terminals —
  copy them in one action, then review and confirm.
- **Month / day / year dropdowns** instead of the native date picker (same fix the
  rest of the suite uses — arbitrary years are painful on phones).
- **Offline-first PWA**, data stays in IndexedDB on the device, JSON backup with
  merge = sync (adds + updates, never deletes).
- Audit IDs (`LOC-…`, `NAV-…`, `RIDE-…`) and created/updated timestamps on every
  record, matching the controlled-document work in Driver Hub.
- Dark mode follows the system, can be toggled in the header.
- **Safety huddle** is the same self-contained generator used on the desktop
  (`safety-huddle.html`, built from `~/scripts/safety_huddle_build_html.py` and
  served from this app so it works offline). It always opens on the current ISO
  week; the hub passes `?week=<n>`. To refresh it, re-run the builder and copy
  the output over `navigator-hub/safety-huddle.html`.

## Install

**Android:** open the site in Chrome → menu → *Install app* (or *Add to Home screen*).
An APK can be built later with the same pipeline as the other six apps.

**iPhone / iPad:** open in Safari → Share → *Add to Home Screen*.

**Demo (no data needed):** https://joshwheeler8206-cell.github.io/navigator-hub/demo/

## Run locally

```bash
cd navigator-hub
python3 -m http.server 8911
# http://127.0.0.1:8911/
```

## Rebuild the demo

```bash
python3 ~/scripts/make_nav_demo.py
```

Demo seed lives at `~/scripts/navdemo/seed.js` (three Iowa-area locations with a
mix of confirmed, review and TBD values).

## Data model (for the Driver Hub merge)

```js
// IndexedDB usaf_navigator_db / usaf_navigator_v1
{
  locations: [{ id, name, city, state, driverCount, benefitYear, planStart,
                carriers, union, published, contacts: { trainer, dispatch,
                dispatcher, hr }, auditId, createdAt, updatedAt }],
  values: { "<locId>:<programId>": { amount, eligibility, claim, effective,
            confirmedBy, confirmedAt, status, auditId, updatedAt } },
  rides: [{ id, locId, date, drivers, covered: [programId], notes,
            questions: [{ id, text, answered }], auditId }],
  questions: [{ id, locId, rideId, text, answered, createdAt }],
  settings: { selectedLocation }
}
```

Programs are a fixed list in `app.js` (`PROGRAMS`), so the same IDs work in both
apps. The eventual merge adds a **Benefits** tab to Driver Hub that reads these
stores; nothing here blocks that.
