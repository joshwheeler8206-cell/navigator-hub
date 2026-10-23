'use strict';

/* ================================================================
   U.S. AutoForce — Navigator Hub
   Two views on one app:
     · NEW HIRE  — your first 90 days, the real benefits in plain
                   English, the policies you actually have to know.
     · NAVIGATOR — locations, confirmed values, ride-alongs, HR
                   follow-ups, and every print sheet.
   Content is transcribed from the HR documents supplied for the
   Navigator Program (see SOURCES). Nothing here is invented: if a
   number is not published yet it says "confirm with HR".
   ================================================================ */

/* ------------------------------ helpers ------------------------------ */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'style') node.style.cssText = v;
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

function toast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function nowISO() { return new Date().toISOString(); }
function daysBetween(aISO, bISO) {
  const a = new Date(String(aISO) + 'T00:00:00');
  const b = new Date(String(bISO) + 'T00:00:00');
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}
function addDays(iso, n) {
  const d = new Date(String(iso) + 'T00:00:00');
  if (isNaN(d)) return '';
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  if (!iso) return '';
  const p = String(iso).slice(0, 10).split('-');
  if (p.length !== 3) return iso;
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  if (isNaN(d)) return iso;
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function initialsOf(name) {
  return String(name || '')
    .trim().split(/\s+/).slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase()).join('') || 'NH';
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* date dropdowns (month / day / year) — the pattern used across the suite */
function dateSelects(value, onChange) {
  const parts = String(value || '').split('-');
  const y = parts[0] || '', m = parts[1] || '', d = parts[2] || '';
  const wrap = el('div', { class: 'dt-row' });
  const selM = el('select', { 'aria-label': 'Month' }, [el('option', { value: '' }, ['Month'])]);
  MONTHS.forEach((lbl, i) => selM.appendChild(el('option', { value: String(i + 1).padStart(2, '0') }, [lbl])));
  const selD = el('select', { 'aria-label': 'Day' }, [el('option', { value: '' }, ['Day'])]);
  for (let i = 1; i <= 31; i++) selD.appendChild(el('option', { value: String(i).padStart(2, '0') }, [String(i)]));
  const yNow = new Date().getFullYear();
  const selY = el('select', { 'aria-label': 'Year' }, [el('option', { value: '' }, ['Year'])]);
  for (let i = yNow - 2; i <= yNow + 5; i++) selY.appendChild(el('option', { value: String(i) }, [String(i)]));
  selM.value = m ? String(Number(m)).padStart(2, '0') : '';
  selD.value = d || '';
  selY.value = y || '';
  const fire = () => {
    const mv = selM.value, dv = selD.value, yv = selY.value;
    if (onChange) onChange(mv && dv && yv ? yv + '-' + mv + '-' + dv : '');
  };
  [selM, selD, selY].forEach((s) => s.addEventListener('change', fire));
  wrap.appendChild(selM); wrap.appendChild(selD); wrap.appendChild(selY);
  return wrap;
}

/* ------------------------------ sources ------------------------------ */

const SOURCES = {
  benefits: 'Driver Benefits - HR Draft',
  dress: 'U.S AutoForce Operations Dress Code Policy',
  driver: 'Driver Policy',
  speakup: 'Speak Up Policy',
  pto: 'Vacation-Personal Day Policy',
  pay: 'Understanding Your USV Paycheck',
  betterway: 'Finding-a-Better-Way-FAQs',
  wellness: 'Wellness Reimbursement',
  packet: 'Navigator 2026 Packet'
};

/* ------------------------------ people ------------------------------ */

const CONTACT_ROLES = [
  { id: 'trainer', label: 'Driver Trainer / Navigator' },
  { id: 'dispatch', label: 'Dispatch Supervisor' },
  { id: 'dispatcher', label: 'Dispatcher' },
  { id: 'hr', label: 'HR Business Partner' }
];

/* straight from the HR benefits draft — who to call */
const PEOPLE = [
  { name: 'Joshua Wheeler', role: 'Driver Trainer / Navigator', phone: '(319) 601-2111', email: 'jwheeler@usautoforce.com' },
  { name: 'Todd Alston', role: 'Dispatch Supervisor', phone: '(319) 499-8961', email: 'talston@usautoforce.com' },
  { name: 'Benjamin Staley', role: 'Dispatcher', phone: '(319) 600-4403', email: 'bstaley@usautoforce.com' },
  { name: 'Veronica Cease', role: 'HR Business Partner II', phone: '(913) 609-1180', email: 'vcease@usventure.com' }
];

const SPEAKUP = {
  phone: '1-888-275-6188',
  web: 'https://www.reportlineweb.com/usventure',
  email: 'reportline@tnwinc.com'
};

/* U.S. Venture's four values, straight from the Navigator packet */
const VALUES = [
  { name: 'Caring Relationships', text: 'Builds fun and friendships, listens well, collaborates, and treats people with compassion and respect.' },
  { name: 'Entrepreneurial Spirit', text: 'Knows how their role supports the strategy, spots problems, and builds the solution.' },
  { name: 'Strategic Foresight', text: 'Sees the big picture of the company, its policies and procedures, and works ahead of it.' },
  { name: 'High Performance', text: 'Takes ownership, delivers accurate work on time, follows the process, and works safe in every task.' }
];

/* ------------------------------ benefits ------------------------------ */

const CATS = [
  { id: 'all', label: 'Everything' },
  { id: 'money', label: 'Money in your pocket' },
  { id: 'time', label: 'Time off' },
  { id: 'health', label: 'Health & wellness' },
  { id: 'recognition', label: 'Recognition & awards' },
  { id: 'gear', label: 'Gear & how you look' }
];

/* Every value below is copied from the supplied HR documents.
   `confirm:true` = the document does not publish a number yet, so the app
   asks HR instead of guessing. */
const PROGRAMS = [
  {
    id: 'shoes', icon: '🥾', cat: 'gear', name: 'Safety shoe reimbursement',
    value: '100% up to $150', unit: 'per 12 months',
    detail: 'Steel-toe or composite boots, ASTM F2413-18 rated. Reimbursement can be processed after 30 days of employment.',
    who: 'All drivers and material handlers', how: 'Buy approved boots, then submit the receipt',
    source: SOURCES.dress + ' · p.2'
  },
  {
    id: 'uniforms', icon: '👕', cat: 'gear', name: 'Uniforms & company apparel',
    value: '50% reimbursed', unit: 'company store',
    detail: 'Apparel link arrives after your 30-day anniversary. Orders through the divisional Company Store are reimbursed at 50% annually when you use the code — the balance plus shipping and tax is yours. Name on a shirt or jacket must be your first name.',
    who: 'All drivers and material handlers', how: 'Order with the code from HR / leadership',
    source: SOURCES.dress + ' · p.2'
  },
  {
    id: 'dresscode', icon: '🦺', cat: 'gear', name: 'What you wear on shift',
    value: 'Hi-vis + branded shirt', unit: 'every shift',
    detail: 'Company uniform with the logo, industrial pants or shorts (denim is allowed), steel-toe or composite boots, and a safety vest or USAF hi-vis shirt. No cut-off sleeves or shorts, no tears, no tank tops outside unloading, no sports-team gear, no jewelry that gets in the way. Offensive tattoos must be covered.',
    who: 'Everybody in Operations', how: 'Read the dress code once — then it is automatic',
    source: SOURCES.dress + ' · p.1'
  },
  {
    id: 'wellness', icon: '🏃', cat: 'health', name: 'Wellness reimbursement',
    value: '$250', unit: 'per calendar year',
    detail: 'U.S. Venture reimburses 100% of the first $250 you submit each year: gym membership, exercise class or personal training fees, race registration, home fitness equipment (walking and running shoes count), weight-management programs, and wearable trackers such as Garmin or Apple Watch (tracker requires the Personify Health program). A 50-use log is required for gym and equipment; a 10-use log works if you submit monthly gym fees.',
    who: 'Every team member — whether or not you take medical coverage', how: 'Submit expenses plus the use log on the wellness SharePoint page',
    source: SOURCES.wellness, hero: true
  },
  {
    id: 'steps', icon: '👟', cat: 'health', name: 'Walkingspree step goal',
    value: 'Cash every month', unit: 'you hit the goal',
    detail: 'Hit your monthly step target and earn a cash reward every single month you complete it. Track it on your watch or phone and the program does the rest.',
    who: 'All team members', how: 'Enroll in Walkingspree and sync your device',
    source: SOURCES.packet + ' / ' + SOURCES.benefits, confirm: true,
    confirmNote: 'Monthly reward amount and the steps-per-day target both need HR confirmation.'
  },
  {
    id: 'screen', icon: '🩺', cat: 'health', name: 'Annual health screen',
    value: 'Insurance premium discount', unit: 'every year',
    detail: 'On-site screenings once a year. Complete yours and earn a significant discount on your health insurance premiums — our biggest dollar-value benefit, and it costs you a few minutes. A pre-tax wellness credit on your paycheck comes through PHA participation.',
    who: 'Team members on a USV medical plan', how: 'Sign up during the screening window',
    source: SOURCES.benefits + ' / ' + SOURCES.pay, confirm: true,
    confirmNote: 'Discount percentage and this year\'s screening window need HR confirmation.'
  },
  {
    id: 'betterway', icon: '💡', cat: 'recognition', name: 'Finding a Better Way award',
    value: '$20,000 · $10,000 · $5,000', unit: '1st · 2nd · 3rd',
    detail: 'One idea can be worth twenty grand. Any initiative qualifies — new business, a product launch, a process improvement, something that engages the community we serve. Impact at any level counts: enterprise, division, function or location. A selection committee picks the winners and they are revealed during Team Member Appreciation Week. Amounts may vary when a nomination has multiple recipients.',
    who: 'Regular full-time and part-time team members (interns and temps are not eligible); winners must be active for the full award period', how: 'Nominate in RAVE → the Finding a Better Way program',
    source: SOURCES.betterway, hero: true
  },
  {
    id: 'rave', icon: '🏆', cat: 'recognition', name: 'RAVE recognition',
    value: 'Points → store or gift cards', unit: 'anyone can nominate',
    detail: 'Catch a teammate doing something great, or share an idea that makes us better, and they earn RAVE points. Redeem points in the online store or for gift certificates. RAVE earnings show on your paycheck — they are taxed, so you will see both an earning and a deduction line.',
    who: 'All team members', how: 'Nominate in RAVE — or get nominated',
    source: SOURCES.benefits + ' / ' + SOURCES.pay
  },
  {
    id: 'dotm', icon: '🚗', cat: 'recognition', name: 'Driver of the Month',
    value: 'Parking spot + points + lunch', unit: 'one driver a month',
    detail: 'One driver each month gets the spotlight: a reserved parking spot, a RAVE points bonus and a team lunch. It is the little stuff that makes this feel like family instead of just a job.',
    who: 'Drivers', how: 'Nominated by peers and leaders',
    source: SOURCES.benefits, confirm: true,
    confirmNote: 'Point value and lunch amount need HR confirmation.'
  },
  {
    id: 'vacation', icon: '🌴', cat: 'time', name: 'Vacation',
    value: '2 → 3 → 4 weeks', unit: 'by years of service',
    detail: 'Under 5 years: 2 weeks / 80 hours. 5 to under 10 years: 3 weeks / 120 hours. 10 or more: 4 weeks / 160 hours. It accrues every pay period and runs on the calendar year (1/1–12/31). Request two weeks ahead, check your balance in Workday → Absence, and carry over up to 40 hours into next year.',
    who: 'Active full- and part-time team members after 30 days', how: 'Request in Workday; leader approves',
    source: SOURCES.pto + ' · p.1-2', hero: true
  },
  {
    id: 'personal', icon: '📅', cat: 'time', name: 'Personal days',
    value: '4 days / 32 hours', unit: 'at 5-10 years',
    detail: 'Between 5 and under 10 years of service you get 4 personal days (32 hours) per calendar year on top of vacation. Part-time team members earn vacation and personal time based on their FTE percentage.',
    who: 'Team members with 5 to under 10 years of service', how: 'Request in Workday',
    source: SOURCES.pto + ' · p.1'
  },
  {
    id: 'volunteer', icon: '🤝', cat: 'time', name: 'Volunteer time',
    value: '8 hours', unit: 'per calendar year',
    detail: 'Paid time to give back — the community engagement side of the business (ACT Fund, volunteering, the initiatives on myusventure.com).',
    who: 'Eligible participants', how: 'Request in Workday',
    source: SOURCES.pay + ' · Absence Plans'
  },
  {
    id: 'sick', icon: '🛌', cat: 'time', name: 'Sick time & holidays',
    value: 'Front-loaded or state plan', unit: 'see your pay stub',
    detail: 'Sick time is front-loaded in states without a paid sick/safe leave rule, and state-specific sick plans accrue each pay period at the mandated rate. Holiday pay lands as PTO earnings on your stub.',
    who: 'All team members', how: 'Nothing to file — it shows in Workday',
    source: SOURCES.pay + ' · Absence Plans'
  },
  {
    id: 'mileage', icon: '🚙', cat: 'money', name: 'Mileage reimbursement (MOTUS)',
    value: 'Paid per business mile', unit: 'reported monthly',
    detail: 'Personal-vehicle business travel runs through MOTUS: report mileage monthly and get reimbursed. Occasional drivers use the mileage form on the intranet. Insurance minimums apply — $100k/$300k/$100k liability and property damage, $100k/$300k uninsured motorist, $1,000 comp/collision deductible, $5,000 medical. Out of compliance means no reimbursement.',
    who: 'Team members who drive a personal vehicle for business', how: 'Report in MOTUS every month',
    source: SOURCES.driver + ' · p.2-3'
  },
  {
    id: 'totalcomp', icon: '🏦', cat: 'money', name: '401(k) & employer-paid benefits',
    value: 'Real money on your stub', unit: 'every paycheck',
    detail: 'Health, dental, life insurance and 401(k) that the company pays for are part of your total compensation and printed on your pay stub. Pre-tax deductions (including the wellness credit) come out before taxes, so they lower your taxable income. W-4 elections live in Workday — review them every year.',
    who: 'Eligible team members', how: 'Elect in Workday; read your stub each period',
    source: SOURCES.pay
  }
];

const MONEY_TILES = [
  { icon: '💡', big: '$20,000', cap: 'Finding a Better Way', lab: 'best idea in the company' },
  { icon: '🏃', big: '$250', cap: 'Wellness', lab: 'back in your pocket, every year' },
  { icon: '🥾', big: '$150', cap: 'Safety boots', lab: '100% covered, every 12 months' },
  { icon: '🌴', big: '4 weeks', cap: 'Vacation', lab: 'at 10 years — 2 weeks on day one' }
];

/* ------------------------------ 90-day playbook ------------------------------ */

const PHASES = [
  {
    id: 'p1', num: '01', name: 'Day one', when: 'Your first shift',
    items: [
      { id: 'meet', label: 'Meet your Navigator and have lunch together', why: 'Your Navigator is your first point of contact for the whole 90 days — not just week one.' },
      { id: 'tour', label: 'Tour the facility: exits, first aid, break rooms, dock, yard', why: 'Knowing where the exits and first aid kits are is the fastest way to feel safe.' },
      { id: 'huddle', label: 'Get introduced at the safety huddle', why: 'The crew learns your name, and you learn theirs. Huddles are where the week\'s topic lands.' },
      { id: 'paperwork', label: 'Finish your HR paperwork in Workday', why: 'I-9 and W-4 done on day one means your first paycheck is not held up.' }
    ]
  },
  {
    id: 'p2', num: '02', name: 'Day two', when: 'Workday & your accounts',
    items: [
      { id: 'workday', label: 'Workday walk-through: time off, paycheck, direct deposit, benefits', why: 'Everything you will ever need to change about your pay lives in one place.' },
      { id: 'auth', label: 'Set up the authenticator app, the Workday app, and change your password', why: 'Two minutes now saves a locked-out shift later.' },
      { id: 'breaks', label: 'Attendance, meal and rest break rules', why: 'Break rules are state-specific and they are the easiest thing to get wrong.' }
    ]
  },
  {
    id: 'p3', num: '03', name: 'Week one', when: 'Safety & the rules',
    items: [
      { id: 'dress', label: 'Dress code, uniforms and the boot reimbursement', why: '$150 of boots is yours — you just have to buy them after day 30.' },
      { id: 'safety', label: 'Safety rules: PPE, lifting technique, daily stretching', why: 'The stretching is not a suggestion. It is the cheapest injury prevention we have.' },
      { id: 'driverpol', label: 'Driver Policy walk-through — G.O.A.L., phone, incident reporting', why: 'G.O.A.L. before every backing maneuver, and report every incident no matter how small.' },
      { id: 'speakup', label: 'Speak Up: how to raise a concern, anonymously if you want', why: 'You can call the hotline 24/7. Retaliation is a firing offense — that is the whole point.' },
      { id: 'rewards', label: 'Tour Total Rewards: benefits, perks, Health Smart, myusventure.com', why: 'This is where the $250, the step program and the idea award actually live.' }
    ]
  },
  {
    id: 'p4', num: '04', name: 'Weeks two to four', when: 'Behind the wheel',
    items: [
      { id: 'pace', label: 'PACE training — with an emphasis on G.O.A.L.', why: 'Plan ahead, analyze surroundings, communicate, execute. Four habits that prevent most incidents.' },
      { id: 'file', label: 'Build your driver file', why: 'A complete file is what lets you drive. Every gate after this one depends on it.' },
      { id: 'dot', label: 'DOT compliance training', why: 'Medical card, hours, and the paperwork that keeps the truck legal.' },
      { id: 'ride1', label: 'Ride-along one: shadow your trainer', why: 'Watch the route once with someone who has run it a thousand times.' },
      { id: 'touch1', label: 'Weekly touch-base with your Navigator', why: 'Fifteen minutes a week, for 90 days. That is the actual program.' }
    ]
  },
  {
    id: 'p5', num: '05', name: 'Day 30', when: 'Now you can spend it',
    items: [
      { id: 'boots', label: 'Order your boots and uniform link (30-day mark)', why: 'The apparel link and the $150 boot reimbursement both unlock at 30 days.' },
      { id: 'wellness', label: 'Submit your wellness reimbursement', why: '$250 a year, 100% of what you submit — do not leave it on the table.' },
      { id: 'community', label: 'Get into the community: Venture Voice, Workvivo, Walkingspree, RAVE', why: 'Recognition and step rewards both start the day you sign up.' }
    ]
  },
  {
    id: 'p6', num: '06', name: 'Day 45 to 60', when: 'On your own, with backup',
    items: [
      { id: 'solo', label: 'Solo with shadow', why: 'Your route, your decisions — with someone a radio call away.' },
      { id: 'paceeval', label: 'PACE driving evaluation', why: 'A coached drive with a scored form, so you know exactly what to sharpen.' },
      { id: 'learning', label: 'Start LinkedIn Learning or Jump-Start', why: 'Free development you can use here or anywhere.' },
      { id: 'touch2', label: 'Keep the weekly touch-base going', why: 'The people who finish strong are the ones who kept talking.' }
    ]
  },
  {
    id: 'p7', num: '07', name: 'Day 75', when: 'The honest conversation',
    items: [
      { id: 'opsride', label: 'Operations Leader ride-along', why: 'Your leader sees the job the way you see it — from the cab.' },
      { id: 'feedback', label: 'Honest feedback session with your Navigator', why: 'Ask for the thing nobody volunteers. It is the most useful hour of the 90 days.' }
    ]
  },
  {
    id: 'p8', num: '08', name: 'Day 90', when: 'Sign it off',
    items: [
      { id: 'eval', label: '90-day performance evaluation', why: 'A real review with a real outcome — not a formality.' },
      { id: 'navreview', label: 'Navigator review of the new hire', why: 'Your Navigator writes down what worked and what to fix for the next person.' },
      { id: 'sign', label: 'Sign the packet and submit it to your HR Business Partner', why: 'Mentee, Navigator, Ops Leader, date. That signature closes the program.' }
    ]
  }
];

const ALL_ITEMS = PHASES.reduce((a, p) => a.concat(p.items.map((i) => Object.assign({ phase: p.id, phaseName: p.name }, i))), []);

/* ------------------------------ policies ------------------------------ */

const POLICIES = [
  {
    id: 'dress', icon: '🦺', title: 'Dress code',
    one: 'Branded shirt, hi-vis, and steel-toe or composite boots rated ASTM F2413-18. Every shift.',
    big: 'Your boots are the one thing nobody negotiates.',
    points: [
      'Company uniform with the logo on all assigned shifts; pants or shorts (denim is fine).',
      'Safety shoes must be steel-toe or composite, ASTM F2413-18. 100% reimbursed up to $150 per 12 months, after 30 days.',
      'Safety vest or USAF hi-vis shirt per the safety program. USAF or plain vests only.',
      'Not allowed: cut-off sleeves/shorts/pants, tears or holes, tank tops outside truck unloading, exposed undergarments, sports-team clothing, tight or revealing clothing, jewelry that interferes with the job.',
      'Offensive or inappropriate tattoos must be covered. Uniforms are for work only, and you launder them.',
      'Apparel link comes at your 30-day anniversary. Company Store orders are 50% reimbursed with the code.'
    ],
    source: SOURCES.dress + ' · effective 7/1/1996, revised 5/27/2026'
  },
  {
    id: 'driver', icon: '🚛', title: 'Driver Policy',
    one: 'G.O.A.L. before every backing maneuver. Hands off the phone. Report every incident.',
    big: 'Get Out And Look — a backup camera does not replace it.',
    points: [
      'Valid license for what you drive. Citations, suspensions and revocations get reported to your HR Business Partner immediately — on or off the job.',
      'Hand-held phone use is prohibited any time the vehicle is in motion, at a light, or stopped anywhere that is not a safe parking spot. Hands-free only where state law allows.',
      'Seatbelt on, every trip, every passenger.',
      'No alcohol, drugs or impairing medication while on duty — and that includes sleep deprivation and illness.',
      'Pre- and post-trip inspections: lights, tires, horn, brakes, fluids, lugs, plate, emergency equipment.',
      'Backing: scan the delivery area on the way in, position for the safest exit, and G.O.A.L. before you back. If you are backing off a roadway, get off it first, then G.O.A.L.',
      'Never tamper with or disable equipment — cameras, PPE, PIT, trucks. First offense is discipline up to termination.',
      'DOT medical card: tell your leader and re-certify within 60 days of expiration.',
      'No passengers, weapons, tobacco or personal use in a company vehicle.'
    ],
    source: SOURCES.driver + ' · p.1-7'
  },
  {
    id: 'incident', icon: '🚨', title: 'If something happens',
    one: 'Make it safe, call 911, collect information — and do not discuss what happened.',
    big: 'Report it. Do not admit fault, and do not sign anything at the scene.',
    points: [
      'Secure the scene, set out reflectors or cones, and check on the other party.',
      'Exchange insurance information and get witness contacts. Take photos of every vehicle, plate and damaged area.',
      'Do not make statements beyond police or EMS. Do not apologize or admit fault. Do not mention the camera system.',
      'Report every incident to your supervisor at the time or as soon as practical — even a minor one. Late reporting is progressive discipline.',
      'A review call happens within 72 hours: driver, Operations Leader, HR Business Partner, DOT Compliance Manager and Regional Safety Specialist.',
      'MVRs are monitored annually and after incidents. The matrix: 0 preventable incidents in 12 months is acceptable; 2 is not. One major violation is disqualifying.'
    ],
    source: SOURCES.driver + ' · p.3-5'
  },
  {
    id: 'speakup', icon: '🛡️', title: 'Speak Up',
    one: 'Report it in good faith, anonymously if you want, 24 hours a day. No retaliation, ever.',
    big: 'Retaliation is a firing offense. That is the entire point of the policy.',
    points: [
      'Anything that looks like fraud, theft, misuse of company assets, questionable accounting, or a Code of Conduct problem gets reported promptly.',
      'Fastest route is usually your manager, HR or Legal. The outside hotline is for when that is not the right fit.',
      'Navex Global runs the anonymous line: ' + SPEAKUP.phone + ' · ' + SPEAKUP.web + ' · ' + SPEAKUP.email + ' (include "U.S. Venture, Inc." in the email).',
      'Not for routine team-member relations questions — those go to your manager or HR Business Partner.',
      'You can also go straight to the Chief People Officer (1-262-290-7554) or Chief Legal Officer (1-920-423-6421) at 222 W College Ave, Appleton, WI 54911.',
      'Knowingly false accusations are also a serious violation.'
    ],
    source: SOURCES.speakup + ' · revised 10/2026'
  },
  {
    id: 'pto', icon: '🌴', title: 'Vacation & personal time',
    one: 'Earned every pay period. Request two weeks out. Carry over 40 hours.',
    big: 'Two weeks of vacation starts in year one. Four weeks at ten years.',
    points: [
      'Under 5 years: 80 hours. 5 to under 10: 120 hours plus 4 personal days (32 hours). 10+: 160 hours.',
      'It accrues per pay period and runs on the calendar year. Check balances in Workday → Absence.',
      'Request at least two weeks ahead and get approval before you book anything.',
      'Carry over up to 40 hours; anything above that is forfeited unless state law says otherwise.',
      'Borrowing future accrual is possible with leader approval if you are in good standing.',
      'If you leave, accrued-but-unused time is paid out at your base rate; time taken but not yet earned is repaid.',
      'California, Colorado, Montana and Nebraska have their own accrual caps that override the base policy.'
    ],
    source: SOURCES.pto + ' · revised 7/1/2025'
  },
  {
    id: 'pay', icon: '🧾', title: 'Understanding your paycheck',
    one: 'Gross pay, pre-tax, post-tax, employer-paid — four boxes and what each one means.',
    big: 'Pre-tax money is taken out before taxes, so it lowers what you owe.',
    points: [
      'Gross pay = hours worked plus PTO (sick, volunteer, vacation, holiday), bonuses and RAVE rewards.',
      'Pre-tax deductions come out before taxes: medical, dental, vision, 401(k) and the PHA wellness credit. They reduce taxable income.',
      'Employee taxes are OASDI (Social Security) and Medicare, which you and USV both pay, plus federal, state and local withholding based on your W-4 in Workday.',
      'Post-tax deductions come out after taxes: Roth 401(k), 401(k) loans, supplemental insurance, garnishments, rewards offsets.',
      'Employer-paid benefits — health, dental, life, 401(k) match — are real compensation even though they are not cash.',
      'RAVE redemptions show as both an earning and a deduction. That is how the taxes get applied.',
      'Questions: Payroll@usventure.com.'
    ],
    source: SOURCES.pay
  },
  {
    id: 'betterway', icon: '💡', title: 'Finding a Better Way',
    one: 'A yearly award for the idea that moves the company: $20,000, $10,000, $5,000.',
    big: 'Anybody can win this — the impact can be at a single location.',
    points: [
      '1st place $20,000 · 2nd $10,000 · 3rd $5,000. Amounts may vary if a nomination has multiple recipients.',
      'Eligible: regular full-time and part-time team members. Interns and temporary team members are not. Winners must be active through the whole award period.',
      'Any initiative counts: new business, a product launch, a meaningful process improvement, community impact.',
      'Impact at any level qualifies: enterprise-wide, division, function or location.',
      'A selection committee reviews every submission and winners are announced during Team Member Appreciation Week.',
      'It is separate from normal RAVE recognition — nominate inside the Finding a Better Way program in RAVE.'
    ],
    source: SOURCES.betterway
  }
];

/* ------------------------------ storage ------------------------------ */

const DB_NAME = 'usaf_navigator_db';
const DB_KEY = 'usaf_navigator_v1';
const THEME_KEY = 'nav-theme';
const ROLE_KEY = 'nav-role';

const canIdb = typeof indexedDB !== 'undefined';
let _db = null;
let _dbPromise = null;

function idbOpen() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function persist(data) {
  if (!canIdb) { try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) {} return Promise.resolve(); }
  return idbOpen().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(data, DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })).catch(() => {});
}

