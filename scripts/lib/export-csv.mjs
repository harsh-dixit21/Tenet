export function parseCsv(input) {
  if (input.startsWith('\uFEFF')) input = input.slice(1);
  const records = [];
  let cells = [], field = '', line = 1, start = 1, quoted = false, closed = false;
  function pushCell() {
    cells.push(field);
    field = '';
    closed = false;
  }
  function pushRecord() {
    pushCell();
    if (records.length>=100001) throw new Error('The export exceeds 100,000 data rows.');
    records.push({line:start,cells});
    cells = [];
  }
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i+1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else {
        field += char;
        if (char === '\n' || (char === '\r' && input[i+1] !== '\n')) line++;
      }
      continue;
    }
    if (char === '\r' || char === '\n') {
      pushRecord();
      if (char === '\r' && input[i+1] === '\n') i++;
      start = ++line;
    } else if (char === ',') pushCell();
    else if (closed || (char === '"' && field)) throw new Error('Invalid quoting on line '+line+'.');
    else if (char === '"') quoted = true;
    else field += char;
  }
  if (quoted) throw new Error('Unclosed quoted field starting on line '+start+'.');
  if (field || cells.length || closed) pushRecord();
  return records;
}
