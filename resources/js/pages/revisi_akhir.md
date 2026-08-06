berikut adalah rincian lengkap mengenai revisi, penyesuaian fitur, dan instruksi teknis yang disepakati untuk segera diimplementasikan:

### 1. Perbaikan Sistem Presensi & Riwayat Kegiatan (Absensi)

- **Tombol Riwayat Presensi:** Tampilan presensi yang ada pada pop up kelola peserta pada admin OPD yang sebelumnya terlalu panjang dan menyulitkan harus diperbaiki dengan membuat tombol khusus "Riwayat Presensi". Ketika tombol ini diklik, sistem akan menampilkan rincian absensi harian peserta.
- **Informasi Umum di Halaman Presensi pop up kelola peserta pada admin OPD:** Di bagian atas tombol riwayat presensi, wajib ditampilkan seluruh informasi mengenai mahasiswa agar peninjauan lebih mudah.
- **Pemantauan Aktivitas Harian:** Admin OPD dan Verifikator dapat memantau keaktifan peserta secara langsung, meliputi status kehadiran harian, jam masuk, jam selesai, serta rincian kegiatan yang dikerjakan peserta magang pada menu kelola peserta(admin OPD) dan kelola user(admin verifikator).

### 2. Penyederhanaan UI/UX & Detail Data Mahasiswa

- **Shortcut "Data Detail":** pada pop up kelola peserta pada admin OPD Tampilan daftar peserta magang yang sebelumnya terlalu panjang dan membutuhkan banyak _scrolling_ harus disederhanakan. Buat sistem pintasan (_shortcut_) berupa tombol "Data Detail" atau "Informasi Detail".
- **Rekam Jejak Utuh (Dossier):** Ketika tombol detail tersebut diklik, sistem akan menampilkan seluruh riwayat perjalanan anak magang secara utuh, mulai dari status proses pengajuannya, keaktifan absensinya, hingga riwayat pendaftaran sebelumnya jika ia pernah mendaftar.
- **Batasan Satu Magang Aktif:** Sistem harus memastikan bahwa seorang siswa hanya boleh memiliki satu magang aktif. Setelah masa magangnya berstatus selesai, ia tidak boleh mendaftar atau mengajukan magang lagi.

### 3. Alur TTE (Tanda Tangan Elektronik) & Pengelolaan Surat

- **Menu "Kelola Surat" Dinamis:** Menu ini ditambahkan untuk mengatur variabel penandatanganan surat yang butuh dikustomisasi, seperti Nama Pejabat, NIP, NIK, gelar depan/belakang, pangkat/golongan, hingga keterangan jabatan seperti "atas nama Kepala Dinas".
- **Rata Kiri & Justify:** Format tata letak teks draf surat di dalam sistem harus dirapikan menggunakan perataan kiri (_align-left_) atau rata kanan-kiri (_justify_) agar terlihat rapi dan presisi.
- **Standardisasi Template Surat:** Template visual surat penerimaan, surat selesai, dan sertifikat harus disamakan secara umum. Perbedaan antarinstansi hanya terletak pada kop surat, nomor surat khusus per OPD, serta data pejabat yang menandatanganinya.

### 4. Kebutuhan Pengujian (Testing) & Visualisasi

- **Simulasi Status Tiket:** Untuk keperluan demo dan pengujian aplikasi sebelum batas waktu selesai, sistem harus menyediakan simulasi untuk tiga status tiket krusial, yaitu: **"Menunggu TTE"**, **"Perlu Sertifikat"**, dan **"Perlu Keputusan"**.
- **Indikator Grafik Progres (Visual Friendly):** Dasbor disarankan menyertakan grafik interaktif atau persentase yang menunjukkan sisa masa magang peserta (apakah belum mulai, aktif, selesai, atau sudah kelewat batas waktu) agar lebih mudah dipantau.

### 5. Dokumentasi Teknis, Struktur Pejabat, & Deadline

- **Dokumentasi Instalasi:** Developer wajib melengkapi file `.env.example` atau dokumen `README` yang menjelaskan secara rinci cara instalasi, pengaturan SMTP lokal yang digunakan untuk email, dan konfigurasi database.
- **Database Seeders:** Seeder database harus disiapkan untuk mengisi data Admin dan OPD secara otomatis.