/* ------------------------------ state ------------------------------ */

function blankNewHire() {
  return {
    name: '', department: 'Driver', location: '', startDate: '',
    navigator: '', navigatorPhone: '', navigatorEmail: '',
    hr: 'Veronica Cease', hrPhone: '(913) 609-1180', hrEmail: 'vcease@usventure.com',
    ticks: {}, notes: {}
  };
}

const state = {
  locations: [],
  values: {},
  rides: [],
  questions: [],
  newHire: blankNewHire(),
  role: 'hire',
  settings: { selectedLocation: '' },
  ui: {
    tab: 'home', openProg: {}, locView: '', locFilter: 'all', benFilter: 'all',
    cat: 'all', rideFilter: '', sheet: 'onepager', pbOpen: {}, polOpen: {}
  }
};

function blankState() {
  return {
    locations: [], values: {}, rides: [], questions: [],
    newHire: blankNewHire(), role: 'hire', settings: { selectedLocation: '' },
    programs: PROGRAMS.length
  };
}

function ensureNewHire(n) {
  const base = blankNewHire();
  n = n && typeof n === 'object' ? n : {};
  const out = Object.assign(base, n);
  out.ticks = n.ticks && typeof n.ticks === 'object' ? n.ticks : {};
  out.notes = n.notes && typeof n.notes === 'object' ? n.notes : {};
  return out;
}

