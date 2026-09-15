import { db } from './src/prisma/db';

async function clear() {
  try {
    await db.orm.public.$execute`DELETE FROM komisi_log`;
    await db.orm.public.$execute`DELETE FROM pembayaran`;
    await db.orm.public.$execute`DELETE FROM pesanan`;
    console.log('Cleared existing data.');
  } catch (err) {
    console.error(err);
  }
}

clear();
