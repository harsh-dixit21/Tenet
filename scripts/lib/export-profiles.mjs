export const profiles = new Map([
  ['register','Instrument|Institution|Bank|Instrument number|Amount INR|Issue date|Maturity|Status|Linked instrument'.split('|')],
  ['documents','Instrument|Institution|File|Category|Version|Date|Bytes|SHA256'.split('|')],
  ['requests','Request|Instrument|Institution|Type|Status|Requested|Reason|Decision'.split('|')],
  ['institutions','Institution|Instruments|Active|Active amount INR|Pending reviews|Missing evidence|Active banks|Next maturity'.split('|')],
  ['audit','Timestamp|Actor|Instrument|Action'.split('|')],
  ['reminders','Instrument|Reminder|Details|Read'.split('|')],
  ['summary','Category|Instruments|Amount INR'.split('|')],
  ['evidence-gaps','Instrument|Institution|Status|Missing categories'.split('|')],
  ['tasks','Task ID|Instrument ID|Title|Due date|Priority|Category|Completion|Personal notes'.split('|')],
  ['snapshot-changes','Instrument ID|Institution|Change group|Field|Baseline|Current'.split('|')],
  ['control-findings','Instrument ID|Related reference|Check|Category|Finding type|Description'.split('|')],
  ['control-summary','Check|Category|Finding type|Evaluation|Matching findings'.split('|')],
  ['watchlist','Watchlist|Instrument ID'.split('|')],
  ['portfolio','Instrument ID|Institution|Bank|Instrument number|Amount INR|Issued|Maturity|Status|Missing document categories'.split('|')],
]);
export function detectProfile(header) {
  for (const [name,columns] of profiles) {
    if (columns.length===header.length && columns.every((value,index)=>value===header[index])) return name;
  }
  return null;
}
