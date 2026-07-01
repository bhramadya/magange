# Blueprint Redesign E-Magang — Modern, Cohesive, Brand-Locked

> **Tujuan:** Desain ulang menyeluruh sistem E-Magang dengan mempertahankan 3 warna brand
> (`#106feb` tombol, `#0b4fb0` hover, `#cddcef` biru muda) sambil memodernkan layout,
> tipografi, spacing, dan pola interaksi agar terasa premium, profesional, dan serasi
> lintas 15 halaman.
>
> **Prinsip:** Konsistensi > Kreativitas. Setiap pola (kartu, badge, timeline, tabel)
> didefinisikan satu kali di sistem, lalu dipakai konsisten di semua halaman.

---

## 🎨 Sistem Desain Global (Design System v2)

### 1. Warna (Brand-Locked)

| Token | Hex | Pemakaian |
|---|---|---|
| **Primary** | `#106feb` | Tombol utama, link aktif, focus ring, ikon aktif, border aktif |
| **Primary Hover** | `#0b4fb0` | Hover tombol, gradient endpoint |
| **Primary Light** | `#cddcef` | Background lembut, badge, avatar, hover state ringan |
| **Primary Subtler** | `#e8f2fe` | Section background alternate, card hover tint |
| **Ink (Heading)** | `#0a1628` | Judul utama, teks tegas (ganti `#12213e` → lebih gelap) |
| **Ink Secondary** | `#475569` | Body text, label (slate-600) |
| **Ink Tertiary** | `#94a3b8` | Placeholder, meta text (slate-400) |
| **Neutral BG** | `#f8fafc` | Page background (slate-50) |
| **White** | `#ffffff` | Card surface, modal |
| **Border** | `#e2e8f0` | Card border (slate-200) |
| **Border Hover** | `#cbd5e1` | Hover card border (slate-300) |

**Status Tones** (semantic colors, di luar brand):
- **Emerald:** `#10b981` (approved, completed, success)
- **Amber:** `#f59e0b` (pending, warning)
- **Rose:** `#f43f5e` (rejected, error)
- **Violet:** `#8b5cf6` (ongoing, in-progress)
- **Slate:** `#64748b` (neutral, disabled)

**Gradient:** `linear-gradient(135deg, #106feb 0%, #0b4fb0 100%)` untuk hero, CTA tegas.

---

### 2. Tipografi

**Font stack:** `font-sans` (Inter via Tailwind default, fallback system).

| Level | Class | Size | Weight | Line Height | Pemakaian |
|---|---|---|---|---|---|
| **Display** | `text-5xl md:text-6xl` | 48px/60px | `font-bold` (700) | 1.1 | Hero headline |
| **H1** | `text-4xl md:text-5xl` | 36px/48px | `font-bold` | 1.15 | Page title |
| **H2** | `text-3xl md:text-4xl` | 30px/36px | `font-semibold` (600) | 1.2 | Section heading |
| **H3** | `text-xl md:text-2xl` | 20px/24px | `font-semibold` | 1.3 | Subsection, card title |
| **H4** | `text-lg` | 18px | `font-semibold` | 1.4 | Small heading, accordion |
| **Body Large** | `text-base md:text-lg` | 16px/18px | `font-normal` (400) | 1.6 | Hero subtext, lead paragraph |
| **Body** | `text-sm md:text-base` | 14px/16px | `font-normal` | 1.5 | Paragraph, form label |
| **Small** | `text-xs md:text-sm` | 12px/14px | `font-normal` | 1.4 | Meta, caption, badge text |
| **Tiny** | `text-[10px] md:text-xs` | 10px/12px | `font-medium` (500) | 1.3 | Uppercase label, timestamp |

**Hierarchy enforcer:**
- Jarak H2 ke body: `mt-3` (12px)
- Jarak antar section: `space-y-16 md:space-y-24` (64px/96px)
- Paragraph spacing: `space-y-4` (16px)

---

### 3. Spacing & Layout Grid

