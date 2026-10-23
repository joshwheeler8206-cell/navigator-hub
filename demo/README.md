# U.S. AutoForce — Navigator Hub

**The first 90 days of a new driver, in one place.** A phone-sized app with two
views — what the **new hire** sees, and what the **Navigator** sees — built from
the real HR document set.

- **Live app:** https://joshwheeler8206-cell.github.io/navigator-hub/
- **Demo (seeded):** https://joshwheeler8206-cell.github.io/navigator-hub/demo/
- **Hand this to HR:** the app's **Print → HR summary (3 pages)** sheet

> **On the numbers:** every published figure is transcribed from the document
> named on the card. Three benefits have no published number anywhere in the
> document set — the app says so, in front of the driver, instead of guessing.

---

## Two views, one record

Flip the switch at the top of the app.

| **New hire view** | **Navigator view** |
| --- | --- |
| Day X of 90, with the next steps named | Benefit values confirmed per location, with who confirmed them and when |
| Every benefit with the real number and how to claim it | A **Needs attention** list of what is missing or unpublished |
| The seven policies that matter, in plain English | Ride-along log: programs briefed, notes, questions raised |
| One-tap call buttons for Navigator, dispatch, HR | Open HR questions, tracked until answered |
| A checklist they tick themselves, dated | Six print sheets, including a full packet |

## The tabs

| Tab | What it does |
| --- | --- |
| **Home** | Day X of 90, the four money tiles, next three steps, who to call |
| **90 days** | The full program: 8 phases / 29 steps, each with *why it matters*, tickable and dated |
| **Good stuff** | 15 benefits — the number, who is eligible, how to claim, and the source document |
| **Rules** | 7 policy cards: dress code, driver policy, recognition, time off, paycheck, Speak Up, ideas |
| **Rides** | Ride-along log plus the open HR question list |
| **Print** | Sheet picker → prints clean letter pages straight from the phone |

## The money nobody hears in week one

| Benefit | What you get | Source |
| --- | --- | --- |
| Finding a Better Way | **$20,000 / $10,000 / $5,000** for the best ideas | Finding-a-Better-Way FAQs |
| Wellness reimbursement | **$250/yr** — gym, classes, race fees, home equipment, wearables | Wellness Reimbursement |
| Safety shoes | **100% up to $150** every 12 months, ASTM F2413-18 | Dress Code Policy · p.2 |
| Uniforms | **50% reimbursed** on Company Store orders | Dress Code Policy · p.2 |
| Vacation | 80 h / 120 h / 160 h by service; 40 h carry-over cap | Vacation-Personal Day Policy |
| Personal days | 4 days / 32 h at 5–10 years | Vacation-Personal Day Policy |
| Volunteer time | 8 hours per calendar year | Understanding Your USV Paycheck |
| RAVE recognition | Points redeemable for merchandise or gift cards | Driver Benefits · Paycheck |
| Walkingspree | Cash every month you hit the goal | *needs HR — amount and step target* |
| Annual health screen | Medical premium discount | *needs HR — amount and window* |
| Driver of the Month | Parking spot + RAVE points + team lunch | *needs HR — point and lunch value* |

Plus sick time, holidays, MOTUS mileage, and employer-paid medical / dental / life /
401(k) — 15 programs in all.

## The 90-day program

| Phase | When | Steps |
| --- | --- | --- |
| 01 Day one | First shift | 4 |
| 02 Day two | Workday & accounts | 3 |
| 03 Week one | Safety & the rules | 5 |
| 04 Weeks 2–4 | Behind the wheel | 5 |
| 05 Day 30 | Now you can spend it | 3 |
| 06 Day 45–60 | On your own, with backup | 4 |
| 07 Day 75 | The honest conversation | 2 |
| 08 Day 90 | Sign it off | 3 |

## Print sheets (letter, one tap)

1. **The good stuff** — every benefit on one page
2. **90-day checklist** — dated ticks + signature block
3. **Policy essentials** — the rules, one page
4. **Location sheet** — confirmed values for one terminal (with a **PENDING** banner until it is complete)
5. **Full packet** — all of the above, in order
6. **Safety huddle** — this week's topic
7. **HR summary** — the 3-page handout for HR leadership

## How it runs

- One HTML app. Installs to a phone home screen (PWA) or ships as a signed APK; works on iPhone through Safari.
- **Offline after first load.** No login, no server, no telemetry.
- Records live on the device in IndexedDB; JSON backup/restore moves them.
- No protected health information — the wellness page describes the program, it never stores a claim.
- Every record carries an ID, a timestamp and who confirmed it.

## Repo layout

```
index.html      app shell (role switch, 6 tabs)
app.js          data + views + print sheets
styles.css      app + print stylesheet
sw.js           offline cache
safety-huddle.html   the weekly safety huddle generator (embedded)
demo/           seeded build for GitHub Pages (fake local data via idbshim)
icons/          app icons + the brand logo used on printed sheets
```

---

Built by a Driver Navigator, for the Driver Navigator.
