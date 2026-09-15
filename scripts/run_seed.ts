import { db } from '../src/prisma/db.js';
import bcrypt from "bcryptjs";
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

import pg from 'pg';

async function main() {
  try {
    const excelPath = path.resolve(process.cwd(), 'rekapan.xlsx');
    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);
    
    const { Client } = pg;
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log(`Menghapus data lama dengan TRUNCATE CASCADE...`);
    await client.query('TRUNCATE TABLE "komisiLog", "penagihan", "potongan", "pesanan", "klien", "barang" CASCADE');
    await client.end();
    
    const admin = await db.orm.public.User.where({ role: 'ADMIN' }).first();
    const allUsers = await db.orm.public.User.all();
    for (const u of allUsers) {
      if (!admin || u.id_user !== admin.id_user) {
        await db.orm.public.User.where({ id_user: u.id_user }).delete();
      }
    }

    const uniqueSales = new Set<string>();
    const uniquePenagih = new Set<string>();
    const uniqueKlien = new Map<string, any>();
    const uniqueBarang = new Map<string, number>();

    console.log(`Mengumpulkan data unik...`);
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
    const hashed = await bcrypt.hash('password123', 10);
    const defaultNego = await db.orm.public.User.create({ nama: 'Huda (Nego)', username: 'huda', password: hashed, role: 'NEGO' });
    userMap.set('huda', defaultNego.id_user);

    for (const s of uniqueSales) {
      if (s === 'huda') continue;
      const u = await db.orm.public.User.create({ nama: s, username: s, password: hashed, role: 'SALES' });
      userMap.set(s, u.id_user);
    }
    for (const p of uniquePenagih) {
      if (!userMap.has(p)) {
        const u = await db.orm.public.User.create({ nama: p, username: p, password: hashed, role: 'PENAGIH' });
        userMap.set(p, u.id_user);
      }
    }

    const klienMap = new Map<string, number>();
    for (const [k, v] of uniqueKlien.entries()) {
      const dbKlien = await db.orm.public.Klien.create({ nama: v.nama, alamat: v.alamat, kontak: '-' });
      klienMap.set(k, dbKlien.id_klien);
    }

    const barangMap = new Map<string, number>();
    for (const [k, v] of uniqueBarang.entries()) {
      const dbBarang = await db.orm.public.Barang.create({ nama_barang: k, harga: v });
      barangMap.set(k, dbBarang.id_barang);
    }

    console.log(`Memasukkan pesanan...`);
    let successCount = 0;
    for (const row of data) {
      const klienKey = row['nama lokasi']?.toString().trim();
      const barangKey = row['nama barang']?.toString().trim();
      const salesKey = row['sales']?.toString().toLowerCase().trim();

      if (!klienKey || !barangKey || !salesKey) continue;

      const id_klien = klienMap.get(klienKey)!;
      const id_barang = barangMap.get(barangKey)!;
      const id_sales = userMap.get(salesKey) || defaultNego.id_user;

      let qty = 1;
      if (barangKey.toLowerCase().includes('x2')) qty = 2;
      if (barangKey.toLowerCase().includes('x3')) qty = 3;

      const total_harga = (parseInt(row['harga barang'] || '0') || 0) * 1000;

      const pesanan = await db.orm.public.Pesanan.create({
        id_klien,
        id_barang,
        qty,
        total_harga,
        status: 'AKTIF',
        id_sales,
        id_nego: defaultNego.id_user,
      });

      let totalDibayar = 0;
      for (let i=1; i<=5; i++) {
        const angsuran = row[`angsuran${i}`];
        const petugas = row[`petugas angsuran ${i}`]?.toString().toLowerCase().trim();
        
        if (angsuran && petugas && parseInt(angsuran) > 0) {
          const nominal = parseInt(angsuran) * 1000;
          const id_penagih = userMap.get(petugas)!;

          const penagihan = await db.orm.public.Penagihan.create({
            id_pesanan: pesanan.id_pesanan,
            id_penagih,
            percobaan_ke: i,
            status: 'BERHASIL',
            nominal,
            catatan: `Angsuran ke-${i} via Impor Excel`
          });

          totalDibayar += nominal;
          const fraction = nominal / total_harga;
          const komisiSales = Math.floor(fraction * 25000 * qty);
          const komisiNego = Math.floor(fraction * 10000 * qty);
          const komisiPenagih = 2000;

          await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisiSales, id_referensi: penagihan.id_penagihan, id_user: id_sales });
          await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisiNego, id_referensi: penagihan.id_penagihan, id_user: defaultNego.id_user });
          await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisiPenagih, id_referensi: penagihan.id_penagihan, id_user: id_penagih });
        }
      }

      if (totalDibayar >= total_harga) {
        await db.orm.public.Pesanan.where({ id_pesanan: pesanan.id_pesanan }).update({ status: 'LUNAS' });
      }

      successCount++;
    }

    console.log(`Selesai! Berhasil mengimpor ${successCount} data.`);
  } catch (error: any) {
    console.error(error);
  }
}

main().then(() => process.exit(0));
