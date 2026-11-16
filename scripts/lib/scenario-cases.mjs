export const scenarios = {
  'draft': {
    description: 'Create a saved deposit draft with an exact amount in paise.',
    run(s) {
      const draft = s.create();
      s.assert.equal(draft.status, 'Draft');
      s.assert.equal(draft.amountMinor, 12_500_025);
    },
  },
  'submitted': {
    description: 'Submit a synthetic instrument to the review queue.',
    run(s) {
      s.assert.equal(s.submitted().status, 'Awaiting verification');
    },
  },
  'verified': {
    description: 'Upload the three required documents and verify a submitted deposit.',
    run(s) {
      const record = s.verified();
      s.assert.equal(record.verifiedBy, s.reviewer.uid);
      s.assert.equal(record.docs.length, 3);
    },
  },
  'correction': {
    description: 'Return a submitted instrument with correction instructions.',
    run(s) {
      const record = s.correct(s.submitted());
      s.assert.equal(record.status, 'Discrepancy');
      s.assert.match(record.correction, /maturity date/);
    },
  },
  'resubmitted': {
    description: 'Add the required evidence to a returned record and resubmit it.',
    run(s) {
      const returned = s.correct(s.submitted());
      const record = s.documentAll(returned);
      const result = s.execute(s.institution, {type: 'resubmit', recordId: record.id});
      s.assert.equal(result.status, 'Awaiting verification');
    },
  },
  'evidence-versions': {
    description: 'Upload two different bank letters and preserve their version numbers.',
    run(s) {
      const first = s.upload(s.create(), 'Bank letter');
      const second = s.upload(first, 'Bank letter', {tag: 'revised'});
      s.assert.deepEqual(second.docs.map(document => document.version), [1, 2]);
      s.assert.notEqual(second.docs[0].sha256, second.docs[1].sha256);
    },
  },
  'category-versions': {
    description: 'Upload repeated versions in one category and the first version in another.',
    run(s) {
      let record = s.upload(s.create(), 'Instrument copy');
      record = s.upload(record, 'Instrument copy', {tag: 'second'});
      record = s.upload(record, 'Approval letter');
      s.assert.deepEqual(record.docs.map(document => document.version), [1, 2, 1]);
    },
  },
  'pending-release': {
    description: 'Open a Release request for a matured and verified instrument.',
    run(s) {
      const request = s.closure(s.verified({maturity: -1}));
      s.assert.equal(request.status, 'Pending');
      s.assert.equal(request.type, 'Release');
    },
  },
  'pending-refund': {
    description: 'Open a Refund request for a matured and verified instrument.',
    run(s) {
      const request = s.closure(s.verified({maturity: -1}), 'Refund');
      s.assert.equal(request.status, 'Pending');
      s.assert.equal(request.type, 'Refund');
    },
  },
  'pending-discharge': {
    description: 'Open a Discharge request for a verified instrument with future maturity.',
    run(s) {
      const request = s.closure(s.verified({maturity: 30}), 'Discharge');
      s.assert.equal(request.status, 'Pending');
      s.assert.equal(request.type, 'Discharge');
    },
  },
  'released': {
    description: 'Approve a release on the exact maturity date with independent actors.',
    run(s) {
      const request = s.closure(s.verified({maturity: 0}));
      s.assert.equal(s.decide(request).status, 'Released');
    },
  },
  'refunded': {
    description: 'Approve a refund after maturity with decision notes in the audit step.',
    run(s) {
      const request = s.closure(s.verified({maturity: -1}), 'Refund');
      s.assert.equal(s.decide(request).status, 'Refunded');
    },
  },
  'discharged': {
    description: 'Approve a discharge without requiring prior maturity.',
    run(s) {
      const request = s.closure(s.verified({maturity: 30}), 'Discharge');
      s.assert.equal(s.decide(request).status, 'Discharged');
    },
  },
  'rejected-decision': {
    description: 'Reject a closure request and return its instrument to Verified.',
    run(s) {
      const request = s.closure(s.verified());
      s.assert.equal(s.decide(request, 'Rejected').status, 'Verified');
    },
  },
  'renewal-draft': {
    description: 'Create a longer-dated renewal draft for a verified predecessor.',
    run(s) {
      const parent = s.verified();
      const draft = s.create({suffix: 'renewal', parent: parent.id, relation: 'Renewal', maturity: 60});
      s.assert.equal(draft.parent, parent.id);
      s.assert.equal(draft.status, 'Draft');
    },
  },
  'renewed': {
    description: 'Verify a linked renewal and move its original instrument to Renewed.',
    run(s) {
      const parent = s.verified();
      const successor = s.submitted({suffix: 'renewal', parent: parent.id, relation: 'Renewal', maturity: 60});
      s.assert.equal(s.verify(s.documentAll(successor)).status, 'Verified');
      s.assert.equal(s.finish('', '').snapshot.records.find(record => record.id === parent.id).status, 'Renewed');
    },
  },
  'replaced': {
    description: 'Verify a replacement with the original maturity and close its predecessor as Replaced.',
    run(s) {
      const parent = s.verified();
      const successor = s.submitted({suffix: 'replacement', parent: parent.id, relation: 'Replacement'});
      s.verify(s.documentAll(successor));
      s.assert.equal(s.finish('', '').snapshot.records.find(record => record.id === parent.id).status, 'Replaced');
    },
  },
  'multi-institution': {
    description: 'Create independently owned instruments from two synthetic institutions.',
    run(s) {
      const first = s.submitted();
      const second = s.submitted({suffix: 'south', actor: s.otherInstitution});
      s.assert.notEqual(first.institutionId, second.institutionId);
    },
  },
  'missing-evidence': {
    description: 'Verify an incomplete submission and capture the missing-evidence rejection.',
    run(s) {
      const record = s.upload(s.submitted(), 'Bank letter');
      s.verify(record, {reject: {code: 'failed-precondition', message: /declaration are required/}});
    },
  },
  'self-verification': {
    description: 'Attempt to verify a submission using its creator identity with the Reviewer role.',
    run(s) {
      const record = s.documentAll(s.submitted());
      s.verify(record, {actor: {...s.reviewer, uid: s.institution.uid},
        reject: {code: 'permission-denied', message: /verify your own submission/}});
    },
  },
  'foreign-edit': {
    description: 'Attempt to edit a North institution draft from the South institution account.',
    run(s) {
      s.create();
      s.create({actor: s.otherInstitution,
        reject: {code: 'permission-denied', message: /belongs to another institution/}});
    },
  },
  'disabled-maker': {
    description: 'Attempt to save a draft with an inactive Institution account.',
    run(s) {
      s.create({actor: {...s.institution, active: false},
        reject: {code: 'permission-denied', message: /access is disabled/}});
    },
  },
  'future-issue': {
    description: 'Attempt to save a deposit issued after the scenario reference date.',
    run(s) {
      s.create({fields: {issued: s.shift(1)},
        reject: {code: 'invalid-argument', message: /on\/before today/}});
    },
  },
  'invalid-chronology': {
    description: 'Attempt to save a deposit with maturity on its issue date.',
    run(s) {
      s.create({fields: {issued: s.shift(-1), maturity: s.shift(-1)},
        reject: {code: 'invalid-argument', message: /earlier than maturity/}});
    },
  },
  'fractional-paise': {
    description: 'Attempt to save an INR amount with more than two decimal places.',
    run(s) {
      s.create({fields: {amount: 100.125},
        reject: {code: 'invalid-argument', message: /at most two decimal places/}});
    },
  },
  'duplicate-evidence': {
    description: 'Upload identical content twice to the same evidence category.',
    run(s) {
      const record = s.upload(s.create(), 'Bank letter');
      s.upload(record, 'Bank letter', {reject: {code: 'already-exists', message: /already attached/}});
    },
  },
  'locked-evidence': {
    description: 'Attempt to upload more evidence after reviewing and verifying an instrument.',
    run(s) {
      const record = s.verified();
      s.upload(record, 'Other', {reject: {code: 'failed-precondition', message: /locked after verification/}});
    },
  },
  'premature-release': {
    description: 'Try to approve release of an instrument that matures tomorrow.',
    run(s) {
      const request = s.closure(s.verified({maturity: 1}));
      s.decide(request, 'Approved', {reject: {code: 'failed-precondition', message: /requires maturity/}});
    },
  },
  'unconfirmed-decision': {
    description: 'Try to approve closure without confirming applicable eligibility conditions.',
    run(s) {
      const request = s.closure(s.verified({maturity: -1}));
      s.decide(request, 'Approved', {confirm: false,
        reject: {code: 'failed-precondition', message: /Confirm that applicable release conditions/}});
    },
  },
  'conflicted-approver': {
    description: 'Attempt to approve a closure request using the original verifier identity.',
    run(s) {
      const request = s.closure(s.verified({maturity: -1}));
      s.decide(request, 'Approved', {actor: {...s.approver, uid: s.reviewer.uid},
        reject: {code: 'permission-denied', message: /different official must decide/}});
    },
  },
  'short-renewal': {
    description: 'Attempt a renewal with the same maturity as its verified predecessor.',
    run(s) {
      const parent = s.verified();
      s.create({suffix: 'renewal', parent: parent.id, relation: 'Renewal',
        reject: {code: 'failed-precondition', message: /must extend the original maturity/}});
    },
  },
};
