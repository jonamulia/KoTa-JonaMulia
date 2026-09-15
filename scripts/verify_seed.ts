import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import pg from 'pg';

const { Client } = pg;

async function main() {
  console.log('Membaca data Excel...');
  const excelPath = path.resolve(process.cwd(), 'rekapan.xlsx');
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = xlsx.utils.sheet_to_json(sheet);
  
  let totalPesananExcel = data.length;
  let invalidRows = 0;
  
  let totalAngsuranMasukExcel = 0;
  let totalKomisiSalesExpected = 0;
  let totalKomisiNegoExpected = 0;
  let totalKomisiPenagihExpected = 0;

  for (const row of data) {
    const klienKey = row['nama lokasi']?.toString().trim();
    const barangKey = row['nama barang']?.toString().trim();
    const salesKey = row['sales']?.toString().toLowerCase().trim();

    if (!klienKey || !barangKey || !salesKey) {
      invalidRows++;
      continue;
    }
    
    let qty = 1;
    if (barangKey.toLowerCase().includes('x2')) qty = 2;
    if (barangKey.toLowerCase().includes('x3')) qty = 3;

    const total_harga = (parseInt(row['harga barang'] || '0') || 0) * 1000;
    
    for (let i=1; i<=5; i++) {
      const angsuran = row[`angsuran${i}`];
      const petugas = row[`petugas angsuran ${i}`]?.toString().toLowerCase().trim();
      
      if (angsuran && petugas && parseInt(angsuran) > 0) {
        const nominal = parseInt(angsuran) * 1000;
        totalAngsuranMasukExcel += nominal;
        
        const fraction = nominal / total_harga;
        totalKomisiSalesExpected += Math.floor(fraction * 25000 * qty);
        totalKomisiNegoExpected += Math.floor(fraction * 10000 * qty);
        totalKomisiPenagihExpected += 2000;
      }
    }
  }

  const validPesananExcel = totalPesananExcel - invalidRows;
  
  console.log(`\n--- DATA EXCEL ---`);
  console.log(`Total Baris Excel: ${totalPesananExcel}`);
  console.log(`Baris Invalid (kosong dll): ${invalidRows}`);
  console.log(`Pesanan Valid Excel: ${validPesananExcel}`);
  console.log(`Total Uang Angsuran Excel: Rp ${totalAngsuranMasukExcel.toLocaleString('id-ID')}`);
  console.log(`Total Komisi Sales Excel: Rp ${totalKomisiSalesExpected.toLocaleString('id-ID')}`);
  console.log(`Total Komisi Nego Excel: Rp ${totalKomisiNegoExpected.toLocaleString('id-ID')}`);
  console.log(`Total Komisi Penagih Excel: Rp ${totalKomisiPenagihExpected.toLocaleString('id-ID')}`);


  console.log('\nMembaca data Database...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const resPesanan = await client.query('SELECT COUNT(*) as c FROM "pesanan"');
    const dbPesanan = parseInt(resPesanan.rows[0].c);

    const resAngsuran = await client.query(`SELECT SUM(nominal) as total FROM "penagihan" WHERE status = 'BERHASIL'`);
    const dbAngsuran = parseInt(resAngsuran.rows[0].total || '0');

    // Get komisi grouping by role via the related user
    const resKomisi = await client.query(`
      SELECT u.role, SUM(k.nominal_masuk) as total 
      FROM "komisiLog" k
      JOIN "user" u ON k.id_user = u.id_user
      GROUP BY u.role
    `);
    
    let dbKomisiSales = 0;
    let dbKomisiNego = 0;
    let dbKomisiPenagih = 0;

    for (const r of resKomisi.rows) {
      if (r.role === 'SALES') dbKomisiSales += parseInt(r.total);
      if (r.role === 'NEGO') dbKomisiNego += parseInt(r.total);
      if (r.role === 'PENAGIH') dbKomisiPenagih += parseInt(r.total);
    }

    console.log(`\n--- DATA DATABASE ---`);
    console.log(`Total Pesanan DB: ${dbPesanan} ` + (dbPesanan === validPesananExcel ? '✅' : '❌'));
    console.log(`Total Uang Angsuran DB: Rp ${dbAngsuran.toLocaleString('id-ID')} ` + (dbAngsuran === totalAngsuranMasukExcel ? '✅' : '❌'));
    console.log(`Total Komisi Sales DB: Rp ${dbKomisiSales.toLocaleString('id-ID')} ` + (dbKomisiSales === totalKomisiSalesExpected ? '✅' : '❌'));
    console.log(`Total Komisi Nego DB: Rp ${dbKomisiNego.toLocaleString('id-ID')} ` + (dbKomisiNego === totalKomisiNegoExpected ? '✅' : '❌'));
    console.log(`Total Komisi Penagih DB: Rp ${dbKomisiPenagih.toLocaleString('id-ID')} ` + (dbKomisiPenagih === totalKomisiPenagihExpected ? '✅' : '❌'));

  } finally {
    await client.end();
  }

}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
