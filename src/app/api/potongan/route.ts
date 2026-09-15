import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const potongan = await db.orm.public.Potongan.where({}).include('user').all();
  
  const result = potongan.map((p: any) => ({
    id_potongan: p.id_potongan,
    jenis: p.jenis,
    nominal: p.nominal,
    tanggal: String(p.tanggal),
    id_user: p.id_user,
    user_nama: p.user?.nama || "-",
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { jenis, nominal, id_user } = await req.json();
    const parsedNominal = parseInt(nominal);
    const parsedIdUser = parseInt(id_user);
    
    // Check if it's UANG SAKU
    if (jenis === "UANG SAKU") {
      // Get the target user's role to determine the ratio
      const targetUser = await db.orm.public.User.findFirst({ where: { id_user: parsedIdUser } });
      if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      const adminUtama = await db.orm.public.User.findFirst({ where: { role: "ADMIN" } });
      if (!adminUtama) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

      // Determine ratio
      let ratioSaku = 0.7; // default fallback (e.g. 35/50)
      if (targetUser.role === "SALES") ratioSaku = 35 / 50;
      if (targetUser.role === "NEGO" || targetUser.role === "PENAGIH") ratioSaku = 30 / 50;
      
      const nominalSaku = Math.round(parsedNominal * ratioSaku);
      const nominalBensin = parsedNominal - nominalSaku;

      // 1. Create potongan Uang Saku for User
      const potonganUser = await db.orm.public.Potongan.create({
        jenis: "UANG SAKU",
        nominal: nominalSaku,
        id_user: parsedIdUser,
      });
      await db.orm.public.KomisiLog.create({
        jenis_komisi: "POTONGAN",
        nominal_masuk: -nominalSaku,
        id_referensi: potonganUser.id_potongan,
        id_user: parsedIdUser,
      });

      // 2. Create potongan Bensin for Admin
      const potonganAdmin = await db.orm.public.Potongan.create({
        jenis: `BENSIN (${targetUser.nama})`,
        nominal: nominalBensin,
        id_user: adminUtama.id_user,
      });
      await db.orm.public.KomisiLog.create({
        jenis_komisi: "POTONGAN",
        nominal_masuk: -nominalBensin,
        id_referensi: potonganAdmin.id_potongan,
        id_user: adminUtama.id_user,
      });

      return NextResponse.json({ success: true, potongan: potonganUser });
    }

    // Default flow (non-UANG SAKU)
    // 1. Create potongan
    const potongan = await db.orm.public.Potongan.create({
      jenis,
      nominal: parsedNominal,
      id_user: parsedIdUser,
    });

    // 2. Log as negative commission (deduction)
    await db.orm.public.KomisiLog.create({
      jenis_komisi: "POTONGAN",
      nominal_masuk: -parsedNominal,
      id_referensi: potongan.id_potongan,
      id_user: parsedIdUser,
    });

    return NextResponse.json({ success: true, potongan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
