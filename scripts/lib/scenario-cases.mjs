export const scenarios = {
  'draft': {
    description: 'Create a saved deposit draft with an exact amount in paise.',
    run(s) {
      const draft = s.create();
      s.assert.equal(draft.status, 'Draft');
      s.assert.equal(draft.amountMinor, 12_500_025);
    },
  },
};
