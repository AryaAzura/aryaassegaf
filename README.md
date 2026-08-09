# 🔍 Sistem Pakar Diagnosa Kerusakan — Case Based Reasoning (CBR)

Aplikasi web sistem pakar untuk mendiagnosa kerusakan berdasarkan gejala menggunakan metode **Case Based Reasoning (CBR)**. Sistem mencari kesamaan (similarity) antara gejala yang dipilih dengan basis kasus yang tersimpan, lalu menampilkan kerusakan yang paling mungkin beserta solusinya.

![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1?logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Fitur Utama

- 🔐 **Autentikasi** — Login dengan session PHP yang aman (HttpOnly, SameSite).
- 👥 **Multi-Role** — Admin (akses penuh) & User (hanya diagnosa).
- 📋 **Manajemen Gejala** — CRUD data gejala dengan bobot CBR (0.0–1.0).
- 🛠️ **Manajemen Kerusakan** — CRUD data kerusakan beserta solusi/penanganan.
- 🔗 **Basis Kasus (Rule)** — Menghubungkan kerusakan dengan gejala terkait.
- 🩺 **Diagnosa CBR** — Pilih gejala → sistem hitung similarity → tampilkan hasil + solusi.
- 📜 **Riwayat Diagnosa** — Penyimpanan otomatis setiap sesi diagnosa.
- ✏️ **Revisi (Fase Revise CBR)** — Admin memvalidasi/mengoreksi hasil diagnosa.
- 📄 **Cetak Laporan** — Laporan diagnosa & daftar data siap cetak/PDF.
- 📊 **Export CSV** — Ekspor data ke format CSV (Excel).
- 💾 **Backup & Restore** — Export/Import seluruh data dalam format JSON.

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend | PHP 8.x (Native, tanpa framework) |
| Database | MySQL / MariaDB |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Server | Apache (XAMPP) |
| Font | Google Fonts (Inter) |

---

## 📦 Instalasi

### 1. Persiapan

Unduh dan install **XAMPP** (berisi Apache, PHP, MySQL) dari [apachefriends.org](https://www.apachefriends.org).

### 2. Penempatan File

Salin folder project ke direktori htdocs:

```
C:\xampp\htdocs\sistem-pakar\
```

### 3. Import Database

1. Jalankan **Apache** dan **MySQL** pada XAMPP Control Panel.
2. Buka browser → akses `http://localhost/phpmyadmin`
3. Klik tab **Import** → pilih file `sistempakar.sql` → klik **Go**.

### 4. Konfigurasi Database

File konfigurasi berada di `api/config.php` dan `api/auth.php`:

```php
$db_host = 'localhost';
$db_name = 'sistempakar';
$db_user = 'root';
$db_pass = '';
```

> Jika menggunakan konfigurasi default XAMPP, tidak perlu mengubah apa pun.

### 5. Jalankan Aplikasi

Buka browser dan akses:

```
http://localhost/sistem-pakar/login.html
```

---

## 🔑 Akun Default

| Role | Username | Password | Akses |
|------|----------|----------|-------|
| Admin | `admin` | `admin123` | Penuh (semua fitur) |
| User | `user` | `user123` | Hanya diagnosa |

> ⚠️ **Segera ubah password default** setelah login pertama untuk keamanan.

---

## 📁 Struktur Project

```
sistem-pakar/
├── index.html              # Halaman utama (dashboard)
├── login.html              # Halaman login
├── app.js                  # Logika frontend utama
├── style.css               # Styling aplikasi
├── laporan.html            # Halaman laporan diagnosa
├── laporan.js              # Logika render laporan diagnosa
├── laporan.css             # Styling laporan
├── laporan-daftar.html     # Halaman laporan daftar data
├── laporan-daftar.js       # Logika render laporan daftar
├── sistempakar.sql         # File database (SQL dump)
├── Logo Transparan.png     # Logo aplikasi
├── Manual_Book_Sistem_Pakar.doc  # Manual book
└── api/
    ├── config.php          # Konfigurasi & koneksi database
    ├── auth.php            # Autentikasi (login, logout, check session)
    ├── gejala.php          # CRUD data gejala
    ├── kerusakan.php       # CRUD data kerusakan
    ├── rule.php            # CRUD basis kasus (rule)
    ├── riwayat.php         # CRUD riwayat diagnosa & revisi
    ├── export.php          # Export data ke JSON
    └── import.php          # Import data dari JSON
```

---

## 🚀 Penggunaan

### Admin

1. Login sebagai admin.
2. Tambahkan data **Gejala** (dengan bobot CBR).
3. Tambahkan data **Kerusakan** (dengan solusi).
4. Buat **Basis Kasus** — hubungkan kerusakan dengan gejala terkait.
5. Lakukan **Diagnosa** — pilih gejala → sistem menampilkan hasil.
6. Validasi hasil melalui **Riwayat** → **Revisi** (fase Revise CBR).
7. Cetak laporan atau export data sesuai kebutuhan.

### User

1. Login sebagai user.
2. Buka tab **Diagnosa**.
3. Isi nama pasien & pemeriksa.
4. Centang gejala yang dialami.
5. Klik **Proses Diagnosa**.
6. Lihat hasil dan solusi.
7. Klik **Cetak Laporan** untuk mencetak.

---

## 🧮 Cara Kerja Metode CBR

CBR menyelesaikan masalah baru dengan mencari kesamaan dengan kasus lama. Empat fase utama:

| Fase | Nama | Penjelasan |
|------|------|------------|
| 1 | **Retrieve** | Mencari kasus lama yang paling mirip dengan gejala input |
| 2 | **Reuse** | Menggunakan solusi dari kasus yang mirip sebagai solusi sementara |
| 3 | **Revise** | Admin memvalidasi/mengoreksi hasil diagnosa |
| 4 | **Retain** | Hasil yang divalidasi disimpan untuk referensi masa depan |

### Rumus Similarity

```
Similarity (%) = (Σ Bobot Gejala Cocok / Σ Bobot Total Gejala Kasus) × 100
```

- **Σ Bobot Gejala Cocok** = jumlah bobot gejala yang dipilih pengguna DAN ada di basis kasus.
- **Σ Bobot Total Gejala Kasus** = jumlah bobot seluruh gejala pada suatu kasus basis.

Hasil diurutkan dari persentase tertinggi. Hanya hasil dengan similarity > 0% ditampilkan.

---

## 📡 API Endpoints

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `api/auth.php?action=login` | POST | Login pengguna |
| `api/auth.php?action=logout` | GET | Logout |
| `api/auth.php?action=check` | GET | Cek status sesi |
| `api/gejala.php` | GET, POST | Ambil / tambah gejala |
| `api/gejala.php?id=X` | PUT, DELETE | Edit / hapus gejala |
| `api/kerusakan.php` | GET, POST | Ambil / tambah kerusakan |
| `api/kerusakan.php?id=X` | PUT, DELETE | Edit / hapus kerusakan |
| `api/rule.php` | GET, POST | Ambil / tambah basis kasus |
| `api/rule.php?id=X` | PUT, DELETE | Edit / hapus basis kasus |
| `api/riwayat.php` | GET, POST | Ambil / simpan riwayat diagnosa |
| `api/riwayat.php?id=X` | PUT, DELETE | Revisi / hapus riwayat |
| `api/export.php` | GET | Export seluruh data (JSON) |
| `api/import.php` | POST | Import data (JSON) |

---

## 🗄️ Struktur Database

| Tabel | Fungsi |
|-------|--------|
| `users` | Data pengguna (username, password, nama, role) |
| `gejala` | Data gejala (kode, nama, bobot) |
| `kerusakan` | Data kerusakan (kode, nama, solusi) |
| `rule` | Basis kasus — menghubungkan kerusakan dengan gejala |
| `rule_gejala` | Tabel pivot many-to-many (rule ↔ gejala) |
| `riwayat_diagnosa` | Histori diagnosa & hasil revisi |

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Halaman blank / tidak muncul | Pastikan Apache running & folder di `htdocs` |
| Error koneksi database | Pastikan MySQL running & database sudah di-import |
| Login gagal | Cek username/password & pastikan `is_active = 1` |
| Hasil diagnosa kosong | Pastikan basis kasus sudah dibuat & gejala dipilih ada di rule |
| Tab admin tidak muncul | Normal untuk role User — hanya Admin yang bisa akses |
| Laporan tidak muncul | Izinkan popup untuk `localhost` di browser |

---

## 📄 Dokumentasi

Untuk panduan lengkap instalasi & pengoperasian, baca file **`Manual_Book_Sistem_Pakar.doc`** yang dapat dibuka di Microsoft Word.

---

## 📝 Lisensi

Project ini bersifat open-source dan bebas digunakan untuk keperluan pembelajaran maupun pengembangan.

---

<p align="center">
  Dibuat dengan ❤️ menggunakan PHP, MySQL & JavaScript<br>
  Sistem Pakar Diagnosa Kerusakan — Metode CBR
</p>
