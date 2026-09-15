import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
  const client = await pool.connect();
  
  try {
    const excelPath = path.resolve(process.cwd(), 'rekapan.xlsx');
    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);
    
    console.log(`Menghapus data lama dengan TRUNCATE CASCADE...`);
    await client.query('TRUNCATE TABLE "komisiLog", "penagihan", "potongan", "pesanan", "klien", "barang", "user" CASCADE');
    
    // Insert Admin
    const hashed = await bcrypt.hash('password123', 10);
    const resAdmin = await client.query(
      'INSERT INTO "user" (nama, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id_user',
      ['Admin', 'admin', hashed, 'ADMIN']
    );
    const idAdmin = resAdmin.rows[0].id_user;
    
    const resNego = await client.query(
      'INSERT INTO "user" (nama, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id_user',
      ['Huda (Nego)', 'huda', hashed, 'NEGO']
    );
    const idNego = resNego.rows[0].id_user;

    const uniqueSales = new Set<string>();
    const uniquePenagih = new Set<string>();
    const uniqueKlien = new Map<string, any>();
    const uniqueBarang = new Map<string, number>();

    const parseBarang = (rawName: string) => {
      const lower = rawName.toLowerCase().trim();
      let qty = 1;
      if (lower.includes('2') || lower.includes('x2')) qty = 2;
      if (lower.includes('3') || lower.includes('x3')) qty = 3;
      
      let baseName = 'lampu'; // default
      if (lower.includes('lampu sprei') || (lower.includes('lampu') && lower.includes('sprei'))) baseName = 'lampu sprei';
      else if (lower.includes('lampu tikar') || (lower.includes('lampu') && lower.includes('tikar'))) baseName = 'lampu tikar';
      else if (lower.includes('lampu lampu')) baseName = 'lampu lampu';
      else if (lower.includes('sprei')) baseName = 'sprei';
      
      return { baseName, qty };
    };

    data.forEach(row => {
      if (row['sales']) uniqueSales.add(row['sales'].toString().toLowerCase().trim());
      for (let i=1; i<=5; i++) {
        const p = row[`petugas angsuran ${i}`];
        if (p) uniquePenagih.add(p.toString().toLowerCase().trim());
      }
      const klienKey = row['nama lokasi']?.toString().trim();
      if (klienKey && !uniqueKlien.has(klienKey)) {
        uniqueKlien.set(klienKey, {
          nama: klienKey,
          alamat: `${row['desa/kecamatan'] || ''} RT/RW ${row['rt/rw'] || ''}`
        });
      }
      const rawBarang = row['nama barang']?.toString().trim();
      const harga = parseInt(row['harga barang'] || '0') * 1000;
      if (rawBarang) {
        const { baseName } = parseBarang(rawBarang);
        if (!uniqueBarang.has(baseName) || uniqueBarang.get(baseName)! < harga) {
          uniqueBarang.set(baseName, harga || 0);
        }
      }
    });

    const userMap = new Map<string, number>();
    userMap.set('huda', idNego);

    for (const s of uniqueSales) {
      if (s === 'huda') continue;
      const r = await client.query('INSERT INTO "user" (nama, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id_user', [s, s, hashed, 'SALES']);
      userMap.set(s, r.rows[0].id_user);
    }
    for (const p of uniquePenagih) {
      if (!userMap.has(p)) {
        const r = await client.query('INSERT INTO "user" (nama, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id_user', [p, p, hashed, 'PENAGIH']);
        userMap.set(p, r.rows[0].id_user);
      }
    }

    const klienMap = new Map<string, number>();
    for (const [k, v] of uniqueKlien.entries()) {
      const r = await client.query('INSERT INTO "klien" (nama, alamat, kontak) VALUES ($1, $2, $3) RETURNING id_klien', [v.nama, v.alamat, '-']);
      klienMap.set(k, r.rows[0].id_klien);
    }

    const barangMap = new Map<string, number>();
    for (const [k, v] of uniqueBarang.entries()) {
      const r = await client.query('INSERT INTO "barang" (nama_barang, harga, harga_beli, komisi_penjualan) VALUES ($1, $2, $3, $4) RETURNING id_barang', [k, v, 0, 25000]);
      barangMap.set(k, r.rows[0].id_barang);
    }

    console.log(`Menyiapkan batch pesanan...`);
    
    // We will build batched strings for faster insertion!
    let pesananIndex = 1;
    
    // Create an array of tasks to execute in chunks
    const insertTasks = [];
    
    for (const row of data) {
      const klienKey = row['nama lokasi']?.toString().trim();
      const rawBarang = row['nama barang']?.toString().trim();
      const salesKey = row['sales']?.toString().toLowerCase().trim();

      if (!klienKey || !rawBarang || !salesKey) continue;

      const { baseName, qty: parsedQty } = parseBarang(rawBarang);
      const id_klien = klienMap.get(klienKey)!;
      const id_barang = barangMap.get(baseName)!;
      const id_sales = userMap.get(salesKey) || idNego;

      const qty = parsedQty;

      const total_harga = (parseInt(row['harga barang'] || '0') || 0) * 1000;
      const id_pesanan = pesananIndex++;
      
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
      
      let totalDibayar = 0;
      let penagihanParams: any[] = [];
      
      for (let i=1; i<=5; i++) {
        const angsuran = row[`angsuran${i}`];
        const petugas = row[`petugas angsuran ${i}`]?.toString().toLowerCase().trim();
        
        if (angsuran && petugas && parseInt(angsuran) > 0) {
          const nominal = parseInt(angsuran) * 1000;
          const id_penagih = userMap.get(petugas)!;

          penagihanParams.push({ id_pesanan, id_penagih, i, nominal, id_sales, id_nego: idNego, qty });
          totalDibayar += nominal;
        }
      }

      const status = (totalDibayar >= total_harga) ? 'LUNAS' : 'AKTIF';
      
      insertTasks.push(async () => {
        await pool.query(
          'INSERT INTO "pesanan" (id_pesanan, tanggal, id_klien, id_barang, qty, total_harga, status, id_sales, id_nego) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [id_pesanan, tanggal, id_klien, id_barang, qty, total_harga, status, id_sales, idNego]
        );
        for (const p of penagihanParams) {
          const resPen = await pool.query(
            'INSERT INTO "penagihan" (id_pesanan, id_penagih, percobaan_ke, status, nominal, catatan, tanggal) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id_penagihan',
            [p.id_pesanan, p.id_penagih, p.i, 'BERHASIL', p.nominal, `Angsuran ke-${p.i} via Impor Excel`]
          );
          const id_penagihan = resPen.rows[0].id_penagihan;

          const fraction = p.nominal / total_harga;
          const komisiSales = Math.floor(fraction * 25000 * p.qty);
          const komisiNego = Math.floor(fraction * 10000 * p.qty);
          const komisiPenagih = 2000;

          await pool.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiSales, id_penagihan, p.id_sales]);
          await pool.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiNego, id_penagihan, p.id_nego]);
          await pool.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiPenagih, id_penagihan, p.id_penagih]);
        }
      });
    }
    
    console.log(`Memasukkan ${insertTasks.length} pesanan dengan Promise.all chunk...`);
    const chunkSize = 50;
    for (let i = 0; i < insertTasks.length; i += chunkSize) {
      const chunk = insertTasks.slice(i, i + chunkSize);
      await Promise.all(chunk.map(task => task()));
      if (i % 500 === 0) {
        console.log(`Processed ${i} / ${insertTasks.length} pesanan...`);
      }
    }
    
    console.log(`Berhasil mengimpor data!`);

  } catch (error) {
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().then(() => process.exit(0));
