# Product Requirements Document (PRD): AgriSmart AI Marketplace

**Status:** Draft | **Versi:** 1.0 | **Target Launch:** Q3 2026

## 1. Ringkasan Eksekutif (Executive Summary)
AgriSmart AI adalah platform marketplace pertanian yang menghubungkan Petani dan Pembeli secara langsung. Keunggulan utamanya terletak pada integrasi AI untuk analisis kualitas (berdasarkan standar SNI) dan rekomendasi harga pasar secara real-time untuk memastikan transaksi yang adil dan transparan.

---

## 2. Peran Pengguna (User Roles)
* **Petani (Farmer):** Mengelola stok, menerima rekomendasi harga AI, dan memproses pesanan.
* **Pembeli (Buyer):** Mencari produk, melakukan pembayaran, dan melacak pengiriman.

---

## 3. Fitur Utama & Alur Kerja (Functional Requirements)

### 3.1 Registrasi & Profil
- **User Authentication:** Login/Daftar menggunakan email dan password (JWT/Session based).
- **Profile Management:** Pengisian data alamat lengkap dan titik koordinat GPS untuk perhitungan ongkir otomatis.

### 3.2 Manajemen Produk & AI Analysis (Sisi Petani)
- **Input Produk:** Upload foto, deskripsi, dan jumlah stok.
- **AI Quality Check:** Pemindaian gambar untuk menentukan grade kualitas (A/B/C) sesuai standar SNI.
- **AI Price Recommendation:** Analisis harga pasar terkini untuk memberikan saran harga kepada petani.
- **Status Kontrol:** Produk dapat diatur menjadi 'Active' (tampil di katalog) atau 'Non-Active'.

### 3.3 Transaksi & Pembayaran (Sisi Pembeli)
- **Katalog & Filter:** Pencarian berdasarkan kategori (sayur, buah, benih).
- **Smart Shopping Cart:** Penyimpanan item belanja dengan fitur update kuantitas.
- **Secure Checkout:** Pembuatan invoice dengan snapshot harga (`price_snapshot`) untuk mengunci harga saat transaksi dimulai.
- **Payment Gateway:** Integrasi pembayaran via QRIS dan Transfer Bank.

### 3.4 Notifikasi
- **Abandoned Cart:** Notifikasi otomatis jika barang mengendap di keranjang > 24 jam.
- **Order Status Update:** Notifikasi real-time saat status pesanan berubah (Diproses -> Dikirim -> Selesai).

---

## 4. Arsitektur Data (Database Schema)
Sistem menggunakan relasi database PostgreSQL dengan struktur utama sebagai berikut:
- **`users` & `profiles`:** Hubungan 1:1 untuk identitas.
- **`products` & `ai_analysis`:** Hubungan 1:1 untuk hasil deteksi AI.
- **`transactions` & `transaction_items`:** Hubungan 1:N untuk pencatatan detail pesanan.

---

## 5. Spesifikasi Teknis (Tech Stack)
- **Frontend:** Flutter (Cross-platform Android/iOS).
- **Backend:** Node.js (Express/NestJS) dengan integrasi model AI.
- **Database:** PostgreSQL.
- **Server:** Linux (Ubuntu/EndeavourOS) dengan Docker/Devilbox.

---

## 6. Metrik Keberhasilan (Success Metrics)
- Akurasi deteksi kualitas AI mencapai minimal 85%.
- Pengurangan angka kegagalan checkout (Abandoned Cart) sebesar 20%.
- Kecepatan pemrosesan transaksi di bawah 2 detik.
