const XLSX = require('xlsx');
const path = 'c:/wamp64/www/insight-sparkle-741/BaseMystery.xlsx';
const wb = XLSX.readFile(path);
console.log('SHEETS', JSON.stringify(wb.SheetNames));
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, blankrows: false, defval: '' });
  console.log('--- ' + name + ' ---');
  console.log(JSON.stringify(rows.slice(0, 12), null, 2));
}
