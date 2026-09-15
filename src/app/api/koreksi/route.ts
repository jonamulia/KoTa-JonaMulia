import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tips = await db.orm.public.KomisiLog.where({ jenis_komisi: "TIPS_PENAGIH" }).include('user').all();
    
    const result = tips.map((t: any) => ({
      id_log: t.id_log,
      tanggal: String(t.created_at || new Date().toISOString()),
      id_penagih: t.id_user,
      nama_penagih: t.user?.nama || "-",
      nominal: t.nominal_masuk,
      keterangan: t.keterangan || "-",
    })).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id_penagih, nominal, keterangan } = await req.json();

    if (!id_penagih || !nominal) {
      return NextResponse.json({ error: "Penagih dan Nominal harus diisi" }, { status: 400 });
    }

    // Buat log komisi dengan jenis khusus "TIPS_PENAGIH"
    // Nominal disimpan sebagai nominal_masuk (uang masuk bagi penagih)
    const log = await db.orm.public.KomisiLog.create({
      jenis_komisi: "TIPS_PENAGIH",
      nominal_masuk: parseInt(nominal),
      keterangan: keterangan || "",
      id_user: parseInt(id_penagih),
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
