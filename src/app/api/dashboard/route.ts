import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  let pesananQuery: any = {};
  if (role === "SALES") pesananQuery = { id_sales: Number(userId) };
  if (role === "NEGO") pesananQuery = { id_nego: Number(userId) };
  
  let penagihanQuery: any = {};
  if (role === "PENAGIH") penagihanQuery = { id_penagih: Number(userId) };
  // If sales/nego, we only want their pesanan's penagihan, but doing relational filtering in Memory is easier here for a small dataset, or we just fetch all and filter.
  
  const allPesananRaw = await db.orm.public.Pesanan.where(pesananQuery).include('barang').all();
  
  // For SALES/NEGO, penagihan should only be for their pesanan
  // For PENAGIH, pesanan might not be directly linked by an ID on the Pesanan table, but they only care about their Penagihan anyway
  let allPenagihan = await db.orm.public.Penagihan.where(penagihanQuery).all();
  
  if (role === "SALES" || role === "NEGO") {
    const pesananIds = allPesananRaw.map((p: any) => p.id_pesanan);
    allPenagihan = allPenagihan.filter((p: any) => pesananIds.includes(p.id_pesanan));
  }
  
  if (role === "PENAGIH") {
    // If Penagih, their "pesanan" count could just be the unique pesanan they billed
    const uniquePesananIds = new Set(allPenagihan.map((p: any) => p.id_pesanan));
    pesananQuery = {}; // resetting
  }

  const allPesanan = role === "PENAGIH" 
    ? await db.orm.public.Pesanan.where({}).include('barang').all().then(all => all.filter(p => new Set(allPenagihan.map(x => x.id_pesanan)).has(p.id_pesanan))) 
    : allPesananRaw;

  const successfulPenagihan = allPenagihan.filter((p: any) => p.status === "BERHASIL");
  const allUsers = await db.orm.public.User.all();

  const totalPesanan = allPesanan.length;
  const pesananAktif = allPesanan.filter((p: any) => p.status === "AKTIF").length;
  const pesananLunas = allPesanan.filter((p: any) => p.status === "LUNAS").length;
  
  let totalPendapatan = 0;
  let totalModal = 0;
  let totalPiutang = 0;
  let totalKomisi = 0;
  let profit = 0;

  if (role === "ADMIN") {
    const sumSetoran = successfulPenagihan.reduce((sum: number, p: any) => sum + p.nominal, 0);
    const potonganAdmin = await db.orm.public.Potongan.where({ id_user: parseInt(userId) }).all();
    const sumPotonganAdmin = potonganAdmin.reduce((sum: number, p: any) => sum + p.nominal, 0);
    totalPendapatan = sumSetoran - sumPotonganAdmin; // Uang Masuk Bersih

    // Total Modal & Piutang (Ekspektasi Saldo) from all pesanan
    totalPiutang = allPesanan.reduce((sum: number, p: any) => sum + p.total_harga, 0);
    totalModal = allPesanan.reduce((sum: number, p: any) => sum + ((p.barang?.harga_beli || 0) * (p.qty || 1)), 0);

    // Total Komisi (Beban Komisi) for all non-admin users, including Tips
    const allKomisiLogs = await db.orm.public.KomisiLog.all();
    // Exclude admin if admin ever has UANG_MASUK (usually they don't, but just in case)
    const adminIds = allUsers.filter(u => u.role === "ADMIN").map(u => u.id_user);
    totalKomisi = allKomisiLogs
      .filter((k: any) => (k.jenis_komisi === 'UANG_MASUK' || k.jenis_komisi === 'TIPS_PENAGIH') && !adminIds.includes(k.id_user))
      .reduce((sum: number, k: any) => sum + (k.nominal_masuk || 0), 0);

    profit = totalPendapatan - totalModal - totalKomisi;

  } else {
    const komisi = await db.orm.public.KomisiLog.where({ id_user: parseInt(userId) }).all();
    // KomisiLog already contains negative values for deductions, so we just sum it.
    totalPendapatan = komisi.reduce((sum: number, k: any) => sum + (k.nominal_masuk || 0) - (k.nominal_keluar || 0), 0);
  }
  
  const totalUsers = allUsers.length;

  const recentPembayaran = successfulPenagihan
    .sort((a: any, b: any) => new Date(String(b.tanggal)).getTime() - new Date(String(a.tanggal)).getTime())
    .slice(0, 5)
    .map((p: any) => ({
      id_bayar: p.id_penagihan,
      nominal: p.nominal,
      tanggal: String(p.tanggal),
    }));

  return NextResponse.json({
    role,
    totalPesanan,
    pesananAktif,
    pesananLunas,
    totalPendapatan,
    totalPiutang,
    totalModal,
    profit,
    totalUsers,
    recentPembayaran,
    user: { name: session.user.name, role: session.user.role },
  });
}
