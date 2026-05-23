CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"deskripsi" text,
	"icon" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_nama_unique" UNIQUE("nama")
);
