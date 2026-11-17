const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const integerColumns = new Set(['Instruments','Active','Pending reviews','Missing evidence','Active banks','Matching findings','Bytes','Version']);
const dateColumns = new Set(['Issue date','Issued','Maturity','Requested','Next maturity','Due date','Date']);
const optionalDates = new Set(['Due date','Next maturity']);
function isDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value+'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value;
}
const amountColumns = new Set(['Amount INR','Active amount INR']);

const states = ['Draft','Awaiting verification','Discrepancy','Verified','Release requested','Released','Refunded','Discharged','Renewed','Replaced'];
const vocabularies = {
  register:{Status:states},
  portfolio:{Status:states},
  'evidence-gaps':{Status:states},
  requests:{Type:['Release','Refund','Discharge'],Status:['Pending','Approved','Rejected']},
  audit:{Actor:['Institution','Reviewer','Approver','Admin']},
  reminders:{Read:['Yes','No']},
  tasks:{Completion:['Completed','Open']},
};

const identityColumns = {register:'Instrument',portfolio:'Instrument ID',requests:'Request',tasks:'Task ID'};

const requiredColumns = {
  register:['Instrument','Institution','Bank','Instrument number'],
  portfolio:['Instrument ID','Institution','Bank','Instrument number'],
  requests:['Request','Instrument','Reason'],
  documents:['Instrument','File','Category'],
  audit:['Timestamp','Actor','Instrument','Action'],
  reminders:['Instrument','Reminder'],
  tasks:['Task ID','Title'],
  watchlist:['Watchlist','Instrument ID'],
};

export function inspectRows(profile, header, rows) {
  const issues = [];
  function add(line,column,message,severity='error') {
    issues.push({line,column,severity,message});
  }
  const identity = identityColumns[profile];
  const seen = new Set();
  for (const row of rows) {
    const data = Object.fromEntries(header.map((column,index)=>[column,row.cells[index]]));
    if (identity && data[identity]) {
      if (seen.has(data[identity])) add(row.line,identity,'Identifier appears more than once.');
      seen.add(data[identity]);
    }
    const issued = data.Issued ?? data['Issue date'];
    if (isDay(issued ?? '') && isDay(data.Maturity ?? '') && issued>=data.Maturity) {
      add(row.line,'Maturity','Maturity must be after the issue date.');
    }
    for (const column of header) {
      const value = data[column];
      if (integerColumns.has(column) && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
        add(row.line,column,'Expected a nonnegative safe integer.');
      }
      if (dateColumns.has(column) && !(value==='' && optionalDates.has(column)) && !isDay(value)) {
        add(row.line,column,'Expected a valid YYYY-MM-DD calendar date.');
      }
      if (column==='SHA256' && value && !/^[a-f0-9]{64}$/i.test(value)) {
        add(row.line,column,'Expected a 64-character hexadecimal SHA-256 checksum.');
      }
      if (/^[\s\uFEFF]*[=+@-]/u.test(value) && !/^-\d+(?:\.\d+)?$/.test(value)) {
        add(row.line,column,'Cell may be interpreted as a spreadsheet formula.','warning');
      }
      if (requiredColumns[profile]?.includes(column) && !value.trim()) {
        add(row.line,column,'Required value is empty.');
      }
      const allowed = vocabularies[profile]?.[column];
      if (allowed && !allowed.includes(value)) add(row.line,column,'Unexpected value for this export column.');
      if (amountColumns.has(column) &&
          (!amountPattern.test(value) || !Number.isSafeInteger(Math.round(Number(value)*100)))) {
        add(row.line,column,'Expected a nonnegative INR amount with at most two decimal places.');
      }
    }
  }
  return issues;
}