function ensureShape(d) {
  const base = blankState();
  if (!d || typeof d !== 'object') return base;
  base.locations = Array.isArray(d.locations) ? d.locations.map(ensureLocation) : [];
  base.values = d.values && typeof d.values === 'object' ? d.values : {};
  base.rides = Array.isArray(d.rides) ? d.rides : [];
  base.questions = Array.isArray(d.questions) ? d.questions : [];
  base.newHire = ensureNewHire(d.newHire);
  base.role = d.role === 'nav' ? 'nav' : 'hire';
  base.settings = Object.assign(base.settings, d.settings || {});
  return base;
}

function ensureLocation(l) {
  l = l || {};
  l.id = l.id || uid();
  l.name = l.name || 'Untitled location';
  l.contacts = l.contacts || {};
  CONTACT_ROLES.forEach((r) => {
    l.contacts[r.id] = Object.assign({ name: '', phone: '', email: '' }, l.contacts[r.id] || {});
  });
  l.published = !!l.published;
  l.createdAt = l.createdAt || nowISO();
  return l;
}

function load() {
  const finish = (raw) => {
    const d = ensureShape(raw);
    state.locations = d.locations;
    state.values = d.values;
    state.rides = d.rides;
    state.questions = d.questions;
    state.newHire = d.newHire;
    state.role = d.role;
    state.settings = d.settings;
    const r = localStorage.getItem(ROLE_KEY);
    if (r === 'nav' || r === 'hire') state.role = r;
    if (!state.settings.selectedLocation && state.locations[0]) state.settings.selectedLocation = state.locations[0].id;
    applyRole();
    render(true);
  };
  if (!canIdb) {
    try { finish(JSON.parse(localStorage.getItem(DB_KEY) || 'null')); }
    catch (e) { finish(null); }
    return;
  }
  idbOpen().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readonly');
    const rq = tx.objectStore('kv').get(DB_KEY);
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => resolve(null);
  })).then(finish).catch(() => finish(null));
}

let _saveTimer = null;
function save(immediate) {
  const payload = {
    locations: state.locations, values: state.values, rides: state.rides,
    questions: state.questions, newHire: state.newHire, role: state.role,
    settings: state.settings, programs: PROGRAMS.length
  };
  clearTimeout(_saveTimer);
  if (immediate) return persist(payload);
  _saveTimer = setTimeout(() => persist(payload), 250);
  return Promise.resolve();
}

/* ------------------------------ selectors ------------------------------ */

function locById(id) { return state.locations.find((l) => l.id === id) || null; }
function progById(id) { return PROGRAMS.find((p) => p.id === id) || null; }
function vKey(locId, progId) { return locId + ':' + progId; }

function getVal(locId, progId) {
  const v = state.values[vKey(locId, progId)];
  return Object.assign({ amount: '', eligibility: '', claim: '', effective: '', confirmedBy: '', status: 'tbd' }, v || {});
}

function setVal(locId, progId, patch) {
  const k = vKey(locId, progId);
  const cur = state.values[k] || { amount: '', eligibility: '', claim: '', effective: '', confirmedBy: '', status: 'tbd' };
  const next = Object.assign({}, cur, patch);
  if (!next.auditId) next.auditId = 'NAV-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();
  next.updatedAt = nowISO();
  state.values[k] = next;
  save();
  return next;
}

function isFilled(v) { return !!(v && String(v.amount).trim()); }

function progFilled(locId, progId) {
  const v = getVal(locId, progId);
  return !!(v.amount.trim() && v.eligibility.trim() && v.claim.trim());
}

function locProgress(locId) {
  let done = 0;
  PROGRAMS.forEach((p) => { if (progFilled(locId, p.id)) done++; });
  return { done, total: PROGRAMS.length, pct: Math.round((done / PROGRAMS.length) * 100) };
}

function openQuestions(locId) {
  return state.questions.filter((q) => !q.answered && (!locId || q.locId === locId));
}

function selectedLocId() {
  let id = state.settings.selectedLocation;
  if (!locById(id)) { id = state.locations[0] ? state.locations[0].id : ''; state.settings.selectedLocation = id; }
  return id;
}

/* playbook helpers */
function isTicked(id) { return !!state.newHire.ticks[id]; }
function phaseProgress(ph) {
  const done = ph.items.filter((i) => isTicked(i.id)).length;
  return { done, total: ph.items.length, pct: Math.round((done / ph.items.length) * 100) };
}
function playbookProgress() {
  const done = ALL_ITEMS.filter((i) => isTicked(i.id)).length;
  return { done, total: ALL_ITEMS.length, pct: Math.round((done / ALL_ITEMS.length) * 100) };
}
function currentPhase() {
  const open = PHASES.filter((p) => phaseProgress(p).done < p.items.length);
  return open[0] || PHASES[PHASES.length - 1];
}
function hireDay() {
  const s = state.newHire.startDate;
  if (!s) return 0;
  return Math.max(0, daysBetween(s, todayISO()) + 1);
}
function hireName() { return state.newHire.name || 'New hire'; }
function nextUp(n) {
  return ALL_ITEMS.filter((i) => !isTicked(i.id)).slice(0, n || 3);
}

/* ------------------------------ header / theme / role ------------------------------ */

function applyTheme() {
  const t = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  const t = (localStorage.getItem(THEME_KEY) || 'light') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, t);
  applyTheme();
}

function applyRole() {
  document.querySelectorAll('.role').forEach((b) => b.classList.toggle('active', b.dataset.role === state.role));
  const sub = document.getElementById('brandSub');
  if (sub) {
    sub.textContent = state.role === 'nav'
      ? 'Navigator view · locations · values · ride-alongs'
      : 'Your first 90 days · the good stuff · the rules';
  }
  document.body.dataset.role = state.role;
}

function setRole(role) {
  state.role = role === 'nav' ? 'nav' : 'hire';
  localStorage.setItem(ROLE_KEY, state.role);
  applyRole();
  save();
  render();
}

function updateNetBadge() {
  const b = document.getElementById('netBadge');
  if (!b) return;
  const on = navigator.onLine !== false;
  b.classList.toggle('net-off', !on);
  b.classList.toggle('net-on', on);
  const lab = b.querySelector('.net-label');
  if (lab) lab.textContent = on ? 'Online' : 'Offline';
}

/* ------------------------------ router / tabs ------------------------------ */

const TABS = ['home', 'playbook', 'benefits', 'policies', 'rides', 'print'];
const RIDES_ONLY_NAV = true;

function go(tab) {
  if (tab === 'huddle') { state.ui.sheet = 'huddle'; tab = 'print'; }
  if (!TABS.includes(tab)) tab = 'home';
  state.ui.tab = tab;
  state.ui.locView = '';
  state.ui.openProg = {};
  if (location.hash.slice(1) !== tab) history.replaceState(null, '', '#' + tab);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyHash() {
  const h = (location.hash || '').replace('#', '');
  const parts = h.split(':');
  if (parts[0] === 'huddle') { state.ui.tab = 'print'; state.ui.sheet = 'huddle'; return true; }
  if (TABS.includes(parts[0])) {
    state.ui.tab = parts[0];
    if (parts[0] === 'locations' && parts[1]) state.ui.locView = parts[1];
    if (parts[0] === 'print' && parts[1]) state.ui.sheet = parts[1];
    return true;
  }
  return false;
}

function render(initial) {
  if (initial) applyHash();
  const view = document.getElementById('view');
  if (!view) return;
  document.querySelectorAll('.tab').forEach((b) => {
    const on = b.dataset.view === state.ui.tab;
    b.classList.toggle('active', on);
  });
  view.innerHTML = '';
  switch (state.ui.tab) {
    case 'playbook': view.appendChild(renderPlaybook()); break;
    case 'benefits': view.appendChild(renderBenefits()); break;
    case 'policies': view.appendChild(renderPolicies()); break;
    case 'rides': view.appendChild(renderRides()); break;
    case 'print': view.appendChild(renderPrint()); break;
    default: view.appendChild(renderHome());
  }
}

/* ------------------------------ small builders ------------------------------ */

function statusBadge(locId, progId) {
  const v = getVal(locId, progId);
  if (v.status === 'confirmed') return el('span', { class: 'badge ok' }, ['CONFIRMED']);
  if (isFilled(v)) return el('span', { class: 'badge draft' }, ['NEEDS REVIEW']);
  return el('span', { class: 'badge tbd' }, ['TBD']);
}

function meterNode(pct, cls) {
  return el('div', { class: 'meter ' + (cls || '') }, [el('i', { style: 'width:' + Math.max(0, Math.min(100, pct)) + '%' })]);
}

function filterSelect(options, value, onChange, aria) {
  const sel = el('select', { 'aria-label': aria || 'Filter', style: 'padding:8px 10px;font-size:13px;font-weight:600;max-width:190px' });
  options.forEach((o) => sel.appendChild(el('option', { value: o.v }, [o.t])));
  sel.value = value;
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function locPicker(onChange, id) {
  const sel = el('select', { class: 'big', id: id || 'locPick', 'aria-label': 'Location' });
  if (!state.locations.length) {
    sel.appendChild(el('option', { value: '' }, ['No locations yet']));
    return sel;
  }
  state.locations.forEach((l) => {
    sel.appendChild(el('option', { value: l.id }, [l.name + (l.city ? ' — ' + l.city + ', ' + (l.state || '') : '')]));
  });
  sel.value = selectedLocId();
  sel.addEventListener('change', () => {
    state.settings.selectedLocation = sel.value;
    save();
    if (onChange) onChange(sel.value);
  });
  return sel;
}

function chips(list, active, onPick) {
  const wrap = el('div', { class: 'chips' });
  list.forEach((c) => {
    const b = el('button', {
      type: 'button', class: 'chip' + (active === c.id ? ' on' : ''),
      onclick: () => onPick(c.id)
    }, [c.label, c.n != null ? el('span', { class: 'cnum' }, [String(c.n)]) : null].filter(Boolean));
    wrap.appendChild(b);
  });
  return wrap;
}

function pageTitle(h2, sub, action) {
  return el('div', { class: 'page-title' }, [
    el('div', {}, [el('h2', {}, [h2]), sub ? el('p', {}, [sub]) : null].filter(Boolean)),
    action || null
  ].filter(Boolean));
}

/* ------------------------------ HOME ------------------------------ */

function renderHome() {
  return state.role === 'nav' ? renderNavHome() : renderHireHome();
}

function renderHireHome() {
  const frag = el('div');
  const nh = state.newHire;
  const day = hireDay();
  const pp = playbookProgress();

  /* persona hero */
  const hero = el('div', { class: 'hero' });
  hero.appendChild(el('div', { class: 'hero-top' }, [
    el('div', { class: 'avatar' }, [initialsOf(nh.name)]),
    el('div', { style: 'min-width:0' }, [
      el('h2', {}, [hireName()]),
      el('p', { class: 'hsub' }, [[nh.department || 'Driver', nh.location].filter(Boolean).join(' · ') + (nh.navigator ? ' · Navigator ' + nh.navigator : '')]),
      el('p', { class: 'hday' }, [day ? 'Day ' + day + ' of 90' : 'Set your start date to start the clock'])
    ])
  ]));
  const hm = el('div', { class: 'hero-meter' }, [
    el('div', { class: 'lab' }, [
      el('span', {}, ['90-day Navigator Program']),
      el('span', {}, [pp.done + ' of ' + pp.total])
    ]),
    el('div', { class: 'track' }, [el('i', { style: 'width:' + pp.pct + '%' })])
  ]);
  hero.appendChild(hm);
  hero.appendChild(el('div', { class: 'hero-actions' }, [
    el('button', { class: 'btn gold sm', type: 'button', onclick: () => go('playbook') }, ['▶ What\'s next']),
    el('button', { class: 'btn sm', type: 'button', onclick: () => go('benefits') }, ['💛 The good stuff']),
    el('button', { class: 'btn sm', type: 'button', onclick: openHireModal }, ['✎ My details'])
  ]));
  frag.appendChild(hero);

  /* the money strip — this is the hook */
  const mg = el('div', { class: 'money-grid' });
  MONEY_TILES.forEach((t) => {
    mg.appendChild(el('div', { class: 'money gold' }, [
      el('div', { class: 'mtop' }, [el('span', { class: 'mi' }, [t.icon]), el('span', { class: 'mcap' }, [t.cap])]),
      el('strong', {}, [t.big]),
      el('span', { class: 'mlab' }, [t.lab])
    ]));
  });
  frag.appendChild(mg);

  /* next up */
  const cp = currentPhase();
  const next = nextUp(4);
  const nextCard = el('div', { class: 'card' });
  nextCard.appendChild(el('div', { class: 'card-head' }, [
    el('h3', { class: 'card-title' }, ['🗓️ Next up', el('span', { class: 'badge gold' }, [cp.name.toUpperCase()])]),
    el('span', { class: 'badge' }, [cp.when.toUpperCase()])
  ]));
  if (!next.length) {
    nextCard.appendChild(el('div', { class: 'empty' }, [
      el('div', { class: 'big' }, ['🎉']),
      el('p', {}, ['Every item on the 90-day program is ticked. Sign the packet and hand it to HR.'])
    ]));
  } else {
    next.forEach((i) => {
      nextCard.appendChild(el('div', { class: 'pb-item' }, [
        el('button', {
          class: 'tick', type: 'button', 'aria-label': 'Tick ' + i.label,
          onclick: () => { toggleItem(i.id); }
        }, ['✓']),
        el('div', { class: 'ptxt' }, [
          el('div', { class: 'plabel' }, [i.label]),
          el('div', { class: 'pwhy' }, [i.phaseName + ' · ' + i.why])
        ])
      ]));
    });
    nextCard.appendChild(el('div', { style: 'margin-top:10px' }, [
      el('button', { class: 'btn sm', type: 'button', onclick: () => go('playbook') }, ['See the whole 90 days →'])
    ]));
  }
  frag.appendChild(nextCard);

  /* who to call */
  const who = el('div', { class: 'card' });
  who.appendChild(el('h3', { class: 'card-title' }, ['📞 Who to call']));
  const list = PEOPLE.slice();
  list.forEach((p) => {
    who.appendChild(el('div', { class: 'row-item' }, [
      el('span', { class: 'thumb' }, ['👤']),
      el('span', { class: 'grow' }, [
        el('span', { class: 't', style: 'display:block' }, [p.name]),
        el('span', { class: 's', style: 'display:block' }, [p.role + ' · ' + p.phone])
      ]),
      el('a', { class: 'btn sm', href: 'tel:' + p.phone.replace(/[^\d+]/g, '') }, ['Call'])
    ]));
  });
  frag.appendChild(who);

  frag.appendChild(aboutCard());
  return frag;
}

function renderNavHome() {
  const frag = el('div');
  frag.appendChild(pageTitle('Navigator view', 'Every location, its confirmed values, and what is still waiting on an answer'));

  const totalProgs = state.locations.length * PROGRAMS.length;
  let confirmed = 0, filled = 0;
  state.locations.forEach((l) => PROGRAMS.forEach((p) => {
    const v = getVal(l.id, p.id);
    if (isFilled(v)) filled++;
    if (v.status === 'confirmed') confirmed++;
  }));
  const pct = totalProgs ? Math.round((confirmed / totalProgs) * 100) : 0;
  const qOpen = openQuestions().length;

  frag.appendChild(el('div', { class: 'stat-grid' }, [
    el('div', { class: 'stat' }, [el('strong', {}, [String(state.locations.length)]), el('span', {}, ['Locations'])]),
    el('div', { class: 'stat ' + (pct >= 90 ? 'good' : pct > 0 ? 'warn' : '') }, [el('strong', {}, [pct + '%']), el('span', {}, ['Values confirmed'])]),
    el('div', { class: 'stat ' + (qOpen ? 'bad' : 'good') }, [el('strong', {}, [String(qOpen)]), el('span', {}, ['Open HR questions'])]),
    el('div', { class: 'stat' }, [el('strong', {}, [String(state.rides.length)]), el('span', {}, ['Ride-alongs logged'])])
  ]));

  /* attention inbox */
  const att = el('div', { class: 'card' });
  att.appendChild(el('div', { class: 'card-head' }, [
    el('h3', { class: 'card-title' }, ['Needs attention']),
    el('span', { class: 'badge ' + (qOpen ? 'open' : 'ok') }, [qOpen ? qOpen + ' OPEN' : 'ALL CLEAR'])
  ]));

  const items = [];
  state.locations.forEach((l) => {
    const pr = locProgress(l.id);
    if (pr.done < pr.total) {
      items.push({
        tone: pr.done === 0 ? 'tbd' : 'draft',
        icon: '📋', title: l.name,
        badge: (pr.total - pr.done) + ' TBD',
        sub: (pr.total - pr.done) + ' benefit value' + (pr.total - pr.done === 1 ? '' : 's') + ' still missing',
        onClick: () => { state.settings.selectedLocation = l.id; go('benefits'); }
      });
    }
    if (!l.published) {
      items.push({
        tone: 'draft', icon: '🚦', title: l.name, badge: 'DRAFT',
        sub: 'Not published — drivers cannot see these values yet',
        onClick: () => { state.settings.selectedLocation = l.id; go('print'); state.ui.sheet = 'location'; render(); }
      });
    }
  });
  openQuestions().forEach((q) => {
    const l = locById(q.locId);
    items.push({
      tone: 'open', icon: '❓', title: q.text, badge: 'ASKED',
      sub: (l ? l.name : 'Unknown location') + ' · asked ' + fmtDate(String(q.createdAt || '').slice(0, 10)),
      onClick: () => go('rides')
    });
  });

  if (!items.length) {
    att.appendChild(el('div', { class: 'empty' }, [
      el('div', { class: 'big' }, ['✅']),
      el('p', {}, ['Nothing waiting on you right now.'])
    ]));
  } else {
    items.slice(0, 8).forEach((it) => att.appendChild(rowItem(it)));
  }
  frag.appendChild(att);

  /* waiting on HR - benefits the document set never puts a number on */
  const todo = PROGRAMS.filter((p) => p.confirm);
  if (todo.length) {
    const hrCard = el('div', { class: 'card' });
    hrCard.appendChild(el('div', { class: 'card-head' }, [
      el('h3', { class: 'card-title' }, ['\u23f3 Waiting on HR']),
      el('span', { class: 'badge open' }, [todo.length + ' ITEM' + (todo.length === 1 ? '' : 'S')])
    ]));
    hrCard.appendChild(el('p', { class: 'note', style: 'margin:0 0 6px' }, [
      'These benefits exist and drivers can ask about them, but no published document gives the number. ' +
      'The hub says so instead of guessing in front of a new hire.'
    ]));
    todo.forEach((p) => {
      hrCard.appendChild(rowItem({
        tone: 'tbd', icon: p.icon, title: p.name, badge: 'NO NUMBER',
        sub: p.confirmNote || 'Needs a confirmed number from HR',
        onClick: () => go('benefits')
      }));
    });
    frag.appendChild(hrCard);
  }

  /* locations summary */
  if (state.locations.length) {
    const lc = el('div', { class: 'card' });
    lc.appendChild(el('div', { class: 'card-head' }, [
      el('h3', { class: 'card-title' }, ['📍 Locations']),
      el('button', { class: 'btn sm primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add'])
    ]));
    state.locations.forEach((l) => {
      const pr = locProgress(l.id);
      lc.appendChild(el('div', { style: 'padding:10px 0;border-top:1px solid var(--line)' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, [
          el('div', {}, [
            el('div', { style: 'font-size:13.5px;font-weight:800' }, [l.name]),
            el('div', { style: 'font-size:11.5px;color:var(--muted)' }, [
              [l.city && (l.city + ', ' + (l.state || '')), l.driverCount ? l.driverCount + ' drivers' : ''].filter(Boolean).join(' · ')
            ])
          ]),
          el('div', { style: 'display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end' }, [
            el('span', { class: 'badge ' + (l.published ? 'pub' : 'draft') }, [l.published ? 'PUBLISHED' : 'DRAFT'])
          ])
        ]),
        el('div', { style: 'display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);font-weight:600;margin-top:6px' }, [
          el('span', {}, [pr.done + ' of ' + pr.total + ' values confirmed']),
          el('span', {}, [pr.pct + '%'])
        ]),
        meterNode(pr.pct, pr.pct === 100 ? 'good' : pr.pct >= 50 ? 'mid' : ''),
        el('div', { style: 'display:flex;gap:7px;margin-top:9px;flex-wrap:wrap' }, [
          el('button', {
            class: 'btn sm', type: 'button',
            onclick: () => { state.settings.selectedLocation = l.id; save(); go('benefits'); }
          }, ['Values']),
          el('button', {
            class: 'btn sm', type: 'button',
            onclick: () => { state.settings.selectedLocation = l.id; save(); state.ui.sheet = 'location'; state.ui.tab = 'print'; render(); }
          }, ['Sheet']),
          el('button', { class: 'btn sm', type: 'button', onclick: () => openLocationModal(l) }, ['✎ Edit'])
        ])
      ]));
    });
    frag.appendChild(lc);
  } else {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['📍']),
        el('p', {}, ['No locations yet. Add your first terminal to start confirming values.']),
        el('button', { class: 'btn primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add location'])
      ])
    ]));
  }

  /* quick actions */
  frag.appendChild(el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Quick actions']),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('button', { class: 'btn primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add location']),
      el('button', {
        class: 'btn', type: 'button',
        onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); }
      }, ['+ Log ride-along']),
      el('button', { class: 'btn', type: 'button', onclick: () => go('benefits') }, ['Confirm values']),
      el('button', { class: 'btn', type: 'button', onclick: () => { state.ui.sheet = 'packet'; go('print'); } }, ['🖨️ Print the packet'])
    ])
  ]));

  /* data card */
  const data = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Data']),
    el('p', { class: 'card-sub' }, ['Everything stays on this device. Back up before switching phones.'])
  ]);
  data.appendChild(el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
    el('button', { class: 'btn sm', type: 'button', onclick: exportBackup }, ['⬇ Export backup']),
    el('button', { class: 'btn sm', type: 'button', onclick: importBackup }, ['⬆ Import / sync']),
    el('button', { class: 'btn sm', type: 'button', onclick: exportCsv }, ['Export CSV'])
  ]));
  frag.appendChild(data);

  frag.appendChild(aboutCard());
  return frag;
}

