import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const existingAdmin = await db.orm.public.User
      .where({ username: "admin" })
      .first();

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await db.orm.public.User.create({
      nama: "Administrator",
      username: "admin",
      password: hashedPassword,
      role: "ADMIN"
    });

    return NextResponse.json({ message: "Admin created successfully.", user: admin.username });
  } catch (error: any) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Failed to create admin.", details: error.message || String(error) }, { status: 500 });
  }
}
