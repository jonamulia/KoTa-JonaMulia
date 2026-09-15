import XLSX from 'xlsx';
const wb = XLSX.readFile('c:/Users/USER/Downloads/KoTa/rekapan.xlsx');
for (const name of wb.SheetNames) {
  console.log(`=== Sheet: ${name} ===`);
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  data.slice(0, 30).forEach((row, i) => console.log(`Row ${i}: ${JSON.stringify(row)}`));
  console.log('');
}