function aboutCard() {
  return el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['About this toolkit']),
    el('p', { class: 'card-sub' }, [
      'Built for the Navigator role: one place for the 90-day program, the real benefit numbers, ' +
      'the policies that matter, the ride-alongs, and every sheet you have to print.']),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('button', {
        class: 'btn sm', type: 'button',
        onclick: () => window.open('https://joshwheeler8206-cell.github.io/showcase/', '_blank')
      }, ['📖 The full story']),
      el('button', {
        class: 'btn sm', type: 'button',
        onclick: () => { state.ui.sheet = 'packet'; go('print'); }
      }, ['🖨️ Print-ready packet'])
    ]),
    el('p', { class: 'card-sub', style: 'margin-top:10px;font-size:12px;opacity:.75' },
      ['Created by a Driver Navigator for the Driver Navigator.'])
  ]);
}

function rowItem(it) {
  return el('button', {
    class: 'row-item', type: 'button', style: 'width:100%;background:none;border-left:0;border-right:0;border-bottom:0;cursor:pointer;text-align:left;font-family:inherit;color:inherit',
    onclick: it.onClick || function () {}
  }, [
    el('span', { class: 'thumb' }, [it.icon || '•']),
    el('span', { class: 'grow' }, [
      el('span', { class: 't', style: 'display:block' }, [it.title]),
      el('span', { class: 's', style: 'display:block' }, [it.sub])
    ]),
    it.badge ? el('span', { class: 'badge ' + (it.tone || '') }, [it.badge]) : null
  ].filter(Boolean));
}

/* ------------------------------ PLAYBOOK ------------------------------ */

function toggleItem(id) {
  const on = !isTicked(id);
  if (on) state.newHire.ticks[id] = todayISO();
  else delete state.newHire.ticks[id];
  save();
  render();
  if (on) {
    const it = ALL_ITEMS.find((x) => x.id === id);
    toast(it ? 'Ticked: ' + it.label.slice(0, 46) : 'Ticked');
  }
}

function renderPlaybook() {
  const frag = el('div');
  const pp = playbookProgress();
  frag.appendChild(pageTitle(
    'Your first 90 days',
    pp.done + ' of ' + pp.total + ' steps done · the Navigator Program, in the order it actually happens',
    el('button', { class: 'btn sm', type: 'button', onclick: () => { state.ui.sheet = 'checklist'; go('print'); } }, ['🖨️ Print'])
  ));

  frag.appendChild(el('div', { class: 'card' }, [
    el('div', { style: 'display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:var(--muted)' }, [
      el('span', {}, ['Program progress']),
      el('span', {}, [pp.pct + '%'])
    ]),
    meterNode(pp.pct, pp.pct === 100 ? 'good' : pp.pct >= 40 ? 'mid' : ''),
    el('p', { class: 'card-sub', style: 'margin-top:10px' }, [
      'Tick things off as they happen — the date is saved with each one, and the print sheet shows exactly ' +
      'where you are. Your Navigator sees the same list on their own phone.'])
  ]));

  PHASES.forEach((ph) => {
    const pr = phaseProgress(ph);
    const box = el('div', { class: 'phase' + (pr.done === pr.total ? ' done' : '') });
    box.appendChild(el('div', { class: 'phase-head' }, [
      el('div', { class: 'phase-num' }, [pr.done === pr.total ? '✓' : ph.num]),
      el('div', { style: 'flex:1;min-width:0' }, [
        el('div', { class: 'phase-name' }, [ph.name]),
        el('div', { class: 'phase-when' }, [ph.when])
      ]),
      el('span', { class: 'badge ' + (pr.done === pr.total ? 'ok' : pr.done ? 'draft' : 'tbd') }, [pr.done + '/' + pr.total])
    ]));

    if (state.ui.pbOpen[ph.id] === false) {
      /* collapsed */
    } else {
      const body = el('div', { class: 'phase-body' });
      ph.items.forEach((it) => {
        const on = isTicked(it.id);
        body.appendChild(el('div', { class: 'pb-item' + (on ? ' on' : '') }, [
          el('button', {
            class: 'tick', type: 'button', 'aria-label': (on ? 'Untick ' : 'Tick ') + it.label,
            onclick: () => toggleItem(it.id)
          }, ['✓']),
          el('div', { class: 'ptxt' }, [
            el('div', { class: 'plabel' }, [it.label]),
            el('div', { class: 'pwhy' }, [it.why]),
            on ? el('div', { class: 'pmeta' }, ['✓ ' + fmtDate(state.newHire.ticks[it.id])]) : null
          ].filter(Boolean))
        ]));
      });
      box.appendChild(body);
    }
    frag.appendChild(box);
  });

  /* the four values */
  const vc = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['🧭 The four values you are measured against']),
    el('p', { class: 'card-sub' }, ['Straight out of the Navigator packet. These are the words used in your review.'])
  ]);
  const vg = el('div', { class: 'values-grid' });
  VALUES.forEach((v) => vg.appendChild(el('div', { class: 'val-card' }, [
    el('b', {}, [v.name]), el('p', {}, [v.text])
  ])));
  vc.appendChild(vg);
  frag.appendChild(vc);

  /* sign-off */
  frag.appendChild(el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['✍️ Until it is signed, it did not happen']),
    el('p', { class: 'card-sub' }, [
      'When the program is complete, sign the packet and submit it to your HR Business Partner: ' +
      'mentee, Navigator, Operations Leader and the date. The print sheet has the signature block on it.']),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('button', { class: 'btn primary', type: 'button', onclick: () => { state.ui.sheet = 'checklist'; go('print'); } }, ['🖨️ Print my checklist'])
    ])
  ]));

  return frag;
}

/* ------------------------------ BENEFITS ------------------------------ */