**Container:**
- Max width: `max-w-7xl` (1280px) untuk landing, `max-w-6xl` (1152px) untuk dashboard
- Padding: `px-4 sm:px-6 lg:px-8` (16px/24px/32px)
- Section vertical: `py-16 md:py-24 lg:py-32` (64px/96px/128px)

**Card internal:**
- Default: `p-6 md:p-8` (24px/32px)
- Compact (list item): `p-4 md:p-5` (16px/20px)
- Spacious (hero card): `p-8 md:p-10 lg:p-12` (32px/40px/48px)

**Gap patterns:**
- Grid/Flex gap: `gap-4 md:gap-6 lg:gap-8` (16px/24px/32px)
- Stack (vertical): `space-y-3` (12px) untuk form, `space-y-6` (24px) untuk section content
- Inline (horizontal): `gap-2` (8px) untuk button group, `gap-3` (12px) untuk icon+text

---

### 4. Rounding (Border Radius)

| Element | Class | Radius | Pemakaian |
|---|---|---|---|
| **Card** | `rounded-3xl` | 24px | Section card, modal, panel utama |
| **Button Primary** | `rounded-xl` | 12px | Tombol CTA, form submit |
| **Button Secondary** | `rounded-lg` | 8px | Tombol outline, icon button |
| **Input** | `rounded-xl` | 12px | Text input, select, textarea |
| **Badge** | `rounded-full` | 9999px | Status badge, pill tag |
| **Avatar** | `rounded-full` | 9999px | User avatar |
| **Image** | `rounded-2xl` | 16px | Thumbnail, illustration |

**Konsistensi:** Landing page pakai `rounded-3xl` untuk kartu besar, dashboard `rounded-2xl` untuk density lebih tinggi.

---

### 5. Shadow & Depth

| Layer | Class | Value | Pemakaian |
|---|---|---|---|
| **Flat** | `shadow-none` | — | Inline badge, flat button |
| **Subtle** | `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Default card |
| **Lifted** | `shadow` | 0 1px 3px rgba(0,0,0,0.1) | Hover card, dropdown |
| **Elevated** | `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modal, sticky panel |
| **Floating** | `shadow-2xl` | 0 25px 50px rgba(0,0,0,0.15) | Hero image, dialog overlay |

**Hover pattern:** `shadow-sm hover:shadow-lg transition-shadow duration-300`

**Focus ring:** `focus-visible:ring-4 focus-visible:ring-[#106feb]/20 focus-visible:outline-none`

---

### 6. Motion & Animation (Framer Motion)

**Global easing:** `ease: [0.25, 0.1, 0.25, 1]` (ease-in-out custom Bezier).

| Pattern | Config | Pemakaian |
|---|---|---|
| **Fade in** | `opacity: 0 → 1, duration: 0.4s` | Page load, section reveal |
| **Slide up** | `y: 24 → 0, opacity: 0 → 1, duration: 0.5s` | Card enter, hero content |
| **Stagger children** | `staggerChildren: 0.1s` | List items, grid cards |
| **Scale hover** | `scale: 1 → 1.02, duration: 0.2s` | Card hover, button hover |
| **Border glow** | `borderColor: slate-200 → #106feb, duration: 0.3s` | Focus input, active card |

**Reduced motion:** Semua animasi wrapped `prefers-reduced-motion: no-preference` query.

---

### 7. Komponen Bersama (Shared Components)

**Ekstrak dari duplikasi saat ini** (lihat peta Explore agent):

#### a. `StatusBadge.tsx`
```tsx
<StatusBadge status={app.status} />
// Props: status (ApplicationStatus)
// Output: Pill badge dengan TONE_BADGE mapping (emerald/amber/rose/violet/blue/slate)
// Style: rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset
```

#### b. `SectionCard.tsx`
```tsx
<SectionCard icon={Icon} title="..." description="...">
  {children}
</SectionCard>
// Kartu dengan header (ikon + judul + deskripsi) + slot konten
// Style: rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm
```

#### c. `StatusTimeline.tsx`
```tsx
<StatusTimeline currentStatus={app.status} timestamps={...} />
// 6-step timeline (pending_verifikator → completed)
// Node: emerald (done), #106feb (active), slate-100 (upcoming)
// Line connector: emerald-400 (done) / slate-200 (upcoming)
```

