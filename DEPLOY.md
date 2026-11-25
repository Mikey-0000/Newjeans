# Deploying to Cloudflare Pages

This is a plain static site (no framework), so Cloudflare Pages needs no special setup.

## Option A: connect the GitHub repo (recommended, auto-deploys on every push)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the `mikey101101/Newjeans` repo and branch `main`.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `sh build.sh`
   - **Build output directory:** `dist`
4. (Optional but recommended) **Environment variables** → add `SITE_URL` = your final address, e.g. `https://newjeans.pages.dev` or your own domain. This makes the Discord/X/iMessage share cards point at the new site.
5. **Save and Deploy.** You get a `*.pages.dev` address; add a custom domain under **Custom domains** whenever you like.

## Option B: upload from your computer

```
npm install -g wrangler        # once
wrangler login                 # once
SITE_URL=https://newjeans.pages.dev npm run deploy
```

`npm run preview` runs the built site locally.

## Notes

- `build.sh` copies the site into `dist/` and rewrites the share-card URLs. Nothing else is changed.
- `_headers` sets sensible caching and allows the microphone/camera on your own pages (needed for the sing-along recorder and photo booth).
- The site works from the root of any domain, and also from a sub-folder (like GitHub Pages).
- The service worker keeps the site fresh when online, so new deploys show up on the next visit.
- Cloudflare Pages limits single files to 25 MiB. Every file here is far below that.
