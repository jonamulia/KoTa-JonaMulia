import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // also include klien and barang in pesanan so we can show their names!
  // Wait, Prisma Composer doesn't support nested includes easily without chaining differently?
  // Let's just fetch pesanan relations separately or rely on pesanan APIs.
  const role = session.user.role;
  const userId = Number(session.user.id);
  
  let query: any = {};
  if (role === "PENAGIH") query = { id_penagih: userId };

  const penagihan = await db.orm.public.Penagihan.where(query)
    .include('pesanan')
    .include('penagih')
    .all();
    
  // Post-filter for SALES and NEGO so they only see penagihan for their own pesanan
  let filteredPenagihan = penagihan;
  if (role === "SALES" || role === "NEGO") {
    filteredPenagihan = penagihan.filter((p: any) => {
      const isMySales = role === "SALES" && p.pesanan?.id_sales === userId;
      const isMyNego = role === "NEGO" && p.pesanan?.id_nego === userId;
      return isMySales || isMyNego;
    });
  }

  const result = filteredPenagihan.map((p: any) => ({
    id_penagihan: p.id_penagihan,
    percobaan_ke: p.percobaan_ke,
    status: p.status,
    nominal: p.nominal,
    catatan: p.catatan,
    tanggal: String(p.tanggal),
    id_pesanan: p.id_pesanan,
    id_penagih: p.id_penagih,
    penagih_nama: p.penagih?.nama || "-",
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id_pesanan, id_penagih, status, catatan, nominal } = await req.json();
    
    // determine percobaan_ke
    const pastPenagihan = await db.orm.public.Penagihan.where({ id_pesanan: parseInt(id_pesanan) }).all();
    const percobaan_ke = pastPenagihan.length + 1;

    if (percobaan_ke > 5) {
      return NextResponse.json({ error: "Batas maksimal 5x penagihan sudah tercapai." }, { status: 400 });
    }

    // 1. Create penagihan
    const penagihan = await db.orm.public.Penagihan.create({
      id_pesanan: parseInt(id_pesanan),
      id_penagih: parseInt(id_penagih),
      percobaan_ke,
      status, // "BERHASIL" | "GAGAL"
      catatan: catatan || null,
      nominal: nominal ? parseInt(nominal) : null,
    });

    // 2. Get the pesanan data
    const pesanan = await db.orm.public.Pesanan.where({ id_pesanan: parseInt(id_pesanan) }).include('penagihan').first();
    
    if (pesanan) {
      if (status === 'BERHASIL' && nominal) {
        // Calculate commissions based on fraction of money collected
        // Fraction = nominal / total_harga
        const fraction = parseInt(nominal) / pesanan.total_harga;
        
        // Sales gets fraction * 25.000 * qty
        const komisiSales = Math.floor(fraction * 25000 * (pesanan.qty || 1));
        // Nego gets fraction * 10.000 * qty
        const komisiNego = Math.floor(fraction * 10000 * (pesanan.qty || 1));
        // Penagih gets flat 2.000 per qty per successful collection
        const komisiPenagih = 2000 * (pesanan.qty || 1);

        await db.orm.public.KomisiLog.create({
          jenis_komisi: "UANG_MASUK",
          nominal_masuk: komisiSales,
          id_referensi: penagihan.id_penagihan,
          id_user: pesanan.id_sales,
        });
        await db.orm.public.KomisiLog.create({
          jenis_komisi: "UANG_MASUK",
          nominal_masuk: komisiNego,
          id_referensi: penagihan.id_penagihan,
          id_user: pesanan.id_nego,
        });
        await db.orm.public.KomisiLog.create({
          jenis_komisi: "UANG_MASUK",
          nominal_masuk: komisiPenagih,
          id_referensi: penagihan.id_penagihan,
          id_user: parseInt(id_penagih),
        });

        // Check if pesanan is fully paid → update status to LUNAS
        const totalDibayar = pesanan.penagihan?.filter((p:any) => p.status==='BERHASIL').reduce((sum: number, b: any) => sum + b.nominal, 0) || 0;
        if (totalDibayar >= pesanan.total_harga) {
          await db.orm.public.Pesanan.where({ id_pesanan: parseInt(id_pesanan) }).update({ status: "LUNAS" });
        }
      }

      // If failed 5 times or reached 5 times and still not LUNAS, mark MACET
      if (percobaan_ke >= 5) {
        const checkPesanan = await db.orm.public.Pesanan.where({ id_pesanan: parseInt(id_pesanan) }).first();
        if (checkPesanan && checkPesanan.status !== 'LUNAS') {
          await db.orm.public.Pesanan.where({ id_pesanan: parseInt(id_pesanan) }).update({ status: "MACET" });
        }
      }
    }

    return NextResponse.json({ success: true, penagihan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
