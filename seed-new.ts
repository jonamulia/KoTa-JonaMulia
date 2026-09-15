import { db } from './src/prisma/db';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // Seed Users (already exists but we might as well ensure some are there or use existing ones if they weren't deleted)
  // Let's assume users weren't deleted since I didn't truncate User. 
  // We can just fetch a sales, nego, and penagih user.
  let salesUser = await db.orm.public.User.where({ role: 'SALES' }).first();
  let negoUser = await db.orm.public.User.where({ role: 'NEGO' }).first();
  let penagihUser = await db.orm.public.User.where({ role: 'PENAGIH' }).first();

  if (!salesUser) {
     salesUser = await db.orm.public.User.create({ nama: 'Sales A', username: 'sales_a', password, role: 'SALES' });
  }
  if (!negoUser) {
     negoUser = await db.orm.public.User.create({ nama: 'Nego A', username: 'nego_a', password, role: 'NEGO' });
  }
  if (!penagihUser) {
     penagihUser = await db.orm.public.User.create({ nama: 'Penagih A', username: 'penagih_a', password, role: 'PENAGIH' });
  }

  // Seed Barang
  const barang1 = await db.orm.public.Barang.create({ nama_barang: 'Lampu + Sprei', harga: 180000 });
  const barang2 = await db.orm.public.Barang.create({ nama_barang: 'Meja Lipat', harga: 120000 });

  // Seed Klien
  const klien1 = await db.orm.public.Klien.create({ nama: 'Sulaiman (RT03)', alamat: 'Jl. Gamer', kontak: '08123456789' });
  const klien2 = await db.orm.public.Klien.create({ nama: 'Budi (RT04)', alamat: 'Jl. Sudirman', kontak: '08987654321' });

  // Seed Pesanan 1
  const pesanan1 = await db.orm.public.Pesanan.create({
    status: 'AKTIF',
    id_klien: klien1.id_klien,
    id_barang: barang1.id_barang,
    total_harga: barang1.harga,
    id_sales: salesUser.id_user,
    id_nego: negoUser.id_user,
  });

  // Seed Penagihan for Pesanan 1 (1 failed, 1 success)
  await db.orm.public.Penagihan.create({
    id_pesanan: pesanan1.id_pesanan,
    id_penagih: penagihUser.id_user,
    percobaan_ke: 1,
    status: 'GAGAL',
    catatan: 'Rumah kosong',
  });

  await db.orm.public.Penagihan.create({
    id_pesanan: pesanan1.id_pesanan,
    id_penagih: penagihUser.id_user,
    percobaan_ke: 2,
    status: 'BERHASIL',
    nominal: 50000,
  });

  // Seed Pesanan 2
  const pesanan2 = await db.orm.public.Pesanan.create({
    status: 'AKTIF',
    id_klien: klien2.id_klien,
    id_barang: barang2.id_barang,
    total_harga: barang2.harga, // harga mutlak per user instruction
    id_sales: salesUser.id_user,
    id_nego: negoUser.id_user,
  });

  console.log('Seeding master data, pesanan, and penagihan successful!');
}

main().catch(console.error);
