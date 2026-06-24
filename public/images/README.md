# Gambar Hero

Letakkan foto gedung pemerintahan di sini dengan nama:

    gedung-pemerintahan.jpg

Rekomendasi: rasio lanskap (mis. 1920×1080 atau lebih lebar), format `.jpg`/`.webp`,
ukuran file < 500 KB agar halaman tetap cepat.

Komponen Hero di `resources/js/Pages/welcome.tsx` memuat file ini lewat path
`/images/gedung-pemerintahan.jpg`. Bila file belum ada, Hero otomatis menampilkan
placeholder gradien biru sebagai gantinya (tidak ada ikon "broken image").
