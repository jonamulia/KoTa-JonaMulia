const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.resolve(process.cwd(), 'rekapan.xlsx');
const fileBuffer = fs.readFileSync(excelPath);
const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
const sheetName = 'potongan sales nego penagihan';
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
const keys = new Set();
data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
console.log('All Columns:', Array.from(keys));
