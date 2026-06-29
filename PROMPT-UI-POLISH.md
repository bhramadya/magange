# Prompt Pemolesan UI — E-Magang (pakai skill UI/UX Pro Max)

> Tujuan: bikin tiap halaman terasa **lebih modern, hidup, dan profesional** — TANPA mengubah
> identitas visual (warna biru Pemkot, struktur layout, alur). Bukan redesign, tapi **penghalusan**.
> Salin blok prompt di bawah ke Claude Code. Kerjakan **per halaman**, jangan semua sekaligus.

---

## 🎨 Design system yang WAJIB dipertahankan (jangan diubah)

| Token | Nilai | Pemakaian |
|---|---|---|
| Primary | `#106feb` | tombol utama, link aktif, ikon aktif |
| Primary hover | `#0b4fb0` | hover tombol/gradient |
| Biru muda | `#cddcef` | latar lembut, avatar, badge |
| Gelap (teks) | `#12213e` | judul, teks tegas |
| Sekunder | `slate-*` | teks/garis/latar netral |

- Kartu: `rounded-2xl border border-slate-200 bg-white`
- Animasi: **`motion/react`** (sudah dipakai)
- Ikon: **`lucide-react`**
- Komponen: **shadcn/ui (new-york)** di `resources/js/Components/ui/`
- Layout dasbor: **`MagangLayout`** (`resources/js/Layouts/magang-layout.tsx`)

---

## 📋 Prompt utama (copy mulai dari sini)

```
Act as a Senior UI/UX Designer & Expert Frontend Engineer (Promax level). I am building a "Digital Internship Management System" (Sistem E-Magang). I need a complete UI/UX redesign implemented in clean, production-ready frontend code (HTML/Tailwind CSS or clean Bootstrap 5, select the most modern one). 

The design must look highly professional, enterprise-grade, and completely avoid any generic "cheap AI template" look. It should feel like a premium SaaS product.

[DESIGN SYSTEM & STYLING RULES]
- Typography: Inter or Plus Jakarta Sans. Strict visual hierarchy.
- Color Palette: 
  * Primary: Premium Navy/Royal Blue (#0F4C81 / #1A73E8)
  * Secondary/Accents: Slate Blue, Emerald Green (Success), Amber (Warning), Crimson (Danger)
  * Backgrounds: Pure White (#FFFFFF) & Soft Cool Grays (#F8F9FA, #F1F3F5) for depth.
- Surface & Spacing: Smooth borders (rounded-xl / 12px), subtle micro-shadows (shadow-sm to shadow-md), and ample whitespace (padding minimum p-6 for cards) to ensure breathing room.
- Interactivity: Add smooth transitions (duration-200 ease-in-out) for hovers and state changes.

Please generate the complete, responsive UI for the following 5 core screens:

1. LANDING PAGE (PUBLIC)
- Hero Section: High-converting headline, clear subtext, and a prominent primary CTA button ("Daftar Magang Sekarang") with a secondary button ("Pelajari Alur").
- "Alur Pendaftaran" Section: A modern horizontal interactive timeline or step-by-step card component with clean SVG icons (Tahap 1 s/d 4).
- FAQ Section: A clean, borderless accordion layout with smooth expand/collapse indicators (+ / - or chevrons).

2. INTERNSHIP APPLICATION FORM (PUBLIC)
- Layout: Multi-step form card or a beautifully organized single-page form with clear section dividers.
- Fields: OPD Tujuan (Select Dropdown), Durasi (Radio cards), Nama Kampus/Instansi, Nama Dosen Pembimbing, Nomor WhatsApp (with country code prefix), and Email.
- Security UI: A sleek visual mockup of a modern "Slider/Puzzle CAPTCHA" container (TikTok style) with a draggable slider handle.
- States: Include visual indicators for disabled/active submit states.

3. PASSWORDLESS OTP LOGIN SCREEN
- Layout: Minimalist, centered authentication card with maximum focus.
- Dual-State UI: 
  * State A (Email Entry): Minimalist single input field for Email with a "Kirim Kode OTP" button.
  * State B (OTP Verification): A sleek 6-digit OTP interface consisting of 6 separate, auto-focus styled square input boxes, a countdown timer UI ("Kirim ulang dalam 59s"), and a "Verifikasi" button.

4. STUDENT DASHBOARD (TICKET TRACKING & FEEDBACK)
- Progress Tracker UI: A clean, responsive stepper/timeline component tracking real-time status: [Tahap Verifikator] -> [Tahap OPD] -> [Sedang Magang] -> [Proses Selesai]. Use semantic colors (e.g., Green for completed, Blue for active, Gray for upcoming).
- Final Stage Card: A modern drag-and-drop file upload zone for the "Laporan Akhir".
- Gamification/Lock Mechanism: A disabled "Unduh Sertifikat" button with a lock icon. Next to it, render an open modern Modal popup for the "Survei Kepuasan" containing a 5-star rating widget (interactive hover states) and a feedback textarea. The UI must clearly convey that completing this survey unlocks the certificate.

5. ADMIN PANEL (VERIFIKATOR & OPD)
- Layout: Split-screen with a fixed modern sidebar navigation (Dashboard, Verifikasi, Data Magang, Pengaturan) and a wide content area.
- Data Table: Premium datatable component listing applicants with clean, rounded status badges (Pending, ACC, Ditolak).
- Verifikator Modal View: A slide-over or modal UI containing fields to assign details (Bidang, Mentor/Pembimbing Lapangan, PIC) and a primary action button "Lempar ke OPD" utilizing a forward icon.
- OPD Admin Action UI: A dedicated action column inside the table or inside a detail view with bold, high-contrast, yet elegant action buttons: "ACC" (Success green theme) and "Tolak" (Danger red theme).

Provide the output in fully functional HTML with embedded Tailwind CSS (via CDN) or high-quality CSS utilities so I can immediately copy-paste and preview it in my VS Code. Ensure it is fully responsive from mobile to desktop.

```

---

## 🗂️ Urutan halaman yang disarankan

Poles yang sering dilihat dulu, agar pola konsistennya menyebar:

1. `resources/js/Pages/welcome.tsx` (landing — kesan pertama)
2. `resources/js/Layouts/magang-layout.tsx` (shell dasbor — efeknya ke semua dasbor)
3. `resources/js/Pages/mahasiswa/dashboard.tsx`
4. `resources/js/Pages/mahasiswa/pengajuan.tsx` & `penyelesaian.tsx`
5. `resources/js/Pages/verifikator/*` (dashboard, masuk, riwayat)
6. `resources/js/Pages/opd/*` (dashboard, keputusan, peserta)
7. `resources/js/Pages/auth/otp-login.tsx`
8. `resources/js/Pages/lacak.tsx`, `bantuan.tsx`, `pengaturan.tsx`

> Setelah halaman 1-2 dipoles, sebut ke Claude: "ikuti pola visual yang sama seperti
> di dashboard mahasiswa" agar konsisten.

---

## 💡 Tips
- **Satu halaman per waktu**, minta usulan sebelum dieksekusi — supaya kamu tetap kontrol.
- Jika hasil terlalu "ramai", bilang: "kurangi gradient/animasi, buat lebih kalem".
- Untuk konsistensi, minta Claude mengekstrak pola berulang (mis. StatCard, SectionCard)
  jadi komponen bersama bila perlu — tapi tanpa mengubah perilaku.
- Cek di browser (`composer dev`) tiap selesai 1 halaman sebelum lanjut.
