import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Helper to filter by date (if start and end provided)
    const filterByDate = (dateString: string) => {
      if (!startDate || !endDate) return true;
      const d = new Date(dateString.toString());
      const start = new Date(startDate.toString());
      const end = new Date(endDate);
      // adjust end date to end of day
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    };

    // 1. Fetch Uang Masuk (Penagihan BERHASIL + Potongan Admin)
    const allPenagihan = await db.orm.public.Penagihan.all();
    const uangMasuk = allPenagihan
      .filter((p: any) => p.status === "BERHASIL" && filterByDate(p.tanggal))
      .map((p: any) => ({
        type: "SETORAN",
        id: p.id_penagihan,
        tanggal: p.tanggal,
        nominal: p.nominal,
        keterangan: `Setoran Penagihan (Klien: ${p.pesanan?.klien?.nama || "-"})`,
      }));

    // Admin ID
    const allUsers = await db.orm.public.User.all();
    const adminUser = allUsers.find(u => u.role === "ADMIN");
    let potonganAdmin = [];
    if (adminUser) {
      const allPotonganAdmin = await db.orm.public.Potongan.where({ id_user: adminUser.id_user }).all();
      potonganAdmin = allPotonganAdmin
        .filter((p: any) => filterByDate(p.tanggal))
        .map((p: any) => ({
          type: "PENGELUARAN_ADMIN",
          id: p.id_potongan,
          tanggal: p.tanggal,
          nominal: -p.nominal,
          keterangan: `Potongan Admin: ${p.jenis}`,
        }));
    }

    const rincianUangMasuk = [...uangMasuk, ...potonganAdmin].sort((a, b) => new Date(b.tanggal.toString()).getTime() - new Date(a.tanggal.toString()).getTime());

    // 2. Fetch Pesanan for Modal & Piutang
    const allPesanan = await db.orm.public.Pesanan.all();
    const filteredPesanan = allPesanan.filter((p: any) => filterByDate(p.tanggal));

    const rincianModal = filteredPesanan.map((p: any) => ({
      id_pesanan: p.id_pesanan,
      tanggal: p.tanggal,
      nama_klien: p.klien?.nama || "-",
      nama_barang: p.barang?.nama_barang || "-",
      qty: p.qty || 1,
      harga_beli: p.barang?.harga_beli || 0,
      total_modal: (p.barang?.harga_beli || 0) * (p.qty || 1),
    })).sort((a, b) => new Date(b.tanggal.toString()).getTime() - new Date(a.tanggal.toString()).getTime());

    const rincianPiutang = filteredPesanan.map((p: any) => ({
      id_pesanan: p.id_pesanan,
      tanggal: p.tanggal,
      nama_klien: p.klien?.nama || "-",
      nama_barang: p.barang?.nama_barang || "-",
      total_harga: p.total_harga,
      status: p.status,
    })).sort((a, b) => new Date(b.tanggal.toString()).getTime() - new Date(a.tanggal.toString()).getTime());

    // 3. Fetch Komisi Cair (KomisiLog UANG_MASUK for non-admin)
    const adminIds = allUsers.filter(u => u.role === "ADMIN").map(u => u.id_user);
    const allKomisiLogs = await db.orm.public.KomisiLog.all();
    const rincianKomisi = allKomisiLogs
      .filter((k: any) => (k.jenis_komisi === 'UANG_MASUK' || k.jenis_komisi === 'TIPS_PENAGIH') && !adminIds.includes(k.id_user) && filterByDate(k.created_at || new Date().toISOString()))
      .map((k: any) => {
        const user = allUsers.find(u => u.id_user === k.id_user);
        return {
          id_komisi: k.id_log,
          tanggal: k.created_at || new Date().toISOString(),
          nama_user: user?.nama || "-",
          role: user?.role || "-",
          nominal: k.nominal_masuk,
          jenis: k.jenis_komisi,
          keterangan: k.keterangan || (k.jenis_komisi === 'TIPS_PENAGIH' ? 'Tips Tambahan' : 'Komisi Otomatis'),
        };
      })
      .sort((a, b) => new Date(b.tanggal.toString()).getTime() - new Date(a.tanggal.toString()).getTime());

    return NextResponse.json({
      uangMasuk: rincianUangMasuk,
      modal: rincianModal,
      piutang: rincianPiutang,
      komisi: rincianKomisi,
    });

  } catch (error: any) {
    console.error("Laporan error:", error.stack || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
