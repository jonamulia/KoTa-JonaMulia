import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
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
      const barangKey = row['nama barang']?.toString().trim();
      const harga = parseInt(row['harga barang'] || '0') * 1000;
      if (barangKey) {
        if (!uniqueBarang.has(barangKey) || uniqueBarang.get(barangKey)! < harga) {
          uniqueBarang.set(barangKey, harga || 0);
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
      const r = await client.query('INSERT INTO "barang" (nama_barang, harga) VALUES ($1, $2) RETURNING id_barang', [k, v]);
      barangMap.set(k, r.rows[0].id_barang);
    }

    console.log(`Memasukkan pesanan...`);
    await client.query('BEGIN');
    
    for (const row of data) {
      const klienKey = row['nama lokasi']?.toString().trim();
      const barangKey = row['nama barang']?.toString().trim();
      const salesKey = row['sales']?.toString().toLowerCase().trim();

      if (!klienKey || !barangKey || !salesKey) continue;

      const id_klien = klienMap.get(klienKey)!;
      const id_barang = barangMap.get(barangKey)!;
      const id_sales = userMap.get(salesKey) || idNego;

      let qty = 1;
      if (barangKey.toLowerCase().includes('x2')) qty = 2;
      if (barangKey.toLowerCase().includes('x3')) qty = 3;

      const total_harga = (parseInt(row['harga barang'] || '0') || 0) * 1000;

      const resPesanan = await client.query(
        'INSERT INTO "pesanan" (id_klien, id_barang, qty, total_harga, status, id_sales, id_nego) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_pesanan',
        [id_klien, id_barang, qty, total_harga, 'AKTIF', id_sales, idNego]
      );
      const id_pesanan = resPesanan.rows[0].id_pesanan;

      let totalDibayar = 0;
      for (let i=1; i<=5; i++) {
        const angsuran = row[`angsuran${i}`];
        const petugas = row[`petugas angsuran ${i}`]?.toString().toLowerCase().trim();
        
        if (angsuran && petugas && parseInt(angsuran) > 0) {
          const nominal = parseInt(angsuran) * 1000;
          const id_penagih = userMap.get(petugas)!;

          const resPenagihan = await client.query(
            'INSERT INTO "penagihan" (id_pesanan, id_penagih, percobaan_ke, status, nominal, catatan, tanggal) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id_penagihan',
            [id_pesanan, id_penagih, i, 'BERHASIL', nominal, `Angsuran ke-${i} via Impor Excel`]
          );
          const id_penagihan = resPenagihan.rows[0].id_penagihan;

          totalDibayar += nominal;
          const fraction = nominal / total_harga;
          const komisiSales = Math.floor(fraction * 25000 * qty);
          const komisiNego = Math.floor(fraction * 10000 * qty);
          const komisiPenagih = 2000;

          await client.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiSales, id_penagihan, id_sales]);
          await client.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiNego, id_penagihan, idNego]);
          await client.query('INSERT INTO "komisiLog" (jenis_komisi, nominal_masuk, id_referensi, id_user) VALUES ($1, $2, $3, $4)', ['UANG_MASUK', komisiPenagih, id_penagihan, id_penagih]);
        }
      }

      if (totalDibayar >= total_harga) {
        await client.query('UPDATE "pesanan" SET status = $1 WHERE id_pesanan = $2', ['LUNAS', id_pesanan]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`Berhasil mengimpor data!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
  } finally {
    await client.end();
  }
}

main().then(() => process.exit(0));
