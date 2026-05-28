# 🌾 GDG Backend — Marketplace Pertanian

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

**GDG Backend** adalah backend REST API untuk platform **marketplace pertanian** yang menghubungkan petani dengan pembeli secara langsung. Dilengkapi dengan fitur **AI-powered product analysis** menggunakan LangChain + OpenAI untuk menganalisis kualitas dan estimasi harga produk pertanian dari foto.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur & Struktur Folder](#-arsitektur--struktur-folder)
- [Database Schema](#-database-schema)
- [Package & Library](#-package--library)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Scripts](#-scripts)

---

## ✨ Fitur Utama

- [x] **Autentikasi** — Register, Login (JWT) & Google OAuth
- [x] **Manajemen User** — Profil, lokasi (koordinat GPS), saldo petani
- [x] **Manajemen Produk** — CRUD produk pertanian dengan multi-image upload
- [x] **AI Product Analyzer** — Analisis kualitas, grading SNI, dan estimasi harga via AI (LangChain + OpenAI Vision)
- [x] **Kategori Produk** — Kategori untuk produk pertanian
- [x] **Keranjang Belanja** — Cart system untuk pembeli
- [x] **Transaksi** — Order, pembayaran (QRIS/Transfer/COD), status tracking
- [x] **Harga Pangan** — Informasi harga pangan terkini
- [x] **Swagger API Docs** — Dokumentasi API interaktif otomatis
- [x] **File Upload** — Upload gambar produk & bukti pembayaran ke Supabase Storage
- [x] **Deployment** — Siap deploy ke Vercel

---

## 🛠 Tech Stack

| Layer               | Teknologi                                                     |
| ------------------- | ------------------------------------------------------------- |
| **Framework**       | [NestJS](https://nestjs.com/) v11                             |
| **Language**        | [TypeScript](https://www.typescriptlang.org/) v5              |
| **Runtime**         | [Node.js](https://nodejs.org/)                                |
| **Database**        | [PostgreSQL](https://www.postgresql.org/)                     |
| **ORM**             | [Drizzle ORM](https://orm.drizzle.team/) v0.45                |
| **Authentication**  | [Passport](https://www.passportjs.org/) + JWT + Google OAuth  |
| **AI/ML**           | [LangChain](https://js.langchain.com/) + OpenAI               |
| **Validation**      | [Zod](https://zod.dev/) v4 + class-validator                  |
| **File Storage**    | [Supabase](https://supabase.com/) Storage                     |
| **API Docs**        | [Swagger / OpenAPI](https://swagger.io/) via `@nestjs/swagger` |
| **Deployment**      | [Vercel](https://vercel.com/)                                 |

---

## 📁 Arsitektur & Struktur Folder

Project ini menggunakan **NestJS Modular Architecture** — setiap domain/fitur dipisahkan ke module sendiri dengan pola `Module → Controller → Service`.

```
gdg_backend/
├── src/
│   ├── main.ts                     # Entry point, Swagger & static assets setup
│   ├── app.module.ts               # Root module — import semua module
│   │
│   ├── app/                        # App controller & service (health check)
│   │   └── index.ts
│   │
│   ├── config/                     # Konfigurasi environment
│   │   ├── configuration.ts        # Config factory (DB, JWT, dll)
│   │   └── index.ts
│   │
│   ├── database/                   # Database layer (Drizzle ORM)
│   │   ├── schema.ts               # Semua tabel, enum, dan relasi
│   │   ├── database.module.ts      # Database module
│   │   ├── database.provider.ts    # Database provider (DI — Pool connection)
│   │   ├── seed.ts                 # Database seeder
│   │   └── index.ts
│   │
│   ├── auth/                       # Autentikasi & Otorisasi
│   │   ├── auth.controller.ts      # Endpoint: register, login, google-auth
│   │   ├── auth.service.ts         # Logic autentikasi
│   │   ├── auth.module.ts
│   │   ├── dto/                    # DTO (register.dto.ts, login.dto.ts)
│   │   ├── guards/                 # Auth guards (JWT guard)
│   │   └── strategies/             # Passport strategies (JWT strategy)
│   │
│   ├── users/                      # Manajemen User & Profil
│   │   ├── users.controller.ts     # Endpoint: get/update profile, lokasi
│   │   ├── users.service.ts        # Logic user
│   │   └── users.module.ts
│   │
│   ├── products/                   # Manajemen Produk
│   │   ├── products.controller.ts  # Endpoint: CRUD produk, analyze-price
│   │   ├── products.service.ts     # Logic produk + AI analysis
│   │   └── products.module.ts
│   │
│   ├── categories/                 # Kategori Produk
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   ├── categories.module.ts
│   │   └── dto/
│   │
│   ├── cart/                       # Keranjang Belanja
│   │   ├── cart.controller.ts      # Endpoint: add/remove/get cart
│   │   ├── cart.service.ts         # Logic keranjang
│   │   ├── cart.module.ts
│   │   └── dto/
│   │
│   ├── transactions/               # Transaksi & Pembayaran
│   │   ├── transactions.controller.ts  # Endpoint: checkout, status update
│   │   ├── transactions.service.ts     # Logic transaksi + update saldo
│   │   ├── transactions.module.ts
│   │   └── dto/
│   │
│   ├── hargapangan/                # Informasi Harga Pangan
│   │   ├── hargapangan.controller.ts
│   │   ├── hargapangan.service.ts
│   │   └── hargapangan.module.ts
│   │
│   ├── common/                     # Shared / Global Utilities
│   │   ├── ai/                     # AI Service (LangChain + OpenAI)
│   │   ├── guards/                 # Global guards
│   │   ├── pipes/                  # Custom pipes (Zod validation pipe)
│   │   ├── decorators/             # Custom decorators
│   │   ├── filters/                # Exception filters
│   │   ├── interceptors/           # Interceptors
│   │   ├── middleware/             # Middleware
│   │   ├── dto/                    # Shared DTOs
│   │   ├── constants/              # Konstanta global
│   │   ├── interfaces/             # Shared interfaces
│   │   ├── providers/              # Shared providers
│   │   ├── controllers/            # Shared controllers
│   │   └── assets/                 # Static assets
│   │
│   ├── shared/                     # Shared resources
│   └── typings/                    # Custom type definitions
│
├── drizzle/                        # Migration files (auto-generated)
├── uploads/                        # Local file uploads (temp, products, transactions)
├── test/                           # E2E tests
├── drizzle.config.ts               # Drizzle Kit configuration
├── vercel.json                     # Vercel deployment config
├── tsconfig.json                   # TypeScript configuration
├── nest-cli.json                   # NestJS CLI configuration
└── package.json
```

---

## 🗄 Database Schema

Database menggunakan **PostgreSQL** dengan **Drizzle ORM**. Semua tabel didefinisikan di `src/database/schema.ts`.

### Tabel & Deskripsi

| Tabel                | Deskripsi                                           |
| -------------------- | --------------------------------------------------- |
| `roles`              | Role user (petani, pembeli, admin)                  |
| `users`              | Akun user (email/password + Google OAuth)           |
| `profiles`           | Profil lengkap (nama, telepon, alamat, saldo)       |
| `user_locations`     | Koordinat GPS user (latitude, longitude)            |
| `assets`             | File uploads (foto produk, avatar, bukti bayar)     |
| `categories`         | Kategori produk pertanian                           |
| `products`           | Produk pertanian (nama, harga, stok, foto)          |
| `ai_analysis`        | Hasil analisis AI (skor kualitas, grade SNI, harga) |
| `carts`              | Keranjang belanja pembeli                           |
| `transactions`       | Transaksi (pembayaran, status pesanan)              |
| `transaction_items`  | Item detail dalam transaksi                         |

### Enum Types

| Enum                   | Values                                  |
| ---------------------- | --------------------------------------- |
| `status`               | `pending`, `active`, `non-active`       |
| `metode_bayar`         | `QRIS`, `Transfer`, `COD`              |
| `status_pembayaran`    | `menunggu`, `berhasil`, `gagal`         |
| `status_pesanan`       | `menunggu`, `diterima`, `ditolak`, `selesai` |
| `status_transaksi`     | `pending`, `accepted`                   |

### Diagram Relasi

```
roles ──< users ──< products ──< transaction_items >── transactions
              │         │                                    │
              │         └──< carts                           │
              │         └── ai_analysis                      │
              ├── profiles                                   │
              ├── user_locations                             │
              └── assets                     users (pembeli) ┘
```

---

## 📦 Package & Library

### Dependencies (Production)

| Package                        | Versi     | Fungsi                                              |
| ------------------------------ | --------- | --------------------------------------------------- |
| `@nestjs/common`               | ^11.0.1   | Core NestJS — decorators, pipes, guards, dll        |
| `@nestjs/core`                 | ^11.0.1   | Core NestJS runtime                                 |
| `@nestjs/platform-express`     | ^11.0.1   | HTTP adapter berbasis Express.js                    |
| `@nestjs/config`               | ^4.0.4    | Konfigurasi environment (`.env` loader)             |
| `@nestjs/jwt`                  | ^11.0.2   | JWT token generation & verification                 |
| `@nestjs/passport`             | ^11.0.5   | Integrasi Passport.js dengan NestJS                 |
| `@nestjs/swagger`              | ^11.4.3   | Auto-generate Swagger/OpenAPI documentation         |
| `drizzle-orm`                  | ^0.45.2   | ORM type-safe untuk PostgreSQL                      |
| `pg`                           | ^8.20.0   | PostgreSQL client driver                            |
| `passport`                     | ^0.7.0    | Authentication middleware                           |
| `passport-jwt`                 | ^4.0.1    | JWT authentication strategy                         |
| `bcrypt`                       | ^6.0.0    | Password hashing & comparison                       |
| `zod`                          | ^4.4.3    | Schema validation (runtime type checking)           |
| `class-validator`              | ^0.15.1   | DTO validation via decorators                       |
| `class-transformer`            | ^0.5.1    | Object transformation (serialization/deserialization) |
| `@langchain/core`              | ^1.1.46   | LangChain core — AI chain, prompts, output parsers  |
| `@langchain/openai`            | ^1.4.5    | OpenAI integration untuk LangChain (GPT-4o Vision)  |
| `@supabase/supabase-js`        | ^2.106.0  | Supabase client — file storage & bucket management  |
| `google-auth-library`          | ^10.6.2   | Google OAuth token verification                     |
| `dotenv`                       | ^17.4.2   | Load environment variables dari `.env`              |
| `reflect-metadata`             | ^0.2.2    | Metadata reflection API (required by NestJS)        |
| `rxjs`                         | ^7.8.1    | Reactive programming (required by NestJS)           |
| `swagger-ui-express`           | ^5.0.1    | Swagger UI rendering di Express                     |

### DevDependencies (Development)

| Package                        | Versi     | Fungsi                                              |
| ------------------------------ | --------- | --------------------------------------------------- |
| `@nestjs/cli`                  | ^11.0.0   | NestJS CLI (generate, build, start)                 |
| `@nestjs/schematics`           | ^11.0.0   | Code scaffolding templates                          |
| `@nestjs/testing`              | ^11.0.1   | Testing utilities untuk NestJS                      |
| `drizzle-kit`                  | ^0.31.10  | Migration tool untuk Drizzle ORM                    |
| `typescript`                   | ^5.7.3    | TypeScript compiler                                 |
| `ts-node`                      | ^10.9.2   | TypeScript execution runtime                        |
| `ts-jest`                      | ^29.2.5   | TypeScript preprocessor untuk Jest                  |
| `jest`                         | ^30.0.0   | Testing framework                                   |
| `supertest`                    | ^7.0.0    | HTTP assertion library untuk E2E tests              |
| `eslint`                       | ^9.18.0   | Linter untuk code quality                           |
| `prettier`                     | ^3.4.2    | Code formatter                                      |
| `eslint-config-prettier`       | ^10.0.1   | Disable ESLint rules yang conflict dengan Prettier  |
| `eslint-plugin-prettier`       | ^5.2.2    | Run Prettier sebagai ESLint rule                    |
| `typescript-eslint`            | ^8.20.0   | ESLint support untuk TypeScript                     |
| `@types/bcrypt`                | ^6.0.0    | Type definitions untuk bcrypt                       |
| `@types/express`               | ^5.0.0    | Type definitions untuk Express                      |
| `@types/multer`                | ^2.1.0    | Type definitions untuk Multer (file upload)         |
| `@types/passport-jwt`          | ^4.0.1    | Type definitions untuk passport-jwt                 |
| `@types/pg`                    | ^8.20.0   | Type definitions untuk pg                           |
| `@types/node`                  | ^24.0.0   | Type definitions untuk Node.js                      |

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Buat file `.env` di root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# Authentication
JWT_SECRET=your_jwt_secret_key

# Supabase (File Storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# OpenAI (AI Analysis)
OPENAI_API_KEY=your_openai_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Database Setup

```bash
# Generate migration files
npm run db:generate

# Push schema langsung ke database
npm run db:push

# Seed data awal (roles, categories, dll)
npm run db:seed

# Buka Drizzle Studio (GUI database)
npm run db:studio
```

### 4. Jalankan Aplikasi

```bash
# Development (auto-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## 📖 API Documentation

Setelah aplikasi berjalan, akses dokumentasi Swagger di:

```
http://localhost:3000/api-docs
```

---

## 📜 Scripts

| Script            | Perintah                  | Deskripsi                                |
| ----------------- | ------------------------- | ---------------------------------------- |
| `start:dev`       | `npm run start:dev`       | Jalankan dalam mode development (watch)  |
| `start:prod`      | `npm run start:prod`      | Jalankan dalam mode production           |
| `build`           | `npm run build`           | Build project ke folder `dist/`          |
| `db:generate`     | `npm run db:generate`     | Generate migration files dari schema     |
| `db:push`         | `npm run db:push`         | Push schema langsung ke database         |
| `db:migrate`      | `npm run db:migrate`      | Jalankan migration files                 |
| `db:seed`         | `npm run db:seed`         | Seed data awal ke database               |
| `db:studio`       | `npm run db:studio`       | Buka Drizzle Studio (database GUI)       |
| `lint`            | `npm run lint`            | Jalankan ESLint + auto-fix               |
| `format`          | `npm run format`          | Format code dengan Prettier              |
| `test`            | `npm run test`            | Jalankan unit tests                      |
| `test:e2e`        | `npm run test:e2e`        | Jalankan end-to-end tests                |

---

## 📄 License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
