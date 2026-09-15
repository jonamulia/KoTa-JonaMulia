import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = Number(session.user.id);
  
  let query: any = {};
  if (role === "SALES") query = { id_sales: userId };
  if (role === "NEGO") query = { id_nego: userId };

  const pesanan = await db.orm.public.Pesanan.where(query)
    .include('klien')
    .include('barang')
    .include('sales')
    .include('nego')
    .include('penagihan')
    .all();

  // If role is PENAGIH, they technically don't own pesanan directly.
  // But they might want to see pesanan that they have billed.
  // So we filter it post-query for Penagih.
  let filteredPesanan = pesanan;
  if (role === "PENAGIH") {
    filteredPesanan = pesanan.filter((p: any) => 
      p.penagihan?.some((pen: any) => pen.id_penagih === userId)
    );
  }

  const komisiLogs = await db.orm.public.KomisiLog.where({ id_user: userId, jenis_komisi: 'UANG_MASUK' }).all();

  const result = filteredPesanan.map((p: any) => {
    const total_dibayar = p.penagihan?.filter((pen: any) => pen.status === 'BERHASIL').reduce((sum: number, b: any) => sum + b.nominal, 0) || 0;
    const penagihanIds = p.penagihan?.map((pen: any) => pen.id_penagihan) || [];
    
    let komisi_didapat = 0;
    if (role === 'SALES') komisi_didapat = (p.barang?.komisi_penjualan || 25000) * (p.qty || 1);
    if (role === 'NEGO') komisi_didapat = 10000 * (p.qty || 1);
    if (role === 'PENAGIH') komisi_didapat = 2000 * (p.penagihan?.length || 0); // Assuming 2000 per penagihan for this pesanan
    
    const komisi_cair = komisiLogs
      .filter((log: any) => penagihanIds.includes(log.id_referensi))
      .reduce((sum: number, log: any) => sum + log.nominal_masuk, 0);

    return {
      id_pesanan: p.id_pesanan,
      tanggal: p.tanggal,
      qty: p.qty,
      id_klien: p.id_klien,
      nama_klien: p.klien?.nama || "-",
      id_barang: p.id_barang,
      nama_barang: p.barang?.nama_barang || "-",
      total_harga: p.total_harga,
      status: p.status,
      id_sales: p.id_sales,
      id_nego: p.id_nego,
      sales_nama: p.sales?.nama || "-",
      nego_nama: p.nego?.nama || "-",
      total_dibayar,
      komisi_didapat,
      komisi_cair,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id_klien, id_barang, total_harga, id_sales, id_nego, qty, tanggal } = await req.json();
    const pesanan = await db.orm.public.Pesanan.create({
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      id_klien: parseInt(id_klien),
      id_barang: parseInt(id_barang),
      qty: qty ? parseInt(qty) : 1,
      total_harga: parseInt(total_harga),
      status: "AKTIF",
      id_sales: parseInt(id_sales),
      id_nego: parseInt(id_nego),
    });
    return NextResponse.json({ success: true, pesanan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
