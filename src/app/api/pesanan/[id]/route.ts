import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await props.params;
    const data = await req.json();
    const pesananId = parseInt(id);

    const updateData: any = {};
    if (data.id_klien !== undefined) updateData.id_klien = parseInt(data.id_klien);
    if (data.id_barang !== undefined) updateData.id_barang = parseInt(data.id_barang);
    if (data.qty !== undefined) updateData.qty = parseInt(data.qty);
    if (data.total_harga !== undefined) updateData.total_harga = parseInt(data.total_harga);
    if (data.status) updateData.status = data.status;
    if (data.id_sales !== undefined) updateData.id_sales = parseInt(data.id_sales);
    if (data.id_nego !== undefined) updateData.id_nego = parseInt(data.id_nego);

    // Get current pesanan to compare or use defaults if not provided
    const oldPesanan = await db.orm.public.Pesanan.where({ id_pesanan: pesananId }).first();
    if (!oldPesanan) return NextResponse.json({ error: "Pesanan not found" }, { status: 404 });

    // Update Pesanan
    await db.orm.public.Pesanan.where({ id_pesanan: pesananId }).update(updateData);

    const newPesanan = { ...oldPesanan, ...updateData };

    // Find all Penagihan for this Pesanan
    const allPenagihan = await db.orm.public.Penagihan.where({ id_pesanan: pesananId }).all();
    const penagihanIds = allPenagihan.map(p => p.id_penagihan);

    if (penagihanIds.length > 0) {
      // 1. Delete all existing KomisiLog for these Penagihan
      for (const pId of penagihanIds) {
        await db.orm.public.KomisiLog.where({ id_referensi: pId }).deleteAll();
      }

      // 2. Re-create KomisiLog with new calculations
      for (const penagihan of allPenagihan) {
        if (penagihan.status === 'BERHASIL' && penagihan.nominal) {
          const fraction = penagihan.nominal / newPesanan.total_harga;
          
          const komisiSales = Math.floor(fraction * 25000 * (newPesanan.qty || 1));
          const komisiNego = Math.floor(fraction * 10000 * (newPesanan.qty || 1));
          const komisiPenagih = 2000;

          await db.orm.public.KomisiLog.create({
            jenis_komisi: "UANG_MASUK",
            nominal_masuk: komisiSales,
            id_referensi: penagihan.id_penagihan,
            id_user: newPesanan.id_sales,
          });
          await db.orm.public.KomisiLog.create({
            jenis_komisi: "UANG_MASUK",
            nominal_masuk: komisiNego,
            id_referensi: penagihan.id_penagihan,
            id_user: newPesanan.id_nego,
          });
          await db.orm.public.KomisiLog.create({
            jenis_komisi: "UANG_MASUK",
            nominal_masuk: komisiPenagih,
            id_referensi: penagihan.id_penagihan,
            id_user: penagihan.id_penagih,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await props.params;
    const pesananId = parseInt(id);

    // Cari semua penagihan untuk pesanan ini
    const penagihan = await db.orm.public.Penagihan.where({ id_pesanan: pesananId }).all();
    const penagihanIds = penagihan.map(p => p.id_penagihan);
    
    // Hapus KomisiLog terkait
    for (const pId of penagihanIds) {
      await db.orm.public.KomisiLog.where({ id_referensi: pId }).deleteAll();
    }
    
    // Hapus penagihan
    await db.orm.public.Penagihan.where({ id_pesanan: pesananId }).deleteAll();
    
    // Hapus pesanan
    await db.orm.public.Pesanan.where({ id_pesanan: pesananId }).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
