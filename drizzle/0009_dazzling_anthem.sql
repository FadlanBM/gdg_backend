CREATE TYPE "public"."status_transaksi" AS ENUM('pending', 'accepted');--> statement-breakpoint
ALTER TYPE "public"."metode_bayar" ADD VALUE 'COD';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "petani_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "status_transaksi" "status_transaksi" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "tanggal_pengambilan" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_petani_id_users_id_fk" FOREIGN KEY ("petani_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;