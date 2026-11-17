const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const integerColumns = new Set(['Instruments','Active','Pending reviews','Missing evidence','Active banks','Matching findings','Bytes','Version']);
const dateColumns = new Set();
const amountColumns = new Set(['Amount INR','Active amount INR']);

export function inspectRows(profile, header, rows) {
  const issues = [];
  function add(line,column,message,severity='error') {
    issues.push({line,column,severity,message});
  }
  for (const row of rows) {
    const data = Object.fromEntries(header.map((column,index)=>[column,row.cells[index]]));
    for (const column of header) {
      const value = data[column];
      if (integerColumns.has(column) && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
        add(row.line,column,'Expected a nonnegative safe integer.');
      }
      if (amountColumns.has(column) &&
          (!amountPattern.test(value) || !Number.isSafeInteger(Math.round(Number(value)*100)))) {
        add(row.line,column,'Expected a nonnegative INR amount with at most two decimal places.');
      }
    }
  }
  return issues;
}
