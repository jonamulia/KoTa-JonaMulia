import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const barang = await db.orm.public.Barang.where({}).all();
  return NextResponse.json(barang);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { nama_barang, harga, harga_beli, komisi_penjualan } = await req.json();
    const barang = await db.orm.public.Barang.create({
      nama_barang,
      harga: parseInt(harga),
      harga_beli: harga_beli ? parseInt(harga_beli) : 0,
      komisi_penjualan: komisi_penjualan ? parseInt(komisi_penjualan) : 0,
    });
    return NextResponse.json({ success: true, barang });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