function renderBenefits() {
  const frag = el('div');
  const isNav = state.role === 'nav';
  frag.appendChild(pageTitle(
    'The good stuff',
    isNav ? 'Real numbers, straight from the HR documents — confirm them for your own location'
          : 'What U.S. AutoForce actually pays for. Real numbers, in plain English.',
    el('button', { class: 'btn sm', type: 'button', onclick: () => { state.ui.sheet = 'onepager'; go('print'); } }, ['🖨️ Print'])
  ));

  /* the hero money line */
  const mg = el('div', { class: 'money-grid' });
  MONEY_TILES.forEach((t) => {
    mg.appendChild(el('div', { class: 'money gold' }, [
      el('div', { class: 'mtop' }, [el('span', { class: 'mi' }, [t.icon]), el('span', { class: 'mcap' }, [t.cap])]),
      el('strong', {}, [t.big]),
      el('span', { class: 'mlab' }, [t.lab])
    ]));
  });
  frag.appendChild(mg);

  if (isNav) {
    const locId = selectedLocId();
    const pickCard = el('div', { class: 'card' });
    pickCard.appendChild(el('label', { class: 'field-label', style: 'display:block;margin-bottom:6px' }, ['CONFIRMING FOR']));
    pickCard.appendChild(locPicker(() => { state.ui.openProg = {}; render(); }));
    const loc = locById(locId);
    const pr = locProgress(locId);
    pickCard.appendChild(el('div', { style: 'display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);font-weight:600;margin-top:10px' }, [
      el('span', {}, [pr.done + ' of ' + pr.total + ' confirmed']),
      el('span', {}, [pr.pct + '%'])
    ]));
    pickCard.appendChild(meterNode(pr.pct, pr.pct === 100 ? 'good' : pr.pct >= 50 ? 'mid' : ''));
    pickCard.appendChild(el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('span', { class: 'badge ' + (loc && loc.published ? 'pub' : 'draft') }, [loc && loc.published ? 'PUBLISHED' : 'DRAFT']),
      el('button', {
        class: 'btn sm', type: 'button',
        onclick: () => { state.ui.sheet = 'location'; go('print'); }
      }, ['Preview location sheet']),
      el('button', { class: 'btn sm', type: 'button', onclick: () => copySummary(locId) }, ['Copy summary'])
    ]));
    frag.appendChild(pickCard);
  }

  frag.appendChild(chips(CATS, state.ui.cat, (id) => { state.ui.cat = id; state.ui.openProg = {}; render(); }));

  const list = PROGRAMS.filter((p) => state.ui.cat === 'all' || p.cat === state.ui.cat);
  const grid = el('div', { class: 'ben-grid' });
  list.forEach((p) => grid.appendChild(progCard(p, isNav)));
  frag.appendChild(grid);

  /* confirm-with-HR note */
  const todo = PROGRAMS.filter((p) => p.confirm);
  if (todo.length) {
    const c = el('div', { class: 'card' });
    c.appendChild(el('div', { class: 'card-head' }, [
      el('h3', { class: 'card-title' }, ['❓ Still needs HR']),
      el('span', { class: 'badge tbd' }, [todo.length + ' OPEN'])
    ]));
    c.appendChild(el('p', { class: 'card-sub' }, ['These are real benefits, but the document set does not publish the number yet. Nobody is guessing in front of a new hire.']));
    todo.forEach((p) => {
      c.appendChild(el('div', { class: 'row-item' }, [
        el('span', { class: 'thumb' }, [p.icon]),
        el('span', { class: 'grow' }, [
          el('span', { class: 't', style: 'display:block' }, [p.name]),
          el('span', { class: 's', style: 'display:block' }, [p.confirmNote || 'Needs a confirmed number'])
        ])
      ]));
    });
    frag.appendChild(c);
  }

  /* where these numbers come from */
  const src = el('div', { class: 'card' });
  src.appendChild(el('h3', { class: 'card-title' }, ['📄 Where these numbers come from']));
  src.appendChild(el('p', { class: 'card-sub' }, ['Every dollar figure in this app is transcribed from the HR documents below — nothing is rounded, estimated or invented.']));
  Object.keys(SOURCES).forEach((k) => {
    src.appendChild(el('div', { style: 'display:flex;gap:8px;padding:7px 0;border-top:1px solid var(--line);font-size:12px' }, [
      el('span', { style: 'color:var(--muted);font-weight:800;width:88px;flex-shrink:0' }, [k.toUpperCase()]),
      el('span', {}, [SOURCES[k]])
    ]));
  });
  frag.appendChild(src);

  return frag;
}

function progCard(p, isNav) {
  const locId = selectedLocId();
  const v = getVal(locId, p.id);
  const open = !!state.ui.openProg[p.id];
  const card = el('div', { class: 'ben' + (p.hero ? ' hero-ben' : '') + (open ? ' open' : '') });

  const head = el('button', { class: 'ben-head', type: 'button' }, [
    el('span', { class: 'thumb' }, [p.icon]),
    el('span', { style: 'flex:1;min-width:0' }, [
      el('span', { class: 'bname', style: 'display:block' }, [p.name]),
      el('span', { class: 'bval', style: 'display:block' }, [p.value]),
      el('span', { class: 'bsrc', style: 'display:block' }, [p.unit + (p.confirm ? ' · needs HR number' : '')])
    ]),
    isNav ? statusBadge(locId, p.id) : null,
    el('span', { style: 'color:#cbd5e1;font-size:16px' }, [open ? '▾' : '▸'])
  ].filter(Boolean));
  head.addEventListener('click', () => {
    state.ui.openProg[p.id] = !open;
    render();
  });
  card.appendChild(head);

  const body = el('div', { class: 'body' });
  body.appendChild(el('p', { class: 'bdetail' }, [p.detail]));
  body.appendChild(el('span', { class: 'blabel' }, ['Who gets it']));
  body.appendChild(el('p', { class: 'brow' }, [p.who]));
  body.appendChild(el('span', { class: 'blabel' }, ['How to get it']));
  body.appendChild(el('p', { class: 'brow' }, [p.how]));
  body.appendChild(el('p', { class: 'bsrc' }, ['Source: ' + p.source]));

  if (isNav) {
    /* the confirmation layer — this is what keeps HR honest */
    const amount = el('input', { type: 'text', value: v.amount, placeholder: p.value + ' (' + p.unit + ')' });
    const elig = el('input', { type: 'text', value: v.eligibility, placeholder: p.who });
    const claim = el('input', { type: 'text', value: v.claim, placeholder: p.how });
    const conf = el('input', { type: 'text', value: v.confirmedBy, placeholder: 'Name of whoever confirmed this' });

    const commit = () => {
      setVal(locId, p.id, {
        amount: amount.value.trim(),
        eligibility: elig.value.trim(),
        claim: claim.value.trim(),
        status: v.status === 'confirmed' ? 'draft' : v.status
      });
    };
    [amount, elig, claim].forEach((inp) => inp.addEventListener('change', commit));

    const effWrap = el('div');
    effWrap.appendChild(dateSelects(v.effective, (iso) => { setVal(locId, p.id, { effective: iso, status: 'draft' }); toast('Effective date saved'); }));

    body.appendChild(el('div', { style: 'border-top:1px dashed var(--line);margin-top:12px;padding-top:11px' }, [
      el('span', { class: 'blabel', style: 'margin-top:0' }, ['CONFIRM FOR THIS LOCATION']),
      el('div', { class: 'field' }, [el('label', {}, ['Amount & unit *']), amount]),
      el('div', { class: 'field' }, [el('label', {}, ['Who is eligible *']), elig]),
      el('div', { class: 'field' }, [el('label', {}, ['How they claim / enroll *']), claim]),
      el('div', { class: 'grid2' }, [
        el('div', { class: 'field' }, [el('label', {}, ['Effective date']), effWrap]),
        el('div', { class: 'field' }, [el('label', {}, ['Confirmed by']), conf])
      ]),
      el('div', { class: 'actions' }, [
        el('button', {
          class: 'btn ' + (v.status === 'confirmed' ? '' : 'primary'), type: 'button',
          onclick: () => {
            commit();
            const cur = getVal(locId, p.id);
            if (!cur.amount.trim() || !cur.eligibility.trim() || !cur.claim.trim()) {
              toast('Fill amount, eligibility and how-to-claim first');
              return;
            }
            const who = conf.value.trim() || 'Navigator';
            setVal(locId, p.id, { status: 'confirmed', confirmedBy: who, confirmedAt: nowISO() });
            save(true);
            toast('Confirmed — ' + who);
            render();
          }
        }, [v.status === 'confirmed' ? '✓ Confirmed' : '✓ Mark confirmed']),
        el('button', {
          class: 'btn sm', type: 'button',
          onclick: () => {
            if (!confirm('Clear the values for ' + p.name + ' at this location?')) return;
            delete state.values[vKey(locId, p.id)];
            save(true);
            render();
          }
        }, ['Clear'])
      ].concat(v.updatedAt ? [el('span', { style: 'font-size:10.5px;color:var(--muted);align-self:center' }, ['Updated ' + fmtWhen(v.updatedAt)])] : [])),
      v.status === 'confirmed' && v.confirmedBy
        ? el('p', { style: 'font-size:11px;color:var(--green);margin:8px 0 0' }, ['Confirmed by ' + v.confirmedBy + (v.confirmedAt ? ' on ' + fmtDate(v.confirmedAt) : '')])
        : null
    ].filter(Boolean)));
  }

  card.appendChild(body);
  return card;
}

/* ------------------------------ POLICIES ------------------------------ */

function renderPolicies() {
  const frag = el('div');
  frag.appendChild(pageTitle(
    'The rules that actually matter',
    'Plain English, with the policy language behind it. Seven cards, no lawyer required.',
    el('button', { class: 'btn sm', type: 'button', onclick: () => { state.ui.sheet = 'policies'; go('print'); } }, ['🖨️ Print'])
  ));

  frag.appendChild(el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['🧭 The four values']),
    el('p', { class: 'card-sub' }, ['The Navigator Program is built on these. So is your review.'])
  ]));
  const vg = el('div', { class: 'values-grid', style: 'margin-bottom:12px' });
  VALUES.forEach((v) => vg.appendChild(el('div', { class: 'val-card card' }, [
    el('b', {}, [v.name]), el('p', {}, [v.text])
  ])));
  frag.appendChild(vg);

  const grid = el('div', { class: 'pol-grid' });
  POLICIES.forEach((po) => {
    const open = !!state.ui.polOpen[po.id];
    const card = el('div', { class: 'pol' + (open ? ' open' : '') });
    const head = el('button', { class: 'pol-head', type: 'button' }, [
      el('span', { class: 'thumb' }, [po.icon]),
      el('span', { style: 'flex:1;min-width:0' }, [
        el('span', { class: 'pol-title', style: 'display:block' }, [po.title]),
        el('span', { class: 'pol-one', style: 'display:block' }, [po.one])
      ]),
      el('span', { style: 'color:#cbd5e1;font-size:16px' }, [open ? '▾' : '▸'])
    ]);
    head.addEventListener('click', () => { state.ui.polOpen[po.id] = !open; render(); });
    card.appendChild(head);

    const body = el('div', { class: 'pol-body' });
    body.appendChild(el('div', { class: 'bigline' }, [po.big]));
    const ul = el('ul');
    po.points.forEach((pt) => ul.appendChild(el('li', {}, [pt])));
    body.appendChild(ul);
    body.appendChild(el('p', { class: 'card-sub', style: 'margin-top:9px;font-size:10.5px' }, ['Source: ' + po.source]));
    card.appendChild(body);
    grid.appendChild(card);
  });
  frag.appendChild(grid);

  /* speak up — the one you can actually do something with tonight */
  frag.appendChild(el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['🛡️ If you ever need to report something']),
    el('p', { class: 'card-sub' }, ['Navex Global runs the anonymous line, 24 hours a day, 7 days a week.']),
    el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px' }, [
      el('a', { class: 'btn primary sm', href: 'tel:' + SPEAKUP.phone.replace(/[^\d+]/g, '') }, ['📞 ' + SPEAKUP.phone]),
      el('a', { class: 'btn sm', href: SPEAKUP.web, target: '_blank', rel: 'noopener' }, ['🌐 reportlineweb.com'])
    ]),
    el('p', { class: 'card-sub', style: 'margin-top:10px' }, ['Anonymous reports are fine. Retaliation against anyone who reports in good faith is a firing offense.'])
  ]));

  return frag;
}

/* ------------------------------ RIDES ------------------------------ */

function renderRides() {
  const frag = el('div');
  frag.appendChild(pageTitle(
    'Ride-alongs & HR questions',
    'What you briefed, where, and what still needs an answer',
    el('button', {
      class: 'btn primary sm', type: 'button',
      onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); }
    }, ['+ Log ride'])
  ));

  if (state.locations.length) {
    frag.appendChild(el('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px' }, [
      el('span', { style: 'font-size:11.5px;font-weight:700;color:var(--muted)' }, ['SHOW']),
      filterSelect([{ v: '', t: 'All locations' }].concat(state.locations.map((l) => ({ v: l.id, t: l.name }))),
        state.ui.rideFilter, (v) => { state.ui.rideFilter = v; render(); }, 'Filter ride-alongs')
    ]));
  }

  const qOpen = openQuestions(state.ui.rideFilter || undefined);
  if (qOpen.length) {
    const qc = el('div', { class: 'card' });
    qc.appendChild(el('div', { class: 'card-head' }, [
      el('h3', { class: 'card-title' }, ['Open questions for HR']),
      el('span', { class: 'badge open' }, [qOpen.length + ' OPEN'])
    ]));
    qOpen.forEach((q) => {
      const l = locById(q.locId);
      qc.appendChild(el('div', { class: 'row-item' }, [
        el('span', { class: 'thumb' }, ['❓']),
        el('span', { class: 'grow' }, [
          el('span', { class: 't', style: 'display:block' }, [q.text]),
          el('span', { class: 's', style: 'display:block' }, [(l ? l.name : 'Unknown') + ' · ' + fmtDate(String(q.createdAt || '').slice(0, 10))])
        ]),
        el('button', {
          class: 'btn sm', type: 'button',
          onclick: () => {
            q.answered = true; q.answeredAt = nowISO();
            save(true); toast('Marked answered'); render();
          }
        }, ['Answered'])
      ]));
    });
    frag.appendChild(qc);
  }

  if (!state.rides.length) {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['🚛']),
        el('p', {}, ['No ride-alongs logged yet. Log one to track which programs each location has been briefed on.']),
        el('button', {
          class: 'btn primary', type: 'button',
          onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); }
        }, ['+ Log ride-along'])
      ])
    ]));
    return frag;
  }

  const sorted = state.rides.slice()
    .filter((r) => !state.ui.rideFilter || r.locId === state.ui.rideFilter)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  sorted.forEach((r) => {
    const l = locById(r.locId);
    const covered = (r.covered || []).length;
    const open = (r.questions || []).filter((q) => !q.answered).length;
    const card = el('div', { class: 'card' });

    card.appendChild(el('div', { class: 'card-head' }, [
      el('div', { style: 'display:flex;align-items:center;gap:10px;min-width:0' }, [
        el('span', { class: 'thumb' }, ['🚛']),
        el('div', { style: 'min-width:0' }, [
          el('h3', { class: 'card-title', style: 'display:block' }, [l ? l.name : 'Unknown location']),
          el('p', { class: 'card-sub' }, [fmtDate(r.date) + (r.drivers ? ' · ' + r.drivers : '')])
        ])
      ]),
      el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end' }, [
        open ? el('span', { class: 'badge open' }, [open + ' OPEN']) : null,
        el('span', { class: 'badge ' + (covered === PROGRAMS.length ? 'ok' : 'draft') }, [covered + '/' + PROGRAMS.length + ' COVERED'])
      ].filter(Boolean))
    ]));

    const chipWrap = el('div', { style: 'display:flex;flex-wrap:wrap;gap:5px;margin-top:2px' });
    PROGRAMS.forEach((p) => {
      const on = (r.covered || []).includes(p.id);
      chipWrap.appendChild(el('span', {
        class: 'badge ' + (on ? 'ok' : ''), title: p.name
      }, [p.icon + ' ' + p.name]));
    });
    card.appendChild(chipWrap);

    if (r.notes) card.appendChild(el('p', { style: 'font-size:12.5px;color:var(--muted);margin:10px 0 0;line-height:1.4' }, [r.notes]));

    (r.questions || []).forEach((q) => {
      if (q.answered) return;
      card.appendChild(el('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px;background:var(--amber-soft);border-radius:9px;padding:8px 10px' }, [
        el('span', { style: 'font-size:13px' }, ['❓']),
        el('span', { style: 'flex:1;font-size:12.5px;color:#7c2d12' }, [q.text]),
        el('button', {
          class: 'btn sm', type: 'button',
          onclick: () => { q.answered = true; q.answeredAt = nowISO(); save(true); render(); }
        }, ['Answered'])
      ]));
    });

    card.appendChild(el('div', { style: 'display:flex;gap:8px;margin-top:10px' }, [
      el('button', { class: 'btn sm', type: 'button', onclick: () => openRideModal(r) }, ['✎ Edit']),
      el('button', {
        class: 'btn sm danger', type: 'button',
        onclick: () => {
          if (!confirm('Delete this ride-along?')) return;
          state.rides = state.rides.filter((x) => x.id !== r.id);
          state.questions = state.questions.filter((q) => q.rideId !== r.id);
          save(true); toast('Deleted'); render();
        }
      }, ['Delete'])
    ]));

    frag.appendChild(card);
  });

  return frag;
}

