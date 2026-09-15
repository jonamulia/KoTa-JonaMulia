import { Temporal } from '@js-temporal/polyfill';
Object.defineProperty(globalThis, 'Temporal', { value: Temporal });
import { db } from './src/prisma/db.ts';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🔧 Seeding database...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const usersData = [
    { nama: 'Dwikey', username: 'dwikey', password: hashedPassword, role: 'SALES' },
    { nama: 'Saet', username: 'saet', password: hashedPassword, role: 'SALES' },
    { nama: 'Bagas', username: 'bagas', password: hashedPassword, role: 'SALES' },
    { nama: 'Huda', username: 'huda', password: hashedPassword, role: 'NEGO' },
    { nama: 'Amjad', username: 'amjad', password: hashedPassword, role: 'PENAGIH' },
  ];

  const createdUsers: Record<string, number> = {};

  const existingAdmin = await db.orm.public.User.where({ username: 'admin' }).first();
  if (existingAdmin) {
    createdUsers['admin'] = existingAdmin.id_user;
  }

  for (const u of usersData) {
    const existing = await db.orm.public.User.where({ username: u.username }).first();
    if (existing) {
      createdUsers[u.username] = existing.id_user;
    } else {
      const created = await db.orm.public.User.create(u);
      createdUsers[u.username] = created.id_user;
    }
  }
  
  console.log('  Users seeded.');

  // Removed clear logic to avoid table name resolution issues

  const pesananData = [
    { nama_klien: 'RT (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Kemi (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Mila (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Tikar', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Siti (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Yastim (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Wama (Sulaiman, Gamer RT03/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'HJ (Fitriani, Gamer RT04/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Fitriani (Fitriani, Gamer RT04/02)', nama_barang: 'Lampu + Tikar', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Rohimah (Fitriani, Gamer RT04/02)', nama_barang: 'Lampu x2', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Lestari (Fitriani, Gamer RT04/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Marwah (Sarimurni, Gamer RT02/02)', nama_barang: 'Lampu x2', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Sulastri (Sarimurni, Gamer RT02/02)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Ana (Ana, Gamer RT01/08)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Ima (Ana, Gamer RT01/08)', nama_barang: 'Lampu + Sprei', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
    { nama_klien: 'Amiroh (Mujahidin, Gamer RT03/05)', nama_barang: 'Lampu x2', total_harga: 180000, sales: 'dwikey', nego: 'huda' },
  ];

  const pembayaranMap: Record<number, number[]> = {
    0: [50000, 50000],          // RT: 50+50=100
    1: [50000, 50000],          // Kemi: 50+50=100
    2: [50000, 50000],          // Mila: 50+50=100
    3: [50000, 50000],          // Siti: 50+50=100
    4: [50000, 50000],          // Yastim: 50+50=100
    5: [50000, 50000],          // Wama: 50+50=100
    6: [180000],                // HJ: LUNAS 180
    7: [50000, 50000],          // Fitriani: 50+50=100
    8: [50000, 130000],         // Rohimah: 50+130=180 LUNAS
    9: [50000, 70000, 10000],   // Lestari: 50+70+10=130
    10: [60000, 60000],         // Marwah: 60+60=120
    11: [60000, 60000],         // Sulastri: 60+60=120
    12: [60000, 60000],         // Ana: 60+60=120
    13: [60000, 20000],         // Ima: 60+20=80
    14: [60000, 60000],         // Amiroh: 60+60=120
  };

  for (let i = 0; i < pesananData.length; i++) {
    const p = pesananData[i];
    const totalBayar = (pembayaranMap[i] || []).reduce((a, b) => a + b, 0);
    const status = totalBayar >= p.total_harga ? 'LUNAS' : 'AKTIF';
    
    const pesanan = await db.orm.public.Pesanan.create({
      nama_klien: p.nama_klien,
      nama_barang: p.nama_barang,
      total_harga: p.total_harga,
      status,
      id_sales: createdUsers[p.sales],
      id_nego: createdUsers[p.nego],
    });
    console.log(`  Created pesanan: ${p.nama_klien}`);

    const angsuranList = pembayaranMap[i] || [];
    for (const nominal of angsuranList) {
      const bayar = await db.orm.public.Pembayaran.create({
        nominal,
        id_pesanan: pesanan.id_pesanan,
        id_penagih: createdUsers['amjad'],
      });

      const komisi = Math.floor(nominal * 0.05);
      await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisi, id_referensi: bayar.id_bayar, id_user: createdUsers[p.sales] });
      await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisi, id_referensi: bayar.id_bayar, id_user: createdUsers[p.nego] });
      await db.orm.public.KomisiLog.create({ jenis_komisi: 'UANG_MASUK', nominal_masuk: komisi, id_referensi: bayar.id_bayar, id_user: createdUsers['amjad'] });
    }
  }

  const potonganData = [
    { jenis: 'KASBON', nominal: 30000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 30000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 35000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 35000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 35000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 22000, user: 'dwikey' },
    { jenis: 'KASBON', nominal: 30000, user: 'amjad' },
    { jenis: 'KASBON', nominal: 30000, user: 'amjad' },
    { jenis: 'KASBON', nominal: 25000, user: 'huda' },
  ];

  for (const pt of potonganData) {
    const pot = await db.orm.public.Potongan.create({
      jenis: pt.jenis,
      nominal: pt.nominal,
      id_user: createdUsers[pt.user],
    });
    await db.orm.public.KomisiLog.create({
      jenis_komisi: 'POTONGAN',
      nominal_masuk: -pt.nominal,
      id_referensi: pot.id_potongan,
      id_user: createdUsers[pt.user],
    });
  }
  
  console.log('✅ Seed complete!');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
