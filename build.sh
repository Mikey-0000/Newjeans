#!/bin/sh
# Builds the site into ./dist for Cloudflare Pages (or any static host).
#   Build command:  sh build.sh        Output directory:  dist
# Optional: set SITE_URL (e.g. https://newjeans.pages.dev or your own domain) so share cards (Discord/X/iMessage)
# point at the new address. If SITE_URL isn't set, Cloudflare's CF_PAGES_URL is used when present.
set -e
OUT=dist
rm -rf "$OUT" && mkdir -p "$OUT"
tar --exclude='./.git' --exclude="./$OUT" --exclude='./node_modules' --exclude='./.github' --exclude='./build.sh' --exclude='./DEPLOY.md' --exclude='./wrangler.toml' --exclude='./package.json' --exclude='./.gitignore' -cf - . | (cd "$OUT" && tar -xf -)
SITE="${SITE_URL:-$CF_PAGES_URL}"
if [ -n "$SITE" ]; then
  SITE="${SITE%/}"
  for f in "$OUT"/*.html; do sed -i "s#https://mikey-0000.github.io/Newjeans/#$SITE/#g; s#https://mikey-0000.github.io/Newjeans#$SITE#g" "$f"; done
  echo "Share-card URLs set to $SITE"
else
  echo "SITE_URL not set: share cards still point at the GitHub Pages address."
fi
echo "Built $(find "$OUT" -type f | wc -l) files into $OUT/"
