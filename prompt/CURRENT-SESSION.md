CONTEXT:
Project: E-Magang Kota Madiun — Laravel 13 + Inertia v3 + React 19 + TypeScript + PostgreSQL, Spatie Permission (3 roles: Mahasiswa, Admin OPD, Admin Verifikator).
Follow AGENTS.md: use Laravel Boost MCP tools first (database-schema, database-query, search-docs, browser-logs). HANDOFF-BACKEND.md is source of truth for existing routes/prop shapes.

I'm attaching 2 screenshots for reference:
- Screenshot 1: "Pengajuan Saya" page (Mahasiswa dashboard) — status "Disetujui", but a card labeled "Sedang Diproses" (circled) still shows, saying the application is under review.
- Screenshot 2: "Dasbor" page (Mahasiswa dashboard) — same issue, "Sedang Diproses" card (circled) still shows even though status is "Disetujui" and timeline shows "Pelaksanaan Magang — Sedang berlangsung".

Work through tasks in order. Report status after each. Run relevant Pest tests and `pint --dirty` after each task.

═══════════════════════════════════════
TASK 1 — Mobile numeric input + new phone number fields on registration form
═══════════════════════════════════════
- Find the registration form fields for NIS/NIM and No. WA (WhatsApp number).
- On mobile, these should trigger the numeric keypad directly (not full alphanumeric keyboard). Use `inputMode="numeric"` (and `pattern="[0-9]*"` if needed) on these inputs — confirm current input type/attributes first via the form component.
- Add TWO new fields to the registration form:
  1. "No. WA Dosen/Guru Pembimbing" (WhatsApp number of academic supervisor)
  2. "No. WA Penanggung Jawab" (WhatsApp number of person in charge)
- Both new fields should also use numeric-friendly mobile input like NIS/NIM and No. WA above.
- Check database-schema first: do these columns already exist anywhere (e.g. on internship_applications or a related table)? If not, create migration for new columns. Follow existing naming/type conventions used by the current No. WA column.
- Update validation rules (FormRequest) to include the new fields — confirm with me if they should be required or optional before assuming.
- Update HANDOFF-BACKEND.md if it documents this form's field list/prop shape.

═══════════════════════════════════════
TASK 2 — Profile picture missing on "Lacak Status Publik" menu inside dashboard
═══════════════════════════════════════
- On the dashboard's "Lacak Status Publik" page (opened while logged in), the user's profile photo does not appear in the top-right account area, unlike other dashboard menu pages (Dasbor, Pengajuan Saya, etc.) where it displays correctly.
- Investigate: is "Lacak Status Publik" using a different/incomplete header component than the other dashboard pages? Compare its header/account-area markup against a working page (e.g. Dasbor) to find the missing prop or component.
- Fix so the profile picture renders identically to other dashboard menu pages — reuse the same header/account component, don't duplicate.

═══════════════════════════════════════
TASK 3 — Hide "Sedang Diproses" card once application is approved and internship is ongoing
═══════════════════════════════════════
- See screenshots 1 and 2: the "Sedang Diproses" card (text: "Pengajuan Anda sedang ditinjau...") incorrectly still shows even when application status is "Disetujui" and the internship period has started (timeline shows "Pelaksanaan Magang — Sedang berlangsung").
- This card should only show while the application is genuinely still under review (status is pending/being verified) — NOT once it reaches "Disetujui" or later stages.
- Investigate: find the conditional logic controlling this card's visibility on both "Pengajuan Saya" and "Dasbor" pages. Confirm which status value(s) SHOULD show it, using database-schema to check the actual status enum values.
- Fix the conditional so this card only appears for genuinely pending/in-review statuses, and disappears once status is "Disetujui" or later in the lifecycle.
- Apply the fix consistently to BOTH pages (Pengajuan Saya and Dasbor) since both currently have the same bug — check if they share a component for this card.

