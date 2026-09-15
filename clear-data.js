import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function clear() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    await client.query('TRUNCATE "komisiLog", "pembayaran", "potongan", "pesanan" CASCADE;');
    console.log('Successfully truncated all tables');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

clear();
