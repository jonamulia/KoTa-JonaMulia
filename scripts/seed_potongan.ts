import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
  const client = await pool.connect();
  
  try {
    const excelPath = path.resolve(process.cwd(), 'rekapan.xlsx');
    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = 'potongan sales nego penagihan';
    
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log('Sheet potongan tidak ditemukan');
      return;
    }
    
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);
    
    console.log('Mulai import potongan...');
    
    // Fetch user mapping
    const usersRes = await client.query('SELECT id_user, nama, username FROM "user"');
    const userMap = new Map<string, number>();
    usersRes.rows.forEach(u => {
      userMap.set(u.nama.toLowerCase().trim(), u.id_user);
      userMap.set(u.username.toLowerCase().trim(), u.id_user);
    });

    let inserted = 0;

    for (const row of data) {
      const nama = row['nama']?.toString().toLowerCase().trim();
      if (!nama || !userMap.has(nama)) continue;

      const id_user = userMap.get(nama)!;
      let tanggal = new Date();
      const tanggalStr = row['tanggal']?.toString().trim();
      if (tanggalStr && tanggalStr.length === 8) {
        const d = parseInt(tanggalStr.substring(0, 2));
        const m = parseInt(tanggalStr.substring(2, 4)) - 1;
        const y = parseInt(tanggalStr.substring(4, 8));
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          tanggal = new Date(y, m, d);
        }
      }

      // Check for different deduction types
      const types = [
        { key: 'potongan harian', jenis: 'UANG SAKU' },
        { key: 'potongan sabun rt', jenis: 'SABUN RT' },
        { key: 'potongan sabun warga', jenis: 'SABUN WARGA' },
        { key: 'kasbon', jenis: 'KASBON' } // Map kasbon to KASBON / LAINNYA
      ];

      for (const t of types) {
        const nominalRaw = row[t.key];
        if (nominalRaw) {
          let nominal = parseInt(nominalRaw);
          // If the sheet stores it in thousands (e.g. 30 = 30.000)
          if (nominal < 1000) nominal = nominal * 1000;

          if (nominal > 0) {
            // Insert into potongan
            const pRes = await client.query(
              'INSERT INTO "potongan" (jenis, nominal, tanggal, id_user) VALUES ($1, $2, $3, $4) RETURNING id_potongan',
              [t.jenis, nominal, tanggal, id_user]
            );
            
            // Insert into komisiLog
            await client.query(
              'INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)',
              ['POTONGAN', -nominal, pRes.rows[0].id_potongan, id_user]
            );
            inserted++;
          }
        }
      }
    }
    
    console.log(`Berhasil mengimpor ${inserted} data potongan!`);
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    client.release();
    pool.end();
  }
}

main();