/* ------------------------------ PRINT ------------------------------ */

const SHEETS = [
  { id: 'onepager', label: 'The good stuff (1 page)', sub: 'Benefits, real numbers, one page' },
  { id: 'checklist', label: '90-day checklist', sub: 'Navigator Program + signatures' },
  { id: 'policies', label: 'Policy essentials', sub: 'The rules, one page' },
  { id: 'location', label: 'Location sheet', sub: 'Confirmed values for one terminal' },
  { id: 'packet', label: 'Full packet', sub: 'All of the above, in order' },
  { id: 'huddle', label: 'Safety huddle', sub: 'This week\'s topic, letter size' },
  { id: 'hr', label: 'HR summary (3 pages)', sub: 'Hand this one to HR — what it is, the numbers, the asks' }
];

function isoWeekNow() {
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yStart) / 86400000 + 1) / 7);
}

function renderPrint() {
  const frag = el('div');
  const sheet = state.ui.sheet || 'onepager';
  frag.appendChild(pageTitle(
    'Print',
    'Every sheet is letter size and prints clean — paper for the folder, PDF for the email',
    el('button', {
      class: 'btn primary sm', type: 'button',
      onclick: () => window.print()
    }, ['🖨️ Print / Save PDF'])
  ));

  if (state.role === 'nav') {
    const chipsWrap = el('div', { class: 'chips no-print' });
    SHEETS.forEach((s) => {
      chipsWrap.appendChild(el('button', {
        type: 'button', class: 'chip' + (sheet === s.id ? ' on' : ''),
        onclick: () => { state.ui.sheet = s.id; render(); }
      }, [s.label]));
    });
    frag.appendChild(chipsWrap);
  } else {
    /* new-hire view gets a simpler two-button choice */
    const chipsWrap = el('div', { class: 'chips no-print' });
    [{ id: 'onepager', label: '💛 The good stuff' }, { id: 'checklist', label: '🗓️ My 90 days' },
     { id: 'policies', label: '🦺 The rules' }, { id: 'huddle', label: '🛡️ Safety huddle' }]
      .forEach((s) => chipsWrap.appendChild(el('button', {
        type: 'button', class: 'chip' + (sheet === s.id ? ' on' : ''),
        onclick: () => { state.ui.sheet = s.id; render(); }
      }, [s.label])));
    frag.appendChild(chipsWrap);
  }

  const meta = SHEETS.find((s) => s.id === sheet);
  if (meta) {
    frag.appendChild(el('p', { class: 'card-sub no-print', style: 'margin:-4px 0 12px' }, [meta.sub]));
  }

  if (sheet === 'huddle') {
    frag.appendChild(el('p', { class: 'huddle-scroll-note no-print' }, [
      'The huddle is a letter-size sheet — scroll sideways to read it, or open the full page.'
    ]));
    frag.appendChild(el('div', { class: 'huddle-wrap no-print' }, [
      el('iframe', {
        id: 'huddleFrame', class: 'huddle-frame',
        src: 'safety-huddle.html?week=' + isoWeekNow(),
        title: 'Safety huddle generator', loading: 'eager'
      })
    ]));
    frag.appendChild(el('div', { class: 'no-print', style: 'margin-top:10px' }, [
      el('button', { class: 'btn sm', type: 'button', onclick: () => window.open('safety-huddle.html?week=' + isoWeekNow(), '_blank') }, ['Open full page ↗'])
    ]));
    return frag;
  }

  const shell = el('div', { class: 'report-shell' });

  if (sheet === 'location') {
    const pick = el('div', { class: 'no-print', style: 'margin-bottom:12px' });
    pick.appendChild(el('label', { class: 'field-label', style: 'display:block;margin-bottom:6px' }, ['LOCATION']));
    pick.appendChild(locPicker(() => render()));
    pick.appendChild(el('div', { style: 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap' }, [
      el('button', { class: 'btn sm', type: 'button', onclick: () => copySummary(selectedLocId()) }, ['Copy summary text'])
    ]));
    shell.appendChild(pick);
    if (state.locations.length) shell.appendChild(buildLocationSheet(selectedLocId()));
    else shell.appendChild(el('div', { class: 'card no-print' }, [
      el('div', { class: 'empty' }, [el('div', { class: 'big' }, ['🖨️']), el('p', {}, ['Add a location and confirm its values to generate a sheet.'])])
    ]));
  } else if (sheet === 'packet') {
    shell.appendChild(buildOnePager());
    shell.appendChild(buildChecklist());
    shell.appendChild(buildPolicySheet());
    if (state.locations.length) shell.appendChild(buildLocationSheet(selectedLocId()));
  } else if (sheet === 'checklist') {
    shell.appendChild(buildChecklist());
  } else if (sheet === 'policies') {
    shell.appendChild(buildPolicySheet());
  } else if (sheet === 'hr') {
    shell.appendChild(buildHrSummary());
  } else {
    shell.appendChild(buildOnePager());
  }

  frag.appendChild(shell);
  return frag;
}

/* ---- sheet: the good stuff ---- */
function sheetHead(title, sub) {
  return el('div', { class: 'sheet-head' }, [
    el('img', { src: 'icons/logo-tile.png', alt: 'U.S. AutoForce' }),
    el('div', {}, [
      el('h3', {}, [title]),
      el('p', {}, [sub])
    ])
  ]);
}

function buildOnePager() {
  const sheet = el('div', { class: 'sheet' });
  const nh = state.newHire;
  sheet.appendChild(sheetHead('The good stuff — driver benefits at a glance',
    'U.S. AutoForce · Field Operations' + (nh.location ? ' · ' + nh.location : '') + ' · every number from the HR documents'));

  const ml = el('div', { class: 'moneyline' });
  MONEY_TILES.forEach((t) => {
    ml.appendChild(el('div', {}, [el('b', {}, [t.big]), el('span', {}, [t.cap])]));
  });
  sheet.appendChild(ml);

  const table = el('table');
  table.appendChild(el('thead', {}, [el('tr', {}, [
    el('th', { style: 'width:21%' }, ['BENEFIT']),
    el('th', { style: 'width:19%' }, ['WHAT YOU GET']),
    el('th', { style: 'width:28%' }, ['WHO IS ELIGIBLE']),
    el('th', { style: 'width:32%' }, ['HOW TO GET IT'])
  ])]));
  const tb = el('tbody');
  PROGRAMS.forEach((p) => {
    tb.appendChild(el('tr', {}, [
      el('td', { class: 'k' }, [p.name]),
      el('td', {}, [el('b', {}, [p.value]), el('br'), el('span', { style: 'font-size:8px;color:#64748b' }, [p.unit])]),
      el('td', {}, [p.who]),
      el('td', {}, [p.how])
    ]));
  });
  table.appendChild(tb);
  sheet.appendChild(table);

  sheet.appendChild(el('h4', {}, ['The rules that matter on day one']));
  sheet.appendChild(el('p', { class: 'note' }, [
    'Branded shirt, hi-vis, and steel-toe or composite boots (ASTM F2413-18) every shift. G.O.A.L. — Get Out And Look — ' +
    'before every backing maneuver; a backup camera does not replace it. Never handle a phone while the truck is in motion. ' +
    'Report every incident, no matter how small. Request time off two weeks ahead in Workday.'
  ]));

  sheet.appendChild(el('h4', {}, ['Who to call']));
  const c = el('div', { class: 'contacts' });
  PEOPLE.forEach((p) => c.appendChild(el('div', {}, [
    el('b', {}, [p.name]), el('span', { style: 'color:#2563eb;font-weight:700;font-size:8.5px' }, [p.role]),
    el('div', {}, [p.phone + ' · ' + p.email])
  ])));
  c.appendChild(el('div', {}, [
    el('b', {}, ['Speak Up (Navex, 24/7)']), el('span', { style: 'color:#2563eb;font-weight:700;font-size:8.5px' }, ['ANONYMOUS REPORTING']),
    el('div', {}, [SPEAKUP.phone + ' · reportlineweb.com/usventure'])
  ]));
  sheet.appendChild(c);

  const open = PROGRAMS.filter((p) => p.confirm);
  if (open.length) {
    sheet.appendChild(el('p', { class: 'note', style: 'margin-top:8px' }, [
      'Still being confirmed by HR: ' + open.map((p) => p.name).join(', ') + '. Everything else on this sheet is a published figure.'
    ]));
  }

  sheet.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Summary of benefits — not the plan document. Created by a Driver Navigator for the Driver Navigator.']),
    el('span', {}, ['Printed ' + fmtDate(todayISO())])
  ]));
  return sheet;
}

/* ---- sheet: 90-day checklist ---- */
function buildChecklist() {
  const sheet = el('div', { class: 'sheet' });
  const nh = state.newHire;
  const day = hireDay();
  const pp = playbookProgress();

  sheet.appendChild(sheetHead('Navigator Program — 90-day checklist',
    [nh.name || 'New hire', nh.department, nh.location].filter(Boolean).join(' · ') +
    (day ? ' · Day ' + day + ' of 90' : '') + ' · ' + pp.done + ' of ' + pp.total + ' complete'));

  const table = el('table', { class: 'pb-print' });
  table.appendChild(el('thead', {}, [el('tr', {}, [
    el('th', { style: 'width:24px' }, ['✓']),
    el('th', {}, ['STEP']),
    el('th', { style: 'width:26%' }, ['WHY IT MATTERS']),
    el('th', { style: 'width:70px' }, ['DATE'])
  ])]));
  const tb = el('tbody');
  PHASES.forEach((ph) => {
    const pr = phaseProgress(ph);
    tb.appendChild(el('tr', { class: 'grp' }, [
      el('td', { colspan: '4' }, [ph.num + ' · ' + ph.name + ' — ' + ph.when + '  (' + pr.done + '/' + pr.total + ')'])
    ]));
    ph.items.forEach((it) => {
      const on = isTicked(it.id);
      tb.appendChild(el('tr', {}, [
        el('td', { class: 'chk' }, [on ? '✓' : '']),
        el('td', {}, [it.label]),
        el('td', { style: 'font-size:8px;color:#475569' }, [it.why]),
        el('td', { style: 'font-size:8px' }, [on ? fmtDate(state.newHire.ticks[it.id]) : ''])
      ]));
    });
  });
  table.appendChild(tb);
  sheet.appendChild(table);

  sheet.appendChild(el('h4', {}, ['The four U.S. Venture values']));
  sheet.appendChild(el('p', { class: 'note' }, [VALUES.map((v) => v.name).join(' · ') +
    '. These are the words used in your 90-day review.']));

  sheet.appendChild(el('h4', {}, ['Sign-off — submit to your HR Business Partner']));
  sheet.appendChild(el('div', { class: 'sigs' }, [
    el('div', {}, [el('div', { class: 'ln' }), 'Mentee (new hire)']),
    el('div', {}, [el('div', { class: 'ln' }), 'Navigator']),
    el('div', {}, [el('div', { class: 'ln' }), 'Operations Leader']),
    el('div', {}, [el('div', { class: 'ln' }), 'Date'])
  ]));

  sheet.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Navigator Program Onboarding Packet · ' + (nh.navigator ? 'Navigator: ' + nh.navigator : 'Created by a Driver Navigator for the Driver Navigator.')]),
    el('span', {}, ['Printed ' + fmtDate(todayISO())])
  ]));
  return sheet;
}

/* ---- sheet: policy essentials ---- */
function buildPolicySheet() {
  const sheet = el('div', { class: 'sheet' });
  sheet.appendChild(sheetHead('Policy essentials',
    'The short version of every policy in the new-hire folder — full documents on request from HR'));

  POLICIES.forEach((p) => {
    sheet.appendChild(el('h4', {}, [p.title]));
    sheet.appendChild(el('p', { class: 'note', style: 'font-weight:700;color:#111827;margin:0 0 4px' }, [p.big]));
    const ul = el('ul', { style: 'margin:2px 0 6px;padding-left:14px' });
    p.points.slice(0, 5).forEach((pt) => ul.appendChild(el('li', { style: 'font-size:8.5px;line-height:1.4;margin-bottom:2px' }, [pt])));
    sheet.appendChild(ul);
    sheet.appendChild(el('p', { style: 'font-size:7.5px;color:#94a3b8;margin:0 0 4px' }, ['Source: ' + p.source]));
  });

  sheet.appendChild(el('h4', {}, ['Speak Up — anonymous, 24/7']));
  sheet.appendChild(el('p', { class: 'note' }, [
    'Navex Global: ' + SPEAKUP.phone + ' · ' + SPEAKUP.web + ' · ' + SPEAKUP.email +
    ' (include "U.S. Venture, Inc." in the email). Retaliation against anyone who reports in good faith is prohibited and is grounds for termination.'
  ]));

  sheet.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Plain-English summary, prepared for the Navigator Program. The policy document controls.']),
    el('span', {}, ['Printed ' + fmtDate(todayISO())])
  ]));
  return sheet;
}

