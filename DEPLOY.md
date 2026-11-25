# Deploying to Cloudflare Pages

This is a plain static site (no framework), so Cloudflare Pages needs no special setup.

## Cloudflare Workers (static assets): the setup shown in your dashboard

If your project was created as a **Worker** (build command `npm run build`, deploy command `npx wrangler deploy`), it works with the files in this repo:

- `npm run build` runs `build.sh`, which writes the site to `dist/`.
- `npx wrangler deploy` reads `wrangler.toml`, which serves `dist/` as static assets (with a proper 404 page).
- Optional: add a build variable `SITE_URL` (for example `https://newjeans.<your-subdomain>.workers.dev` or your own domain) so share cards point at the new address.

## Cloudflare Pages (alternative)

1. Workers & Pages → Create → **Pages** → Connect to Git → pick the repo and `main`.
2. Framework preset: None. Build command: `sh build.sh`. Build output directory: `dist`.
3. Optional: variable `SITE_URL`.

## From your computer

```
npm install -g wrangler && wrangler login
SITE_URL=https://your-site npm run deploy
```

## Notes

- `build.sh` copies the site into `dist/` and rewrites the share-card URLs. Nothing else is changed.
- `_headers` sets caching and allows the microphone/camera on your own pages (needed for the sing-along recorder and photo booth).
- The site works from the root of any domain, and also from a sub-folder (like GitHub Pages).
- Cloudflare limits single files to 25 MiB. Every file here is far below that.
