#!/usr/bin/env bash
# Hook PostToolUse — menjaga gate lokal tetap hijau tanpa perlu diingat.
#
# Kenapa perlu: workflow CI (.github/workflows/*.yml) hanya jalan di
# develop/main/master/workos, jadi branch feature seperti `newback` tidak
# terjaga apa pun kecuali `composer ci:check` yang dijalankan manual.
#
# Dua tugas:
#   1. Pint pada file .php yang baru diedit saja (bukan --parallel seluruh
#      repo) supaya gate `lint:check` tidak pernah merah karena format.
#   2. Bila yang diedit routes/*.php → regenerate helper Wayfinder.
#      resources/js/{actions,routes,wayfinder} gitignored dan hanya
#      di-refresh oleh `npm run dev`; kalau basi, `npm run types:check`
#      gagal di tempat yang tidak berhubungan dengan perubahan.
#
# Gagal apa pun tidak boleh memblokir edit → selalu exit 0.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$file" ] || exit 0

case "$file" in
*.php) ;;
*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

if [ -x vendor/bin/pint ]; then
    vendor/bin/pint --quiet "$file" >/dev/null 2>&1 || true
fi

case "$file" in
*/routes/*.php)
    php artisan wayfinder:generate --with-form >/dev/null 2>&1 || true
    ;;
esac

exit 0
