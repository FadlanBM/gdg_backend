CREATE TYPE "public"."metode_bayar" AS ENUM('QRIS', 'Transfer');--> statement-breakpoint
CREATE TYPE "public"."kategori" AS ENUM('sayur', 'buah', 'benih');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'active', 'non-active');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('petani', 'pembeli');--> statement-breakpoint
CREATE TYPE "public"."status_pembayaran" AS ENUM('menunggu', 'berhasil', 'gagal');--> statement-breakpoint
CREATE TYPE "public"."status_pesanan" AS ENUM('diproses', 'dikirim', 'selesai');--> statement-breakpoint
CREATE TABLE "ai_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"skor_kualitas" numeric(5, 2),
	"grade_sni" varchar(5),
	"saran_harga_ai" numeric(12, 2),
	"harga_akhir_petani" numeric(12, 2),
	"analisis_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_analysis_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pembeli_id" uuid,
	"product_id" uuid,
	"jumlah" integer DEFAULT 1 NOT NULL,
	"is_checkout" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"petani_id" uuid,
	"nama_produk" varchar(255) NOT NULL,
	"kategori" "kategori" NOT NULL,
	"deskripsi" text,
	"stok" integer DEFAULT 0,
	"foto_url" varchar(500),
	"status" "status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"nama_lengkap" varchar(255) NOT NULL,
	"nomor_telepon" varchar(20),
	"alamat_lengkap" text,
	"titik_lokasi" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" uuid,
	"product_id" uuid,
	"jumlah" integer NOT NULL,
	"harga_snapshot" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pembeli_id" uuid,
	"total_pembayaran" numeric(12, 2) NOT NULL,
	"metode_bayar" "metode_bayar" NOT NULL,
	"status_pembayaran" "status_pembayaran" DEFAULT 'menunggu',
	"status_pesanan" "status_pesanan" DEFAULT 'diproses',
	"bukti_bayar_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_pembeli_id_users_id_fk" FOREIGN KEY ("pembeli_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_petani_id_users_id_fk" FOREIGN KEY ("petani_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pembeli_id_users_id_fk" FOREIGN KEY ("pembeli_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;