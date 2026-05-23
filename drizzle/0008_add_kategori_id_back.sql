ALTER TABLE "products" ADD COLUMN "kategori_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_kategori_id_categories_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;