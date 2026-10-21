(function () {
  var STORE = '__fakeidb__';
  var DB = 'usaf_navigator_db';
  var KEY = 'usaf_navigator_v1';

  var CONTACTS = {
    trainer: { name: 'Joshua Wheeler', phone: '(319) 601-2111', email: 'jwheeler@usautoforce.com' },
    dispatch: { name: 'Todd Alston', phone: '(319) 499-8961', email: 'talston@usautoforce.com' },
    dispatcher: { name: 'Benjamin Staley', phone: '(319) 600-4403', email: 'bstaley@usautoforce.com' },
    hr: { name: 'Veronica Cease', phone: '(913) 609-1180', email: 'vcease@usventure.com' }
  };

  function mkVal(amount, eligibility, claim, effective, confirmedBy, status) {
    return {
      amount: amount, eligibility: eligibility, claim: claim, effective: effective,
      confirmedBy: confirmedBy || '', status: status || 'draft',
      updatedAt: '2026-10-14T15:20:00.000Z',
      auditId: 'NAV-20261014-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    };
  }

  var FRUITLAND = {
    uniforms: mkVal('5 shirt sets + 2 sweatshirts after 90 days', 'Full-time drivers, after 90 days', 'Sizes to dispatch; issued with next route', '2027-01-01', 'V. Cease', 'confirmed'),
    shoes: mkVal('$125 per pair · 2 pairs per year', 'All drivers required to wear safety toe', 'Receipt to dispatch — reimbursed next paycheck', '2027-01-01', 'V. Cease', 'confirmed'),
    wellness: mkVal('$200 per year', 'All full-time employees', 'Receipt + short form to HR by Dec 1', '2027-01-01', 'V. Cease', 'confirmed'),
    steps: mkVal('$25 per month at 8,000 steps/day avg', 'Any driver who opts in', 'App sync + monthly attestation to HR', '2027-01-01', 'V. Cease', 'confirmed'),
    rave: mkVal('50 points ≈ $25 store credit', 'Anyone can nominate; all employees receive', 'Redeem in the online store or gift card', '2027-01-01', 'V. Cease', 'confirmed'),
    dotm: mkVal('100 RAVE points + lunch for the team', 'One driver per location per month', 'Dispatch nominates; winner announced 1st of month', '2027-01-01', 'V. Cease', 'confirmed'),
    screen: mkVal('$600 per year premium discount', 'Employees on the company medical plan', 'Complete screening by Mar 31 — results auto-sent', '2027-01-01', 'V. Cease', 'confirmed')
  };

  var CEDAR = {
    uniforms: mkVal('5 shirt sets + 2 sweatshirts after 90 days', 'Full-time drivers, after 90 days', 'Sizes to dispatch; issued with next route', '2027-01-01', 'V. Cease', 'confirmed'),
    shoes: mkVal('$125 per pair · 2 pairs per year', 'All drivers required to wear safety toe', 'Receipt to dispatch — reimbursed next paycheck', '2027-01-01', 'V. Cease', 'confirmed'),
    wellness: mkVal('$200 per year', 'All full-time employees', '', '2027-01-01', '', 'draft'),
    steps: mkVal('$25 per month at 8,000 steps/day avg', 'Any driver who opts in', '', '2027-01-01', '', 'draft'),
    rave: mkVal('50 points ≈ $25 store credit', 'Anyone can nominate', '', '', '', 'draft'),
    dotm: mkVal('', '', '', '', '', 'tbd'),
    screen: mkVal('$600 per year premium discount', '', '', '', '', 'draft')
  };

  var values = {};
  Object.keys(FRUITLAND).forEach(function (k) { values['loc-fruitland:' + k] = FRUITLAND[k]; });
  Object.keys(CEDAR).forEach(function (k) { values['loc-cedar:' + k] = CEDAR[k]; });

  var data = {
    locations: [
      {
        id: 'loc-fruitland', name: 'Fruitland', city: 'Fruitland', state: 'IA',
        driverCount: '24', benefitYear: '2027', planStart: '2027-01-01',
        carriers: 'Medical · Dental · Vision · Life', union: 'None', published: true,
        contacts: CONTACTS, createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-14T15:20:00.000Z', auditId: 'LOC-20261001-FRUI'
      },
      {
        id: 'loc-cedar', name: 'Cedar Rapids', city: 'Cedar Rapids', state: 'IA',
        driverCount: '11', benefitYear: '2027', planStart: '2027-01-01',
        carriers: 'Medical · Dental · Vision', union: 'None', published: false,
        contacts: CONTACTS, createdAt: '2026-10-02T12:00:00.000Z',
        updatedAt: '2026-10-13T09:10:00.000Z', auditId: 'LOC-20261002-CEDA'
      },
      {
        id: 'loc-kc', name: 'Kansas City', city: 'Kansas City', state: 'KS',
        driverCount: '18', benefitYear: '2027', planStart: '2027-01-01',
        carriers: '', union: '', published: false,
        contacts: {
          trainer: { name: '', phone: '', email: '' },
          dispatch: { name: '', phone: '', email: '' },
          dispatcher: { name: '', phone: '', email: '' },
          hr: CONTACTS.hr
        },
        createdAt: '2026-10-03T12:00:00.000Z', auditId: 'LOC-20261003-KANS'
      }
    ],
    values: values,
    rides: [
      {
        id: 'ride-1', locId: 'loc-fruitland', date: '2026-10-14',
        drivers: 'Kyle Osei + 3 riders', notes: 'Walked the whole benefits page with the day shift. Biggest question was how fast shoe money shows up — answered: next paycheck.',
        covered: ['uniforms', 'shoes', 'wellness', 'steps', 'rave'],
        createdAt: '2026-10-14T18:00:00.000Z', auditId: 'RIDE-20261014-A1B2',
        questions: [
          { id: 'q1', text: 'Does the step program pay out if a driver is on light duty?', answered: false, createdAt: '2026-10-14T18:00:00.000Z', locId: 'loc-fruitland', rideId: 'ride-1' }
        ]
      },
      {
        id: 'ride-2', locId: 'loc-cedar', date: '2026-10-09',
        drivers: 'Alicia Santos + 2 riders', notes: 'Covered uniforms and shoes only — ran out of time before the evening loads.',
        covered: ['uniforms', 'shoes'],
        createdAt: '2026-10-09T20:00:00.000Z', auditId: 'RIDE-20261009-C3D4',
        questions: [
          { id: 'q2', text: 'Is the wellness reimbursement the same for part-time drivers?', answered: false, createdAt: '2026-10-09T20:00:00.000Z', locId: 'loc-cedar', rideId: 'ride-2' }
        ]
      }
    ],
    questions: [
      { id: 'q1', text: 'Does the step program pay out if a driver is on light duty?', answered: false, createdAt: '2026-10-14T18:00:00.000Z', locId: 'loc-fruitland', rideId: 'ride-1' },
      { id: 'q2', text: 'Is the wellness reimbursement the same for part-time drivers?', answered: false, createdAt: '2026-10-09T20:00:00.000Z', locId: 'loc-cedar', rideId: 'ride-2' }
    ],
    settings: { selectedLocation: 'loc-fruitland' }
  };

  var bag = {};
  try { bag = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { bag = {}; }
  bag[DB] = bag[DB] || {};
  if (!bag[DB][KEY]) bag[DB][KEY] = data;
  localStorage.setItem(STORE, JSON.stringify(bag));

  /* demo ribbon — never printed */
  document.addEventListener('DOMContentLoaded', function () {
    var r = document.createElement('div');
    r.className = 'no-print';
    r.textContent = 'DEMO — sample values, not company policy';
    r.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:80;background:#b8860b;color:#fff;font:700 10.5px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.6px;padding:6px 12px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none';
    document.body.appendChild(r);
  });
})();