/* ---- sheet: location ---- */
/* ---- sheet: HR summary (3 pages, the handout) ---- */
function hrH(cols, rows, widths) {
  const table = el('table');
  table.appendChild(el('thead', {}, [el('tr', {}, cols.map((c, i) =>
    el('th', { style: 'width:' + (widths[i] || 'auto') }, [c])))]));
  const tb = el('tbody');
  rows.forEach((r) => tb.appendChild(el('tr', {}, r.map((cell, i) =>
    i === 0 ? el('td', { class: 'k' }, [cell]) : el('td', {}, [cell])))));
  table.appendChild(tb);
  return table;
}

function hrBullets(items, style) {
  const ul = el('ul', { style: 'margin:2px 0 6px;padding-left:14px;' + (style || '') });
  items.forEach((t) => ul.appendChild(el('li', { style: 'font-size:9px;line-height:1.45;margin-bottom:3px' }, [t])));
  return ul;
}

function hrH2(txt) {
  return el('h4', { style: 'font-size:10.5px;margin:12px 0 4px' }, [txt]);
}

function buildHrSummary() {
  const frag = document.createDocumentFragment();
  const nh = state.newHire;
  const done = playbookProgress();
  const todo = PROGRAMS.filter((p) => p.confirm);

  /* ------------------------------------------------------------------ page 1 */
  const p1 = el('div', { class: 'sheet sheet-page' });
  p1.appendChild(sheetHead('Navigator Hub — the first 90 days, in one place',
    'Prepared for HR leadership · U.S. AutoForce Field Operations · ' + fmtDate(todayISO())));

  p1.appendChild(hrH2('THE SHORT VERSION'));
  p1.appendChild(el('p', { class: 'note', style: 'font-size:9.5px;line-height:1.5;margin:0 0 8px' }, [
    'Every new driver gets a folder of benefit and policy documents, and a Navigator who has ninety days to turn ' +
    'that folder into a confident, compliant driver. The folder is good. The problem is that nobody can find anything ' +
    'in it, the benefit values are quoted differently at every terminal, and there is no single record of what actually ' +
    'got covered. The Navigator Hub is that record: one phone-sized app, two views — what the new hire sees, and what ' +
    'the Navigator sees. It runs offline, needs no login, and prints the same sheets we already hand out.'
  ]));

  p1.appendChild(hrH2('WHAT IT ANSWERS IN ONE TAP'));
  const ml = el('div', { class: 'moneyline' });
  MONEY_TILES.forEach((t) => ml.appendChild(el('div', {}, [el('b', {}, [t.icon + ' ' + t.big]), el('span', {}, [t.cap])])));
  p1.appendChild(ml);
  p1.appendChild(el('p', { class: 'note', style: 'margin:0 0 4px' }, [
    'Those four figures are the ones a new driver does not hear in week one. ' + PROGRAMS.length +
    ' benefits are catalogued with the number, who is eligible, how to claim it, and the HR document it came from.'
  ]));

  const two = el('div', { style: 'display:flex;gap:14px;align-items:flex-start;margin-top:8px' });
  const colA = el('div', { style: 'flex:1;min-width:0' });
  colA.appendChild(el('h4', { style: 'font-size:9.5px;margin:0 0 2px' }, ['IN THE NEW HIRE\u2019S VIEW']));
  colA.appendChild(hrBullets([
    'Day X of 90, with the next steps named — not a PDF they have to decode.',
    'Every benefit with the real number and the exact way to claim it.',
    'The seven policies that actually matter, in plain English, with the policy language underneath.',
    'One-tap call buttons for their Navigator, dispatch and HR.',
    'A checklist they tick themselves; each tick is dated and shows up on the printed packet.'
  ]));
  const colB = el('div', { style: 'flex:1;min-width:0' });
  colB.appendChild(el('h4', { style: 'font-size:9.5px;margin:0 0 2px' }, ['IN THE NAVIGATOR\u2019S VIEW']));
  colB.appendChild(hrBullets([
    'Benefit values confirmed per location — with who confirmed them and when.',
    'A Needs Attention list of what is still missing or unpublished.',
    'Ride-along log: which programs were briefed, notes, and questions raised.',
    'Open HR questions, tracked until somebody answers them.',
    'Six print sheets, including a full packet in one click.'
  ]));
  two.appendChild(colA);
  two.appendChild(colB);
  p1.appendChild(two);

  p1.appendChild(hrH2('WHAT IT REPLACES'));
  p1.appendChild(hrH(['Today', 'With the hub'], [
    ['A 90-day packet nobody can search', 'The same checklist on the phone, dated as it happens'],
    ['Benefit values remembered differently at each terminal', 'Values confirmed by HR per location, with an audit trail'],
    ['\u201cI think it is $150\u201d', 'The number, the source document and the page'],
    ['Ride-along notes on paper', 'Logged: programs covered, notes, questions raised'],
    ['HR answering the same five questions every month', 'One list of open questions, asked once']
  ], ['34%', '66%']));

  p1.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Page 1 of 3 · Navigator Hub overview']),
    el('span', {}, ['Created by a Driver Navigator for the Driver Navigator.'])
  ]));
  frag.appendChild(p1);

  /* ------------------------------------------------------------------ page 2 */
  const p2 = el('div', { class: 'sheet sheet-page' });
  p2.appendChild(sheetHead('Every benefit, the number, and where it came from',
    'Nothing on this page is estimated. Each row is transcribed from the document in the source column, ' +
    'and the app shows that source to the driver.'));

  const table = el('table');
  table.appendChild(el('thead', {}, [el('tr', {}, [
    el('th', { style: 'width:22%' }, ['BENEFIT']),
    el('th', { style: 'width:23%' }, ['WHAT YOU GET']),
    el('th', { style: 'width:27%' }, ['WHO IS ELIGIBLE']),
    el('th', { style: 'width:28%' }, ['SOURCE'])
  ])]));
  const tb = el('tbody');
  PROGRAMS.forEach((p) => {
    tb.appendChild(el('tr', {}, [
      el('td', { class: 'k' }, [p.name]),
      el('td', {}, [el('b', {}, [p.value]), el('br'),
        el('span', { style: 'font-size:8px;color:#64748b' }, [p.unit])]),
      el('td', {}, [p.who]),
      el('td', { style: 'font-size:7.8px;color:#475569' }, [p.source])
    ]));
  });
  table.appendChild(tb);
  p2.appendChild(table);

  p2.appendChild(hrH2('THE RULES THAT MATTER ON DAY ONE'));
  p2.appendChild(hrBullets([
    'Branded shirt, hi-vis, and steel-toe or composite boots rated ASTM F2413-18. Every shift.',
    'G.O.A.L. — Get Out And Look — before every backing maneuver. A backup camera does not replace it.',
    'No hand-held phone at any time the vehicle is in motion, at a light, or stopped anywhere that is not a safe parking spot.',
    'Report every incident, no matter how small, at the time or as soon as practical. A review call follows within 72 hours.',
    'Request time off at least two weeks ahead in Workday. Vacation carry-over is capped at 40 hours.',
    'Anything that looks like fraud, theft or a Code of Conduct issue goes to Speak Up — anonymous, 24/7, ' +
      '1-888-275-6188. Retaliation is a firing offense.'
  ]));

  p2.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Page 2 of 3 · Benefit and policy summary — not the plan document']),
    el('span', {}, ['Printed ' + fmtDate(todayISO())])
  ]));
  frag.appendChild(p2);

  /* ------------------------------------------------------------------ page 3 */
  const p3 = el('div', { class: 'sheet sheet-page' });
  p3.appendChild(sheetHead('The 90-day program, the printed sheets, and what we need from HR',
    'The part that makes it a program instead of an app'));

  p3.appendChild(hrH2('THE 90-DAY PROGRAM — ' + ALL_ITEMS.length + ' STEPS IN 8 PHASES'));
  p3.appendChild(hrH(
    ['Phase', 'When', 'Steps', 'What it delivers'],
    PHASES.map((ph) => [
      ph.num + ' · ' + ph.name,
      ph.when,
      String(ph.items.length),
      ph.items.map((i) => i.label).slice(0, 2).join('; ') + (ph.items.length > 2 ? '…' : '')
    ]),
    ['19%', '18%', '8%', '55%']));

  p3.appendChild(hrH2('PRINT-READY SHEETS (LETTER, ONE CLICK FROM THE PHONE)'));
  const sheetList = el('div', { style: 'display:flex;gap:12px' });
  const sc1 = el('div', { style: 'flex:1;min-width:0' });
  sc1.appendChild(hrBullets([
    'Benefit one-pager — every value on a single page',
    '90-day checklist — dated ticks plus the signature block',
    'Policy essentials — the short version of every policy'
  ]));
  const sc2 = el('div', { style: 'flex:1;min-width:0' });
  sc2.appendChild(hrBullets([
    'Location sheet — confirmed values for one terminal',
    'Full packet — all of the above in order',
    'Safety huddle — this week\u2019s topic, letter size'
  ]));
  sheetList.appendChild(sc1);
  sheetList.appendChild(sc2);
  p3.appendChild(sheetList);

  p3.appendChild(hrH2('WHAT WE STILL NEED FROM HR'));
  p3.appendChild(el('p', { class: 'note', style: 'margin:0 0 4px' }, [
    'These are real benefits whose numbers are not published anywhere in the document set. The app says ' +
    '\u201cconfirm with HR\u201d rather than guessing in front of a new hire. Each one is a single answer:'
  ]));
  const asks = [
    ['Walkingspree step goal', 'What is the monthly cash reward, and what is the steps-per-day target?'],
    ['Annual health screen', 'What premium discount does completion earn, and when is this year\u2019s screening window?'],
    ['Driver of the Month', 'What is the RAVE point value, and what does the team lunch cover?'],
    ['Per-location variation', 'Do shoe, uniform or wellness amounts differ by terminal or by union contract — and which terminals have a contract?'],
    ['State accrual rules', 'California, Colorado, Montana and Nebraska carry their own vacation caps in the policy. Which of our terminals fall under a state plan for sick time?']
  ];
  const askTable = el('table');
  askTable.appendChild(el('thead', {}, [el('tr', {}, [
    el('th', { style: 'width:26%' }, ['ITEM']), el('th', {}, ['THE QUESTION'])
  ])]));
  const atb = el('tbody');
  asks.forEach(([k, q]) => atb.appendChild(el('tr', {}, [
    el('td', { class: 'k' }, [k]), el('td', {}, [q])
  ])));
  askTable.appendChild(atb);
  p3.appendChild(askTable);

  p3.appendChild(hrH2('HOW IT RUNS — AND WHY IT IS SAFE TO SAY YES TO'));
  p3.appendChild(hrBullets([
    'One HTML app. Installs to a phone home screen like a normal app, or ships as a signed APK. Works on iPhone through Safari.',
    'No login, no server, no internet connection required after the first load. It cannot go down.',
    'Nothing is transmitted. Benefit values, contacts and ride-along notes stay on the device and move by JSON backup.',
    'No protected health information. The wellness page describes the program; it never stores a claim.',
    'Every record carries an ID, a timestamp and who confirmed it — the same audit habit as the rest of the driver file.'
  ]));

  p3.appendChild(el('div', { style: 'margin-top:12px;border-top:1px solid #cbd5e1;padding-top:8px;font-size:9.5px' }, [
    el('b', {}, ['Prepared by Joshua Wheeler · Driver Trainer / Navigator · (319) 601-2111']),
    el('div', { style: 'color:#475569;margin-top:2px' }, [
      'Working copy today: a live demo with the 90-day program, ' + PROGRAMS.length + ' benefits and all six sheets. ' +
      'The same content powers the printable packet handed to new hires in Fruitland.'
    ])
  ]));

  p3.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Page 3 of 3 · The program, the sheets and the open questions']),
    el('span', {}, ['Created by a Driver Navigator for the Driver Navigator.'])
  ]));
  frag.appendChild(p3);

  return frag;
}

function buildLocationSheet(locId) {
  const l = locById(locId) || { name: '', contacts: {} };
  const pr = locProgress(locId);
  const sheet = el('div', { class: 'sheet' });

  sheet.appendChild(sheetHead('Driver Benefits — ' + l.name,
    [(l.city ? l.city + ', ' : '') + (l.state || ''), l.benefitYear ? 'Benefit year ' + l.benefitYear : '', l.driverCount ? l.driverCount + ' drivers' : '']
      .filter(Boolean).join(' · ')));

  if (pr.done < pr.total) {
    sheet.appendChild(el('div', { class: 'pending' }, ['PENDING — ' + (pr.total - pr.done) + ' of ' + pr.total + ' benefit values still awaiting confirmation for this location']));
  } else {
    sheet.appendChild(el('div', { class: 'done' }, ['COMPLETE — all ' + pr.total + ' benefit values confirmed for this location']));
  }

  const table = el('table');
  table.appendChild(el('thead', {}, [el('tr', {}, [
    el('th', { style: 'width:22%' }, ['BENEFIT']),
    el('th', { style: 'width:22%' }, ['AMOUNT / VALUE']),
    el('th', { style: 'width:28%' }, ['WHO IS ELIGIBLE']),
    el('th', { style: 'width:28%' }, ['HOW TO CLAIM'])
  ])]));
  const tb = el('tbody');
  PROGRAMS.forEach((p) => {
    const v = getVal(locId, p.id);
    tb.appendChild(el('tr', {}, [
      el('td', { class: 'k' }, [p.name]),
      el('td', {}, [v.amount || el('span', { class: 'blankline' }, ['_______________'])]),
      el('td', {}, [v.eligibility || el('span', { class: 'blankline' }, ['_______________'])]),
      el('td', {}, [v.claim || el('span', { class: 'blankline' }, ['_______________'])])
    ]));
  });
  table.appendChild(tb);
  sheet.appendChild(table);

  const cWrap = el('div', { class: 'contacts' });
  CONTACT_ROLES.forEach((role) => {
    const c = (l.contacts && l.contacts[role.id]) || {};
    cWrap.appendChild(el('div', {}, [
      el('b', {}, [c.name || '—']),
      el('span', { style: 'color:#2563eb;font-weight:700;font-size:8.5px' }, [role.label]),
      el('div', {}, [[c.phone, c.email].filter(Boolean).join(' · ')])
    ]));
  });
  const hr = state.newHire;
  if (!l.contacts || !l.contacts.hr || !l.contacts.hr.name) {
    cWrap.appendChild(el('div', {}, [
      el('b', {}, [hr.hr || 'HR Business Partner']),
      el('span', { style: 'color:#2563eb;font-weight:700;font-size:8.5px' }, ['HR Business Partner']),
      el('div', {}, [[hr.hrPhone, hr.hrEmail].filter(Boolean).join(' · ')])
    ]));
  }
  sheet.appendChild(cWrap);

  sheet.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Summary of benefits — not the plan document. Values confirmed by HR.']),
    el('span', {}, ['Generated ' + fmtDate(todayISO())])
  ]));
  return sheet;
}

