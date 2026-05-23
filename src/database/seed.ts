import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const categoriesData = [
  { nama: 'Sayur', deskripsi: 'Produk sayur-mayur segar' },
  { nama: 'Buah', deskripsi: 'Produk buah-buahan segar' },
  { nama: 'Benih', deskripsi: 'Benih dan bibit tanaman' },
  { nama: 'Bumbu Dapur', deskripsi: 'Bumbu dapur dan rempah-rempah' },
  { nama: 'Olahan', deskripsi: 'Produk olahan hasil pertanian' },
  { nama: 'Peralatan', deskripsi: 'Peralatan dan perlengkapan pertanian' },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL tidak ditemukan di environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log('Mengisi data categories...');

  for (const cat of categoriesData) {
    try {
      await db.insert(schema.categories).values(cat).execute();
      console.log(`  ✓ ${cat.nama}`);
    } catch (e) {
      if (e.code === '23505') {
        console.log(`  - ${cat.nama} (already exists, skipped)`);
      } else {
        console.error(`  ✗ ${cat.nama}:`, e.message);
      }
    }
  }

  await pool.end();
  console.log('Seed selesai.');
}

seed();
