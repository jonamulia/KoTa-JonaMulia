import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    const { nama_barang, harga, harga_beli, komisi_penjualan } = await req.json();
    
    const updated = await db.orm.public.Barang.where({ id_barang: id }).update({
      nama_barang,
      harga: parseInt(harga),
      harga_beli: parseInt(harga_beli),
      komisi_penjualan: parseInt(komisi_penjualan),
    });
    const barang = updated;
    
    return NextResponse.json({ success: true, barang });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id_param = params.id;
    const id = parseInt(id_param);
    const deleted = await db.orm.public.Barang.where({ id_barang: id }).delete();
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
