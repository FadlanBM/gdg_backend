ALTER TABLE "transactions" ALTER COLUMN "status_pesanan" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status_pesanan" SET DEFAULT 'menunggu'::text;--> statement-breakpoint
DROP TYPE "public"."status_pesanan";--> statement-breakpoint
CREATE TYPE "public"."status_pesanan" AS ENUM('menunggu', 'diterima', 'ditolak', 'selesai');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status_pesanan" SET DEFAULT 'menunggu'::"public"."status_pesanan";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status_pesanan" SET DATA TYPE "public"."status_pesanan" USING "status_pesanan"::"public"."status_pesanan";