import { db } from "../src/prisma/db";

async function main() {
  // 1. Get all KomisiLog for UANG_MASUK
  const logs = await db.orm.public.KomisiLog.where({ jenis_komisi: "UANG_MASUK" }).all();
  
  // 2. Get all Penagihan
  const penagihans = await db.orm.public.Penagihan.all();
  
  // 3. Get all Pesanan
  const pesanans = await db.orm.public.Pesanan.all();
  
  // 4. Get all Users
  const users = await db.orm.public.User.all();

  for (const log of logs) {
    const user = users.find(u => u.id_user === log.id_user);
    if (user && user.role === "PENAGIH") {
      const penagihan = penagihans.find(p => p.id_penagihan === log.id_referensi);
      if (penagihan) {
        const pesanan = pesanans.find(p => p.id_pesanan === penagihan.id_pesanan);
        if (pesanan) {
          const expectedKomisi = 2000 * (pesanan.qty || 1);
          if (log.nominal_masuk !== expectedKomisi) {
            console.log(`Fixing KomisiLog ${log.id_log} from ${log.nominal_masuk} to ${expectedKomisi}`);
            await db.orm.public.KomisiLog.where({ id_log: log.id_log }).update({
              nominal_masuk: expectedKomisi
            });
          }
        }
      }
    }
  }
  console.log("Done");
}

main().catch(console.error);
