import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await props.params;
    const { nama, username, password, role } = await req.json();
    const userId = parseInt(id);
    
    let updateData: any = { nama, username, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await db.orm.public.User.where({ id_user: userId }).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await props.params;
    const userId = parseInt(id);
    await db.orm.public.User.where({ id_user: userId }).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