function copySummary(locId) {
  const l = locById(locId);
  if (!l) { toast('Pick a location first'); return; }
  const lines = ['DRIVER BENEFITS — ' + l.name, ''];
  PROGRAMS.forEach((p) => {
    const v = getVal(locId, p.id);
    lines.push(p.name + ': ' + (v.amount || p.value + ' (' + p.unit + ')'));
    if (v.eligibility) lines.push('  Eligible: ' + v.eligibility);
    if (v.claim) lines.push('  How: ' + v.claim);
  });
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Summary copied'), () => toast('Copy failed'));
  } else {
    toast('Clipboard not available');
  }
}

/* ------------------------------ modals ------------------------------ */

function openModal(title, sub, content, actions) {
  closeModal();
  const back = el('div', { class: 'modal-back', id: 'modalBack' });
  const m = el('div', { class: 'modal' }, [
    el('h3', {}, [title]),
    sub ? el('p', { class: 'msub' }, [sub]) : null,
    content,
    el('div', { class: 'mactions' }, actions)
  ].filter(Boolean));
  back.appendChild(m);
  back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  return m;
}

function closeModal() {
  const b = document.getElementById('modalBack');
  if (b) b.remove();
}

function field(label, input) {
  return el('div', { class: 'field' }, [el('label', {}, [label]), input]);
}

function openHireModal() {
  const nh = state.newHire;
  const name = el('input', { type: 'text', value: nh.name, placeholder: 'Your name' });
  const dept = el('input', { type: 'text', value: nh.department, placeholder: 'Driver' });
  const loc = el('input', { type: 'text', value: nh.location, placeholder: 'Cedar Rapids' });
  const nav = el('input', { type: 'text', value: nh.navigator, placeholder: 'Your Navigator' });
  const navPh = el('input', { type: 'text', value: nh.navigatorPhone, placeholder: '(319) 000-0000' });
  const hrName = el('input', { type: 'text', value: nh.hr, placeholder: 'HR Business Partner' });
  const hrPh = el('input', { type: 'text', value: nh.hrPhone, placeholder: '(913) 000-0000' });
  const startWrap = el('div');
  startWrap.appendChild(dateSelects(nh.startDate, (iso) => { startWrap.dataset.iso = iso; }));

  const content = el('div');
  content.appendChild(field('Your name', name));
  content.appendChild(el('div', { class: 'grid2' }, [field('Department', dept), field('Location', loc)]));
  content.appendChild(field('First day', startWrap));
  content.appendChild(el('div', { style: 'margin:14px 0 6px;font-size:12px;font-weight:800' }, ['Your Navigator']));
  content.appendChild(el('div', { class: 'grid2' }, [field('Name', nav), field('Phone', navPh)]));
  content.appendChild(el('div', { style: 'margin:14px 0 6px;font-size:12px;font-weight:800' }, ['HR Business Partner']));
  content.appendChild(el('div', { class: 'grid2' }, [field('Name', hrName), field('Phone', hrPh)]));

  const saveBtn = el('button', {
    class: 'btn primary', type: 'button',
    onclick: () => {
      nh.name = name.value.trim();
      nh.department = dept.value.trim();
      nh.location = loc.value.trim();
      nh.navigator = nav.value.trim();
      nh.navigatorPhone = navPh.value.trim();
      nh.hr = hrName.value.trim() || 'Veronica Cease';
      nh.hrPhone = hrPh.value.trim();
      nh.startDate = startWrap.dataset.iso !== undefined ? startWrap.dataset.iso : nh.startDate;
      save(true);
      closeModal();
      toast('Saved');
      render();
    }
  }, ['Save']);

  openModal('My details', 'This is what the printed sheets use', content, [
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, ['Cancel']),
    saveBtn
  ]);
}

function openLocationModal(existing) {
  const l = existing || { name: '', city: '', state: '', driverCount: '', benefitYear: '', planStart: '', carriers: '', union: '', contacts: {} };
  const name = el('input', { type: 'text', value: l.name, placeholder: 'e.g. Fruitland' });
  const city = el('input', { type: 'text', value: l.city || '', placeholder: 'Fruitland' });
  const st = el('input', { type: 'text', value: l.state || '', placeholder: 'IA' });
  const count = el('input', { type: 'number', value: l.driverCount || '', placeholder: '24' });
  const year = el('input', { type: 'text', value: l.benefitYear || '', placeholder: '2026' });
  const carriers = el('input', { type: 'text', value: l.carriers || '', placeholder: 'Medical / dental / vision' });
  const union = el('input', { type: 'text', value: l.union || '', placeholder: 'None — or contract name' });

  const content = el('div');
  content.appendChild(field('Location name *', name));
  content.appendChild(el('div', { class: 'grid2' }, [field('City', city), field('State', st)]));
  content.appendChild(el('div', { class: 'grid2' }, [field('Drivers covered', count), field('Benefit year', year)]));
  content.appendChild(field('Carriers', carriers));
  content.appendChild(field('Union / contract', union));

  content.appendChild(el('div', { style: 'margin:14px 0 6px;font-size:12px;font-weight:800' }, ['Who drivers call']));
  const contactInputs = {};
  CONTACT_ROLES.forEach((role) => {
    const c = (l.contacts && l.contacts[role.id]) || {};
    const n = el('input', { type: 'text', value: c.name || '', placeholder: 'Name' });
    const ph = el('input', { type: 'text', value: c.phone || '', placeholder: 'Phone' });
    const em = el('input', { type: 'text', value: c.email || '', placeholder: 'Email' });
    contactInputs[role.id] = { n, ph, em };
    content.appendChild(el('div', { style: 'border-top:1px solid var(--line);padding-top:9px;margin-top:9px' }, [
      el('div', { style: 'font-size:10.5px;font-weight:800;color:var(--accent);letter-spacing:.3px;margin-bottom:6px' }, [role.label.toUpperCase()]),
      n, el('div', { class: 'grid2', style: 'margin-top:6px' }, [ph, em])
    ]));
  });

  const saveBtn = el('button', {
    class: 'btn primary', type: 'button',
    onclick: () => {
      if (!name.value.trim()) { toast('Location name is required'); name.focus(); return; }
      const target = existing || { id: uid(), createdAt: nowISO() };
      target.name = name.value.trim();
      target.city = city.value.trim();
      target.state = st.value.trim().toUpperCase();
      target.driverCount = count.value.trim();
      target.benefitYear = year.value.trim();
      target.carriers = carriers.value.trim();
      target.union = union.value.trim();
      target.contacts = {};
      CONTACT_ROLES.forEach((role) => {
        const c = contactInputs[role.id];
        target.contacts[role.id] = { name: c.n.value.trim(), phone: c.ph.value.trim(), email: c.em.value.trim() };
      });
      target.updatedAt = nowISO();
      if (!target.auditId) target.auditId = 'LOC-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();
      if (existing) {
        const i = state.locations.findIndex((x) => x.id === target.id);
        if (i >= 0) state.locations[i] = target;
      } else {
        state.locations.push(target);
        if (!state.settings.selectedLocation) state.settings.selectedLocation = target.id;
      }
      save(true);
      closeModal();
      toast(existing ? 'Location updated' : 'Location added');
      render();
    }
  }, [existing ? 'Save changes' : 'Add location']);

  openModal(existing ? 'Edit location' : 'Add location', 'Values and contacts can be filled in after', content, [
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, ['Cancel']),
    saveBtn
  ]);
  setTimeout(() => name.focus(), 80);
}

function openRideModal(existing) {
  const r = existing || { id: '', locId: selectedLocId(), date: todayISO(), drivers: '', covered: [], notes: '', questions: [] };
  const locSel = el('select');
  state.locations.forEach((l) => locSel.appendChild(el('option', { value: l.id }, [l.name])));
  locSel.value = r.locId || (state.locations[0] && state.locations[0].id) || '';

  const dateInp = el('input', { type: 'date', value: r.date || todayISO() });
  const drivers = el('input', { type: 'text', value: r.drivers || '', placeholder: 'e.g. Kyle Osei + 2 riders' });

  const boxes = {};
  const chipWrap = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
  PROGRAMS.forEach((p) => {
    const on = (r.covered || []).includes(p.id);
    const b = el('button', {
      type: 'button', class: 'btn sm' + (on ? ' gold' : ''), style: 'border-radius:999px',
      onclick: () => { boxes[p.id] = !boxes[p.id]; b.classList.toggle('gold', boxes[p.id]); }
    }, [p.icon + ' ' + p.name]);
    boxes[p.id] = on;
    chipWrap.appendChild(b);
  });

  const notes = el('textarea', { placeholder: 'What came up? Anything that needs follow-up?' });
  notes.value = r.notes || '';
  const qs = el('textarea', { placeholder: 'One question per line — each becomes an open item for HR' });
  qs.value = (r.questions || []).filter((q) => !q.answered).map((q) => q.text).join('\n');

  const content = el('div');
  content.appendChild(field('Location', locSel));
  content.appendChild(el('div', { class: 'grid2' }, [field('Date', dateInp), field('Drivers present', drivers)]));
  content.appendChild(el('div', { class: 'field' }, [el('label', {}, ['Programs covered']), chipWrap]));
  content.appendChild(field('Notes', notes));
  content.appendChild(field('Questions for HR', qs));

  const saveBtn = el('button', {
    class: 'btn primary', type: 'button',
    onclick: () => {
      const target = existing || { id: uid(), createdAt: nowISO(), questions: [] };
      const covered = PROGRAMS.filter((p) => boxes[p.id]).map((p) => p.id);
      target.locId = locSel.value;
      target.date = dateInp.value || todayISO();
      target.drivers = drivers.value.trim();
      target.covered = covered;
      target.notes = notes.value.trim();
      target.updatedAt = nowISO();
      if (!target.auditId) target.auditId = 'RIDE-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();

      const kept = (existing ? existing.questions : []).filter((q) => q.answered);
      const lines = qs.value.split('\n').map((s) => s.trim()).filter(Boolean);
      const fresh = lines.map((text) => ({ id: uid(), text, answered: false, createdAt: nowISO(), locId: target.locId, rideId: target.id }));
      target.questions = kept.concat(fresh);

      if (existing) {
        const i = state.rides.findIndex((x) => x.id === target.id);
        if (i >= 0) state.rides[i] = target;
        state.questions = state.questions.filter((q) => q.rideId !== target.id).concat(target.questions);
      } else {
        state.rides.push(target);
        state.questions = state.questions.concat(target.questions);
      }
      save(true);
      closeModal();
      toast('Ride-along saved');
      render();
    }
  }, [existing ? 'Save changes' : 'Save ride-along']);

  openModal(existing ? 'Edit ride-along' : 'Log ride-along', 'Track what you briefed and what still needs an answer', content, [
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, ['Cancel']),
    saveBtn
  ]);
}

/* ------------------------------ backup ------------------------------ */

function exportBackup() {
  const payload = {
    app: 'navigator-hub', version: 2, exportedAt: nowISO(), programs: PROGRAMS.length,
    locations: state.locations, values: state.values, rides: state.rides,
    questions: state.questions, newHire: state.newHire, settings: state.settings
  };
  download('navigator-hub-backup-' + todayISO() + '.json', JSON.stringify(payload, null, 2));
  toast('Backup downloaded');
}

function importBackup() {
  const inp = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let d;
      try { d = JSON.parse(String(rd.result)); } catch (e) { toast('That file is not valid JSON'); return; }
      if (!d || (!Array.isArray(d.locations) && !d.newHire)) { toast('Nothing recognisable in that file'); return; }
      const ok = confirm('SYNC this file onto this device?\n\nAdds new locations and updates matching ones. Nothing already here is removed.');
      if (!ok) return;
      let add = 0, upd = 0;
      const byId = {};
      state.locations.forEach((l) => { byId[l.id] = l; });
      (d.locations || []).forEach((raw) => {
        const l = ensureLocation(raw);
        if (byId[l.id]) { upd++; const i = state.locations.findIndex((x) => x.id === l.id); state.locations[i] = l; }
        else { add++; state.locations.push(l); }
      });
      Object.assign(state.values, d.values || {});
      const rids = new Set(state.rides.map((r) => r.id));
      (d.rides || []).forEach((r) => { if (!rids.has(r.id)) { state.rides.push(r); add++; } });
      const qids = new Set(state.questions.map((q) => q.id));
      (d.questions || []).forEach((q) => { if (!qids.has(q.id)) state.questions.push(q); });
      if (d.newHire) {
        const nh = ensureNewHire(d.newHire);
        state.newHire = Object.assign(ensureNewHire(state.newHire), nh);
      }
      save(true);
      toast('Synced: +' + add + ' new, ' + upd + ' updated');
      render();
    };
    rd.readAsText(f);
  });
  document.body.appendChild(inp);
  inp.click();
  setTimeout(() => inp.remove(), 60000);
}

function exportCsv() {
  const rows = [['Location', 'Program', 'Published value', 'Amount', 'Eligibility', 'How to claim', 'Effective', 'Status', 'Confirmed by']];
  state.locations.forEach((l) => {
    PROGRAMS.forEach((p) => {
      const v = getVal(l.id, p.id);
      rows.push([l.name, p.name, p.value + ' ' + p.unit, v.amount, v.eligibility, v.claim, v.effective, v.status, v.confirmedBy]);
    });
  });
  const csv = rows.map((r) => r.map((v) => {
    const s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
  download('navigator-hub-values-' + todayISO() + '.csv', csv, 'text/csv');
  toast('CSV downloaded');
}

/* ------------------------------ boot ------------------------------ */

function boot() {
  applyTheme();
  applyRole();
  updateNetBadge();
  window.addEventListener('online', updateNetBadge);
  window.addEventListener('offline', updateNetBadge);
  window.addEventListener('hashchange', () => { if (applyHash()) render(); });

  const tt = document.getElementById('themeToggle');
  if (tt) tt.addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.view));
  });
  document.querySelectorAll('.role').forEach((b) => {
    b.addEventListener('click', () => setRole(b.dataset.role));
  });

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem(THEME_KEY)) {
    localStorage.setItem(THEME_KEY, 'dark');
    applyTheme();
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      /* SW disabled in demo */
    });
  }

  load();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
