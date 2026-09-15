import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    await db.orm.public.KomisiLog.where({ id_log: id }).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete koreksi error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    const { nominal, keterangan } = await req.json();

    if (!nominal) {
      return NextResponse.json({ error: "Nominal harus diisi" }, { status: 400 });
    }

    const updated = await db.orm.public.KomisiLog.where({ id_log: id }).update({
      nominal_masuk: parseInt(nominal),
      keterangan: keterangan || "",
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Update koreksi error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
