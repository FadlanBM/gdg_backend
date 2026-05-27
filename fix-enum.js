const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await pool.query(`UPDATE transactions SET status_pesanan = 'selesai' WHERE status_pesanan = 'diproses' OR status_pesanan = 'dikirim'`);
  console.log('Updated existing transactions');
  process.exit(0);
}
main().catch(console.error);
