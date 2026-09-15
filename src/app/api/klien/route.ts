import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const klien = await db.orm.public.Klien.where({}).all();
  return NextResponse.json(klien);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { nama, alamat, kontak } = await req.json();
    const newKlien = await db.orm.public.Klien.create({
      nama,
      alamat: alamat || null,
      kontak: kontak || null,
    });
    return NextResponse.json({ success: true, klien: newKlien });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
