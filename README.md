# E-Magang Kota Madiun

Aplikasi manajemen magang berbasis web untuk Pemerintah Kota Madiun. Dibangun untuk memfasilitasi proses pengajuan, verifikasi, dan pengelolaan magang mahasiswa di berbagai OPD (Organisasi Perangkat Daerah) secara digital.

## ✨ Fitur Utama

- **Autentikasi berlapis**
  - Login OTP untuk Mahasiswa (expired 5 menit, autofocus input, progressive lockout berbasis Fibonacci)
  - Login Admin via Laravel Fortify (Admin OPD & Admin Verifikator)
- **Manajemen Pengajuan Magang**
  - Pengajuan, verifikasi, hingga penerbitan surat diterima secara otomatis (PDF)
  - Tracking status pengajuan real-time
- **Kelola OPD**
  - CRUD lengkap data OPD (Organisasi Perangkat Daerah)
- **Manajemen Dokumen**
  - Upload dan validasi dokumen (CV, dsb.) dengan validasi ukuran file di sisi server
- **Role-based Access Control**
  - Tiga role utama: `Mahasiswa`, `Admin OPD`, `Admin Verifikator` (menggunakan Spatie Permission)
- **Sertifikat/Surat Otomatis**
  - Generate PDF surat diterima magang secara otomatis saat pengajuan disetujui

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13 |
| Frontend Bridge | Inertia.js v3 |
| Frontend | React 19 + TypeScript |
| Database | PostgreSQL |
| Otorisasi | Spatie Laravel Permission |
| Autentikasi Admin | Laravel Fortify |
| PDF Generator | DomPDF |

## 📋 Prasyarat

- PHP >= 8.2
- Composer
- Node.js >= 18 & npm/pnpm
- PostgreSQL >= 14

## 🚀 Instalasi

```bash
# Clone repository
git clone https://github.com/username/e-magang-kota-madiun.git
cd e-magang-kota-madiun

# Install dependency PHP
composer install

# Install dependency JavaScript
npm install

# Buat file environment dan jalankan php artisan key:generate

# Konfigurasi database di file .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=
# DB_USERNAME=postgres
# DB_PASSWORD=

# Jalankan migrasi dan seeder
php artisan migrate --seed

# Build asset frontend
npm run build
# atau untuk development
npm run dev
```

## ▶️ Menjalankan Aplikasi

```bash
php artisan serve
```

Aplikasi dapat diakses di `http://localhost:8000`.

## 🧪 Testing

```bash
php artisan test
```

## 🗂️ Struktur Role

| Role | Akses |
|---|---|
| Mahasiswa | Login via OTP, mengajukan magang, upload dokumen, cek status |
| Admin OPD | Mengelola pengajuan magang di OPD masing-masing |
| Admin Verifikator | Verifikasi akhir dan approval pengajuan magang |

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal Pemerintah Kota Madiun.

## 🤝 Kontribusi

Untuk kontribusi, silakan buat *issue* atau *pull request* terlebih dahulu untuk mendiskusikan perubahan yang diinginkan.