═══════════════════════════════════════
TASK 4 — Show uploaded photo + documents (read-only) in "Dokumen Pengajuan" section
═══════════════════════════════════════
- On "Pengajuan Saya" page, the "Dokumen Pengajuan" section currently shows "Tidak ada dokumen terlampir" (see screenshot 1) even though the participant uploaded a pasfoto and documents (Surat Pengantar, CV, Portofolio — from earlier session) during registration.
- Investigate: confirm via database-schema/database-query whether these uploaded files ARE actually stored (check application_documents table or wherever they're stored) — is this a display bug (files exist but aren't queried/shown) or an upload bug (files never got saved)? Report which before fixing.
- Fix so this section displays: pasfoto (as an image thumbnail/preview) and each uploaded document (Surat Pengantar, CV, Portofolio if present) with a way to view/download each.
- IMPORTANT: this section must be READ-ONLY — the participant can VIEW their submitted files but must NOT be able to re-upload or replace them here. Do not add an upload/edit control in this section.

═══════════════════════════════════════
TASK 5 — Audit: which submitted participant data is NOT yet displayed anywhere in dashboards
═══════════════════════════════════════
- Use database-schema to list ALL columns/fields captured from the participant during registration (including the new WA fields from Task 1).
- Cross-check against what's currently displayed across the Mahasiswa dashboard pages (Dasbor, Pengajuan Saya, etc.) — identify any submitted field that is captured in the DB but never shown anywhere in the UI.
- Report the list of missing fields to me BEFORE adding anything — I'll confirm which ones should be added and where (e.g. "Detail Pemohon" card, a new section, etc.) before you implement.

ORDER: Task 1 → Task 3 (quick fix, high visibility) → Task 2 → Task 4 → Task 5 (report-only, wait for my confirmation before implementing).
# Checklist: Form Fields, Profile Photo, Status Card, Dokumen View (2026-07-15)

## Task 1 — Mobile numeric input + WA Dosen/Penanggung Jawab fields
- [ ] Input NIS/NIM pakai numeric keypad di mobile
- [ ] Input No. WA pakai numeric keypad di mobile
- [ ] Kolom baru: No. WA Dosen/Guru Pembimbing (migration + form + validasi)
- [ ] Kolom baru: No. WA Penanggung Jawab (migration + form + validasi)
- [ ] Konfirmasi: field baru wajib atau opsional? → **[isi keputusanmu di sini]**
- [ ] HANDOFF-BACKEND.md diupdate
- [ ] Test pass

## Task 2 — Foto profil hilang di menu "Lacak Status Publik"
- [ ] Root cause ditemukan (komponen header beda dari halaman lain?)
- [ ] Fix: reuse komponen header yang sama
- [ ] Verifikasi: foto profil muncul sama seperti di Dasbor/Pengajuan Saya
- [ ] Test pass

## Task 3 — Card "Sedang Diproses" tidak hilang saat status "Disetujui"
- [ ] Root cause ditemukan (kondisi status yang salah?)
- [ ] Fix di halaman "Pengajuan Saya"
- [ ] Fix di halaman "Dasbor"
- [ ] Verifikasi: card hilang begitu status "Disetujui" / magang berjalan
- [ ] Test pass

## Task 4 — Dokumen Pengajuan: tampilkan pasfoto + dokumen (read-only)
- [ ] Root cause ditemukan (bug tampilan atau file memang tidak tersimpan?)
- [ ] Pasfoto tampil sebagai thumbnail
- [ ] Surat Pengantar tampil (kalau ada) + bisa dilihat/download
- [ ] CV tampil (kalau ada) + bisa dilihat/download
- [ ] Portofolio tampil (kalau ada) + bisa dilihat/download
- [ ] Dikonfirmasi: TIDAK ada tombol upload/edit di section ini (read-only)
- [ ] Test pass

## Task 5 — Audit data yang belum tertampil di dashboard
- [ ] List field dari DB (termasuk WA baru dari Task 1) dikumpulkan
- [ ] Cross-check dengan yang sudah tampil di UI
- [ ] Laporan field yang hilang diterima → **[isi field mana yang mau ditambahkan]**
- [ ] Implementasi field yang disetujui (setelah konfirmasi)
- [ ] Test pass

---

## Status Keseluruhan
- [ ] Semua 5 task selesai
- [ ] Regresi dicek (kuota sync, lacak tiket, dll masih normal)
- [ ] `pint --dirty` clean
- [ ] Siap di-commit