export function generateFixtures(rawCount = '10') {
  if (!/^[0-9]+$/.test(String(rawCount))) throw new Error('Count must be an integer from 1 to 500');
  const count = Number(rawCount);
  if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error('Count must be an integer from 1 to 500');
const statuses=['Draft','Awaiting verification','Discrepancy','Verified','Release requested'];
const records=Array.from({length:count},(_,i)=>({id:`DEMO-${String(i+1).padStart(4,'0')}`,institutionId:'demo-institution',institution:'Synthetic QA Institution',bank:`Demo Bank ${i%3+1}`,number:`SYNTHETIC-${i+1}`,branch:'Test branch',amount:1000+(i+1)*100,amountMinor:(1000+(i+1)*100)*100,issued:'2026-01-01',maturity:new Date(Date.UTC(2026,10,i+1)).toISOString().slice(0,10),status:statuses[i%statuses.length],docs:[],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}));

  return {synthetic: true, records};
}
