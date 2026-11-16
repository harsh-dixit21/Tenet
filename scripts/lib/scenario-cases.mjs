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
};
