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
};