#### d. `DetailRow.tsx`
```tsx
<DetailRow icon={Icon} label="Tujuan Magang" value={app.tujuan_magang} />
// Baris detail dengan ikon kiri + label + value
// Style: flex items-start gap-3, label uppercase text-xs text-slate-500
```

#### e. `EmptyState.tsx`
```tsx
<EmptyState icon={Icon} title="Belum ada pengajuan" description="..." actionLabel="Ajukan Sekarang" actionHref="/dashboard" />
// Center layout, ikon besar, judul, deskripsi, CTA button opsional
```

#### f. `StatCard.tsx`
```tsx
<StatCard icon={Icon} label="Total Pengajuan" value={35} trend="+12%" trendUp={true} />
// Kartu statistik dengan ikon, label, nilai besar, trend opsional
// Style: rounded-2xl border bg-white p-6, ikon dengan background #106feb/10
```

---

## 📐 Blueprint Per Halaman

### 🏠 **1. Landing Page (welcome.tsx)**

**Kondisi saat ini:** 1650 baris, 7 section, banyak animasi orbit/stagger, bento grid, OPD directory 35 instansi, FAQ accordion, form 12-field inline.

**Desain baru:**

#### Layout Structure
1. **Navbar (Sticky):** Simpel, logo kiri + nav links (hidden <md) + CTA "Daftar" + hamburger. Glassmorphism backdrop-blur hilangkan, ganti solid `bg-white/95` dengan `border-b border-slate-200` saat scroll. Oval shape terlalu playful → rectangle clean dengan shadow-sm.

2. **Hero:**
   - **Headline:** Reduce orbit images (6 → 0, terlalu ramai). Fokus ke teks + satu ilustrasi besar di kanan (atau bawah di mobile).
   - **Layout:** Grid 2-col (lg), kiri = teks (headline + subtext + 2 button), kanan = ilustrasi gedung/dashboard mockup.
   - **Badge pill:** Ganti "Versi 1.0 Beta" → status "Resmi Pemerintah Kota Madiun" dengan ikon ShieldCheck.
   - **Button:** "Daftar Magang" (primary gradient) + "Pelajari Alur" (outline).
   - **Trust bar:** 3 ikon + label (Free, Secure, 35 Agencies) → ubah jadi 4 stat (35 OPD, 200+ Peserta, 15 Bidang, E-Sertifikat Resmi) dalam pill kecil.

3. **Infinite Logo Slider (Instansi):** Pertahankan, tapi ganti ke logo image (jika ada) atau keep abbreviation dengan desain card lebih flat (shadow softer, border tipis).

4. **Fitur Unggulan (Bento Grid):**
   - Pertahankan 3-card layout (2 top + 1 full-width).
   - Kartu 1 & 2: Ikon lebih besar (h-12 w-12), background ikon `bg-[#cddcef]` dengan ikon `text-[#106feb]`.
   - Kartu 3 (E-Sertifikat): Ilustrasi certificate card di kanan, hover rotate-2 → rotate-0 (lebih halus).
   - Hover: y -12 → y -8 (kurangi bounce), shadow-sm → shadow-xl.

