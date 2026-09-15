import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.orm.public.User.all();
  // Don't send passwords to the frontend
  const safeUsers = users.map((u: any) => ({
    id_user: u.id_user,
    nama: u.nama,
    username: u.username,
    role: u.role
  }));

  return NextResponse.json(safeUsers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { nama, username, password, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.orm.public.User.create({
      nama,
      username,
      password: hashedPassword,
      role
    });
    return NextResponse.json({ success: true, user: { id_user: user.id_user, username: user.username } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
