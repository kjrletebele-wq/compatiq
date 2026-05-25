# CompatIQ — Public Beta Deployment Guide

---

## Overview

This guide walks you through deploying CompatIQ to Vercel for public beta.
You do not need a custom domain to launch. Vercel provides a free `.vercel.app` URL.

---

## Step 1 — Push to GitHub

CompatIQ does not have a git repository initialised yet.

```bash
# In the compatiq/ directory:
git init
git add .
git commit -m "CompatIQ public beta"
```

Then create a new repository on GitHub (github.com → New repository).
Do not tick "Add a README" or "Add .gitignore" — the project already has them.

```bash
git remote add origin https://github.com/YOUR_USERNAME/compatiq.git
git branch -M main
git push -u origin main
```

**Important:** Confirm `.env.local` is NOT in the commit:
```bash
git status  # .env.local should not appear — it is gitignored
```

If it appears, run `git rm --cached .env.local` before pushing.

---

## Step 2 — Import into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create a free account).
2. Click **Add New Project**.
3. Click **Import Git Repository** and select your `compatiq` repo.
4. Framework: Vercel will auto-detect **Next.js**. Leave all settings as-is.
5. Do **not** upload `.env.local` or any secret files.
6. Click **Deploy** — the first deploy will fail or succeed without any API keys.
   That is fine. You will add keys in Step 3.

---

## Step 3 — Add Production Environment Variables

In your Vercel project → **Settings → Environment Variables**.

Add the following:

### Required for live results:

| Variable | Value | Notes |
|----------|-------|-------|
| `SERPAPI_API_KEY` | your SerpApi key | Powers parts, store search, reviews |

### Optional (improve results but not required for beta):

| Variable | Value | Notes |
|----------|-------|-------|
| `EBAY_CLIENT_ID` | eBay app client ID | Adds eBay parts/store results |
| `EBAY_CLIENT_SECRET` | eBay app secret | Required if EBAY_CLIENT_ID is set |
| `EBAY_MARKETPLACE_ID` | `EBAY_ZA` (or `EBAY_US` etc.) | Defaults to ZA |

### Do NOT add:
- `NEXT_PUBLIC_*` prefixed secrets — these are exposed to browsers
- `.env.local` file — never upload this
- Any manufacturer serial API keys unless you have official access agreements

After adding variables, Vercel will prompt a redeploy. Click **Redeploy**.

---

## Step 4 — Confirm .env.local is not uploaded

Vercel environment variables are set through the dashboard, not by uploading files.
Your `.env.local` must never be committed to GitHub or uploaded to Vercel.

The `.gitignore` in this project already contains `.env*` to prevent this.

---

## Step 5 — Deploy

After adding environment variables:
1. Go to your Vercel project dashboard.
2. Click **Deployments** → select the latest → **Redeploy**.
3. Wait for the build to complete (usually 1–2 minutes).

---

## Step 6 — Test Production Routes

After deployment, test these manually:

### Should work:
- `https://your-app.vercel.app/` — homepage loads
- `https://your-app.vercel.app/buy-device` — buy device flow loads
- `https://your-app.vercel.app/have-device` — have device flow loads
- `https://your-app.vercel.app/privacy` — privacy page loads
- `https://your-app.vercel.app/terms` — terms page loads
- `https://your-app.vercel.app/disclaimer` — disclaimer page loads

### Should be blocked:
- `https://your-app.vercel.app/setup-live-data` — should redirect to `/`
- `https://your-app.vercel.app/api/debug/providers` — should return 403
- `https://your-app.vercel.app/api/debug/save-env-key` — should return 403

### Should redirect:
- `https://your-app.vercel.app/looking-for-device` → `/buy-device`
- `https://your-app.vercel.app/i-have-device` → `/have-device`
- `https://your-app.vercel.app/parts-results` → `/parts`
- `https://your-app.vercel.app/advisory-report` → `/buy-device`

### Test a product link:
Paste a Wootware or Computermania product link into the buy-device flow and confirm a
full extraction and advisory is generated.

---

## Step 7 — Custom Domain (optional — do later)

After confirming the app works on the `.vercel.app` URL, you can add a custom domain:

1. Vercel project → Settings → Domains → Add Domain.
2. Enter your domain (e.g. `compatiq.app` or `usecompatiq.com`).
3. Add the DNS records Vercel shows you.

### Suggested beta domain names (check availability before purchasing):

- `compatiq.app`
- `usecompatiq.com`
- `getcompatiq.com`
- `compatiq.co.za`
- `compatiq.tech`

**Important:** Do not claim to own any of these until you have actually purchased the domain.
None of these are verified as available. Check at Namecheap, GoDaddy, or your preferred registrar.

---

## Step 8 — After Launch Checklist

- [ ] Confirm SerpApi key is active and has remaining quota
- [ ] Test the buy-device flow with at least 3 real product links
- [ ] Test the have-device flow with a real serial number
- [ ] Test the parts flow from a device report
- [ ] Confirm beta banner is visible on all main pages
- [ ] Confirm /setup-live-data is blocked (returns /)
- [ ] Confirm /api/debug/* returns 403
- [ ] Monitor SerpApi quota at serpapi.com/dashboard

---

## Upgrade path (post-beta)

When you are ready to move beyond beta:

1. **Rate limiting**: Replace in-memory limiter with Upstash Redis
   (`@upstash/ratelimit` + `@upstash/redis`)
2. **Serial lookup**: Obtain official API access from Dell, HP, Lenovo, or Apple GSX
3. **Retailer APIs**: Negotiate direct data feeds with SA retailers
4. **Monitoring**: Add Sentry or Vercel Analytics for error tracking
5. **Caching**: Add Redis cache for repeated URL/device lookups to reduce SerpApi usage

---

## Environment variable reference

See `.env.example` in the project root for a full list of all supported variables
with descriptions and grouping.
