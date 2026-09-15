import { db } from "./src/prisma/db.ts";

async function main() {
  try {
    const allPenagihan = await db.orm.public.Penagihan.all();
    console.log("Penagihan:", allPenagihan.length);
    const allUsers = await db.orm.public.User.all();
    console.log("Users:", allUsers.length);
    const allPotonganAdmin = await db.orm.public.Potongan.where({ id_user: 1 }).all();
    console.log("PotonganAdmin:", allPotonganAdmin.length);
    const allPesanan = await db.orm.public.Pesanan.all();
    console.log("Pesanan:", allPesanan.length);
    const allKomisiLogs = await db.orm.public.KomisiLog.where({ jenis_komisi: 'UANG_MASUK' }).all();
    console.log("KomisiLogs:", allKomisiLogs.length);
    console.log('SUCCESS');
  } catch (e: any) {
    console.error('ERROR', e.stack || e);
  }
}
main();
