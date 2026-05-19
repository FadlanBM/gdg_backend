import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const productKategoriEnum = pgEnum('kategori', [
  'sayur',
  'buah',
  'benih',
]);
export const productStatusEnum = pgEnum('status', [
  'pending',
  'active',
  'non-active',
]);
export const metodeBayarEnum = pgEnum('metode_bayar', ['QRIS', 'Transfer']);
export const statusPembayaranEnum = pgEnum('status_pembayaran', [
  'menunggu',
  'berhasil',
  'gagal',
]);
export const statusPesananEnum = pgEnum('status_pesanan', [
  'diproses',
  'dikirim',
  'selesai',
]);

// 0. Tabel Roles
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 1. Tabel Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }), // nullable to support OAuth / Google Auth users
  googleId: varchar('google_id', { length: 255 }).unique(), // store google identity payload
  roleId: uuid('role_id')
    .references(() => roles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Tabel Profiles
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  namaLengkap: varchar('nama_lengkap', { length: 255 }).notNull(),
  nomorTelepon: varchar('nomor_telepon', { length: 20 }),
  alamatLengkap: text('alamat_lengkap'),
  titikLokasi: varchar('titik_lokasi', { length: 255 }),
  fotoProfil: varchar('foto_profil', { length: 500 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2.3 Tabel User Locations (Google Maps Coordinates & Details)
export const userLocations = pgTable('user_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  formattedAddress: text('formatted_address'),
  googlePlaceId: varchar('google_place_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2.5. Tabel Assets (Global)
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  type: varchar('type', { length: 50 }).default('other'), // 'temp', 'avatar', 'product', 'payment_proof', 'other'
  uploadedById: uuid('uploaded_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Tabel Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  petaniId: uuid('petani_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  namaProduk: varchar('nama_produk', { length: 255 }).notNull(),
  kategori: productKategoriEnum('kategori').notNull(),
  deskripsi: text('deskripsi'),
  stok: integer('stok').default(0),
  fotoUrl: varchar('foto_url', { length: 500 }),
  status: productStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Tabel AI_Analysis
export const aiAnalysis = pgTable('ai_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .unique()
    .references(() => products.id, { onDelete: 'cascade' }),
  skorKualitas: decimal('skor_kualitas', { precision: 5, scale: 2 }),
  gradeSni: varchar('grade_sni', { length: 5 }),
  saranHargaAi: decimal('saran_harga_ai', { precision: 12, scale: 2 }),
  hargaAkhirPetani: decimal('harga_akhir_petani', { precision: 12, scale: 2 }),
  analisisAt: timestamp('analisis_at').defaultNow().notNull(),
});

// 5. Tabel Carts
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  pembeliId: uuid('pembeli_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  productId: uuid('product_id').references(() => products.id, {
    onDelete: 'cascade',
  }),
  jumlah: integer('jumlah').notNull().default(1),
  isCheckout: boolean('is_checkout').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Tabel Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pembeliId: uuid('pembeli_id').references(() => users.id),
  totalPembayaran: decimal('total_pembayaran', {
    precision: 12,
    scale: 2,
  }).notNull(),
  metodeBayar: metodeBayarEnum('metode_bayar').notNull(),
  statusPembayaran:
    statusPembayaranEnum('status_pembayaran').default('menunggu'),
  statusPesanan: statusPesananEnum('status_pesanan').default('diproses'),
  buktiBayarUrl: varchar('bukti_bayar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Tabel Transaction_Items
export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: uuid('transaction_id').references(() => transactions.id, {
    onDelete: 'cascade',
  }),
  productId: uuid('product_id').references(() => products.id),
  jumlah: integer('jumlah').notNull(),
  hargaSnapshot: decimal('harga_snapshot', {
    precision: 12,
    scale: 2,
  }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  location: one(userLocations, {
    fields: [users.id],
    references: [userLocations.userId],
  }),
  products: many(products),
  carts: many(carts),
  transactions: many(transactions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  petani: one(users, {
    fields: [products.petaniId],
    references: [users.id],
  }),
  aiAnalysis: one(aiAnalysis, {
    fields: [products.id],
    references: [aiAnalysis.productId],
  }),
  cartItems: many(carts),
  transactionItems: many(transactionItems),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  product: one(products, {
    fields: [aiAnalysis.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  pembeli: one(users, {
    fields: [carts.pembeliId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [carts.productId],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    pembeli: one(users, {
      fields: [transactions.pembeliId],
      references: [users.id],
    }),
    items: many(transactionItems),
  }),
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    product: one(products, {
      fields: [transactionItems.productId],
      references: [products.id],
    }),
  }),
);
