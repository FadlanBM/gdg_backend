ALTER TABLE "products" DROP COLUMN "kategori";
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "kategori_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_kategori_id_categories_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
DROP TYPE "public"."kategori";
--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "icon";
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "harga" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tipe_stok" varchar(50) DEFAULT 'kg';
