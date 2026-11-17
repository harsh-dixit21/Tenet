export const profiles = new Map([
  ['register','Instrument|Institution|Bank|Instrument number|Amount INR|Issue date|Maturity|Status|Linked instrument'.split('|')],
]);
export function detectProfile(header) {
  for (const [name,columns] of profiles) {
    if (columns.length===header.length && columns.every((value,index)=>value===header[index])) return name;
  }
  return null;
}