5. **Daftar Instansi / OPD (#instansi):**
   - **Search bar:** Tetap full-width pill, tapi border → ring-2 ring-slate-200, focus → ring-[#106feb].
   - **Grid:** 3-col (lg), card OPD dengan watermark Building2 di background (tetap), hover glow kurangi (opacity 0 → 50%, bukan 100%).
   - **Competency tags:** Pill badge dengan `bg-[#e8f2fe] text-[#106feb]` (lebih lembut).

6. **Alur Pendaftaran (#alur):**
   - Timeline horizontal (4 langkah) → ubah jadi **vertikal timeline** (lebih nyaman di mobile).
   - Node: emerald (done implisit step 0), #106feb (all steps karena ini flow guide, bukan status), connector line vertical.
   - Tiap step: Nomor dalam circle + icon + title + description, align-left.

7. **FAQ (#faq):**
   - Accordion: border-b divider, bukan rounded card per-item.
   - Chevron indicator: rotate-0 → rotate-180 saat expand, transition-transform 300ms.
   - Answer: grid-rows [0fr] → [1fr] (smooth height, pertahankan).

8. **Kontak + Form (#daftar):**
   - **Split 2-col (lg):** Kiri = info kontak (alamat, telepon, email, jam kerja, peta embed opsional), kanan = form 12-field.
   - **Form:** Pertahankan wizard 12-field inline, tapi ganti captcha slider → reCAPTCHA v2 checkbox mockup (lebih familiar). Styling input: `rounded-xl border-slate-200 focus:border-[#106feb] focus:ring-4 focus:ring-[#106feb]/15`.
   - **Submit button:** Gradient `bg-gradient-to-r from-[#106feb] to-[#0b4fb0]` dengan arrow icon, disabled state abu.

9. **Footer:**
   - 3-col (logo + nav links + kontak), `bg-slate-50 border-t border-slate-200`, padding py-12.
   - Logo + tagline kiri, nav center, info kontak kanan.

#### Interaksi
- Scroll-triggered fade-in untuk tiap section (intersection observer).
- Stagger grid cards (delay 0.08s per-item, bukan 0.15s → lebih cepat).
- Navbar shadow muncul saat scroll >50px.

---

### 🖥️ **2. MagangLayout (Shell Dasbor)**

**Kondisi saat ini:** Fixed sidebar (64 unit), topbar dengan brand + bell + dropdown, responsive sheet mobile.

**Desain baru:**

#### Desktop Sidebar
- **Width:** 240px (lebih lega, dari 64 unit = 256px → adjust ke 240px proporsional).
- **Background:** `bg-white border-r border-slate-200` (bukan bg-slate-50, lebih tegas).
- **Nav item:**
  - Default: `text-slate-600 hover:bg-slate-100 hover:text-[#0a1628]`
  - Active: `bg-gradient-to-r from-[#106feb] to-[#0b4fb0] text-white shadow-md`
  - Ikon: `size-5` (dari size-[18px]), spacing `gap-3`.
  - Rounding: `rounded-xl` (dari rounded-xl, keep).
- **Brand:** Logo "eM" dalam box `bg-gradient-to-br from-[#106feb] to-[#0b4fb0]`, shadow-sm.
- **Help card (bawah):** Gradient card dengan link "Pusat Bantuan", padding p-4, rounded-2xl.

#### Topbar
- **Height:** h-16 (dari h-16, keep).
- **Background:** `bg-white/80 backdrop-blur-md border-b border-slate-200` (glassmorphism ringan).
- **Title:** `text-lg font-semibold text-[#0a1628]`.
- **Bell:** Icon button dengan red dot (size-2, bg-rose-500), hover `bg-slate-100`.
- **User dropdown:**
  - Trigger: Avatar (initials, `bg-[#cddcef] text-[#106feb]`) + name + role (hidden <sm).
  - Menu: Rounded-xl, shadow-lg, border border-slate-200.

#### Mobile
- **Sheet drawer:** Slide dari kiri, full-height, `bg-white`, nav sama seperti desktop.
- **Hamburger:** Icon `Menu` → `X` saat open, transition 200ms.

---

### 📊 **3. Mahasiswa: Dashboard**

**Layout:**
1. **Hero greeting:** `bg-gradient-to-r from-[#106feb] to-[#0b4fb0] text-white rounded-3xl p-8`, nama user + peran + ilustrasi kanan (opsional).
2. **Stat cards (4):** Grid 2-col (md) → 4-col (lg), `StatCard` component. Ikon dengan `bg-[#cddcef] text-[#106feb]`.
3. **StatusTimeline:** 6-step vertical (mobile) / horizontal (lg), node emerald (done) / #106feb (active) / slate-100 (upcoming).
4. **Detail pengajuan:** `SectionCard` dengan `DetailRow` per-field. Jika `rejected` → alert banner merah di atas.
5. **ActionPanel:** Kondisional per status (ongoing → link penyelesaian, rejected → ajukan ulang, completed → unduh sertifikat). Button dengan ikon, `bg-[#106feb] hover:bg-[#0b4fb0]`.
6. **EmptyState:** Jika `application === null`, tampilkan `EmptyState` dengan ilustrasi + CTA "Ajukan Magang".

---

### 📄 **4. Mahasiswa: Pengajuan Saya**

**Layout 2/3 + 1/3:**
- **Kiri (flex-1):** "Riwayat Aktivitas" (`ActivityTimeline` vertikal, timestamp + event label) + "Dokumen Pengajuan" (grid 3-col cards, ikon PDF + nama file + ukuran).
- **Kanan (w-1/3, sticky top-24):** `StatusBadge` + `ActionPanel` + `SectionCard` detail pemohon + penempatan.

**Responsive:** <lg jadi stack vertikal (kanan naik ke atas setelah timeline).

---

### ✅ **5. Mahasiswa: Penyelesaian**

**Layout:** 3 stage cards vertikal (Unggah Laporan → Survei → Sertifikat).

**Stage Card:**
- `rounded-3xl border-2` (border-emerald-500 jika done, border-slate-200 jika locked, border-[#106feb] jika active).
- Header: nomor + judul + status badge (Selesai/Terkunci/Aktif).
- Content: File upload zone (drag-drop mockup) / form survei (StarRating custom) / download button.
- Lock icon: `Lock` di header jika `locked`, opacity-50.

**Survei:** 5 bintang hover (gold fill), textarea komentar opsional.

---

### 🛡️ **6–8. Verifikator: Dashboard, Masuk, Riwayat**

**Dashboard:**
- 4 stat cards (pending/forwarded/approved/rejected).
- Filter pills + search.
- Tabel responsif: desktop `<table>` dengan hover row (`hover:bg-slate-50`), mobile kartu.
- Klik row → `ReviewDialog` (Dialog shadcn, max-w-2xl, rounded-3xl).

**Masuk (Master-Detail):**
- Grid 2-col (lg): kiri list (scroll), kanan panel sticky (`ReviewPanel` inline, bukan dialog).
- List item: `rounded-2xl border hover:border-[#106feb] hover:shadow-lg`, active item `ring-2 ring-[#106feb]`.
- Panel: `rounded-3xl border-2 border-slate-200 bg-white p-6`, toggle Teruskan (Select OPD + 3 field) / Tolak (textarea).

**Riwayat:**
- Arsip read-only, filter + search, tabel, klik → `DetailDialog`.

---

### 🏛️ **9–11. OPD: Dashboard, Keputusan, Peserta**

**Sama pola dengan Verifikator**, sesuaikan:
- **Keputusan:** Master-detail sticky, toggle Setujui (banner emerald) / Tolak (textarea).
- **Peserta:** Grid 2-col (sm) → 3-col (lg) kartu peserta (`ParticipantCard`), avatar initials + nama + StatusBadge + divisi + progress bar (clamp 0-100%, bg-emerald-500 jika completed). Klik → `DetailDialog` read-only.

---

### 🆘 **12. Bantuan**

**Layout:**
1. **Hero:** Gradient header dengan search FAQ (live filter).
2. **Panduan Alur:** 4-card grid (numbered cards, `1 → 4`, ikon + title + description).
3. **FAQ:** Accordion (grouped by kategori via `useMemo`), chevron rotate.
4. **Kontak:** Card info kontak (alamat, telepon, email, jam) + tombol WA (`wa.me` link).

---

### ⚙️ **13. Pengaturan**

**Layout:** Vertical stack `SectionCard` per seksi (Profil, Tampilan, Notifikasi, Keamanan).

**Profil:** Grid 2-col input (nama, email read-only, WA, field per-role), save button bawah.

**Tampilan:** 3-col grid kartu tema (Terang/Gelap/Sistem), active `ring-2 ring-[#106feb]`.

**Notifikasi:** 3 toggle row (email status, reminder, ringkasan), toggle manual (switch bg-[#106feb] saat on).

**Keamanan:** Info OTP login (banner emerald dengan ShieldCheck) + logout button (outline rose).

---

### 🔍 **14. Lacak Status (Publik)**

**Layout:**
1. **Hero:** Branded header (logo + "Lacak Status Pengajuan") + input tiket + tombol Lacak.
2. **State:**
   - `found` → kartu ringkasan tiket + `StatusBadge` + `StatusTimeline` + grid detail + CTA masuk.
   - `notfound` → `EmptyState` dengan link ajukan baru.
   - `loading` → skeleton loader (pulse slate-200).

---

### 🔐 **15. Login OTP (Publik)**

**Layout:** Split-screen (lg), kiri panel brand (gradient gelap `#0a1628` + ilustrasi/logo besar), kanan form card.

**State A (Email):** 1 input email + button "Kirim Kode OTP".

**State B (OTP):** 6 kotak input terpisah (auto-focus, arrow nav, paste), countdown 60s, resend button (disabled saat countdown), button "Verifikasi".

**Animasi:** AnimatePresence slide kiri-kanan saat toggle state.

---

## 🚀 Strategi Implementasi

### Fase 1: Fondasi (Hari 1–2)
1. **Ekstrak komponen bersama:** `StatusBadge`, `SectionCard`, `DetailRow`, `EmptyState`, `StatCard`, `StatusTimeline` di `resources/js/components/` (bukan ui/).
2. **Update `types/magang.ts`:** Tambahkan export `STATUS_META` (value, bukan type) supaya semua halaman impor langsung.
3. **Hapus duplikasi:** Replace semua `TONE_BADGE` lokal dengan `import { STATUS_META } from '@/types/magang'`.
4. **Update Tailwind config:** (jika perlu) tambah extend colors `primary: { DEFAULT: '#106feb', hover: '#0b4fb0', light: '#cddcef', subtler: '#e8f2fe' }`.

### Fase 2: Landing (Hari 3)
Redesign `welcome.tsx` full sesuai blueprint: hapus orbit images, rombak hero, bento grid, OPD directory, timeline vertical, form split 2-col.

### Fase 3: Shell + Mahasiswa (Hari 4–5)
- Redesign `MagangLayout` (sidebar, topbar, mobile sheet).
- 3 halaman mahasiswa (dashboard, pengajuan, penyelesaian) dengan komponen bersama.

### Fase 4: Verifikator + OPD (Hari 6–7)
- 3 halaman verifikator (dashboard, masuk, riwayat).
- 3 halaman OPD (dashboard, keputusan, peserta).

### Fase 5: Publik + Shared (Hari 8)
- Login OTP split-screen.
- Lacak status.
- Bantuan, Pengaturan.

### Fase 6: Polish (Hari 9)
- Motion refinement (stagger timing, easing).
- Accessibility audit (focus ring, aria-label, keyboard nav).
- Responsive check semua breakpoint (sm/md/lg/xl).
- Dark mode prep (jika diminta nanti, skip dulu).

---

## ✅ Checklist Final

- [ ] Semua halaman pakai 3 warna brand (`#106feb`, `#0b4fb0`, `#cddcef`) konsisten.
- [ ] Tidak ada duplikasi `StatusBadge` / `TONE_BADGE` / `DetailRow` (semua impor dari shared).
- [ ] Tipografi hierarchy jelas (Display → H1 → H2 → H3 → Body → Small).
- [ ] Spacing konsisten (section py-16/24, card p-6/8, gap-4/6).
- [ ] Shadow progresif (flat → subtle → lifted → elevated → floating).
- [ ] Motion lembut (fade 0.4s, slide-up 0.5s, stagger 0.08–0.1s, scale hover 1.02).
- [ ] Responsive semua breakpoint (mobile-first, md/lg adaptive).
- [ ] Focus ring `ring-4 ring-[#106feb]/20` pada semua interactive.
- [ ] Empty state + loading state semua halaman.
- [ ] Build sukses (`npm run build`), eslint clean (`npx eslint <file>`).

---

**Blueprint siap.** Tunggu persetujuan sebelum eksekusi. Kalau ada bagian yang mau disesuaikan (mis. landing hero tetap pakai orbit, atau dashboard stat card jadi 3-col), bilang sekarang sebelum saya mulai koding.
