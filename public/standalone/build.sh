#!/usr/bin/env bash
# Concatenate the modular standalone/* sources into a single self-contained
# HTML file at public/it-strategy-standalone.html.
# Run from the repo root: bash public/standalone/build.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(dirname "$HERE")/it-strategy-standalone.html"

css() { cat "$HERE/styles.css"; }
js()  {
  for f in data.js views-picker.js views-wizard.js views-form.js views-filedrop.js views-review-results.js app.js; do
    echo ""
    echo "/* ======= $f ======= */"
    cat "$HERE/$f"
  done
}

cat > "$OUT" <<'HEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IT Strategy Diagnostic</title>
<style>
HEAD

css >> "$OUT"

cat >> "$OUT" <<'MIDDLE'
</style>
</head>
<body>

<aside class="sidebar">
  <div class="title-bar">
    <div class="logo">IT</div>
    <span class="title">IT Strategy Diagnostic</span>
  </div>
  <nav>
    <a data-view="dashboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
      Dashboard
    </a>
    <a data-view="new" class="active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
      New Analysis
    </a>
  </nav>
  <div class="footer">v0.1.0 &middot; West Monroe</div>
</aside>

<main class="main">
  <div class="container">
    <section id="view-new" class="view active content-wrap"></section>
    <section id="view-dashboard" class="view content-wrap"></section>
    <section id="view-wizard" class="view wizard-container"></section>
    <section id="view-form" class="view form-container"></section>
    <section id="view-filedrop" class="view form-container"></section>
    <section id="view-review" class="view content-wrap"></section>
    <section id="view-results" class="view results-container"></section>
  </div>
</main>

<script>
MIDDLE

js >> "$OUT"

cat >> "$OUT" <<'TAIL'
</script>
</body>
</html>
TAIL

lines=$(wc -l < "$OUT" | tr -d ' ')
size=$(wc -c < "$OUT" | tr -d ' ')
echo "✓ Built $OUT ($lines lines, $size bytes)"
