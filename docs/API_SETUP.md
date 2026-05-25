# CompatIQ — API Provider Setup Guide

## Quick Start (get something working in 5 minutes)

1. Copy `.env.example` to `.env.local` at the project root.
2. Add **one** key to unlock live results immediately:

```
SERPAPI_API_KEY=your_key_here
```

SerpApi (https://serpapi.com) has a free plan with 100 searches/month. That's enough
to fully test the app. It enables parts search, store search, and review signals in one go.

3. Restart the dev server: `npm run dev`
4. Check which providers are now active: `GET http://localhost:3000/api/debug/providers`

---

## Provider Groups

### Group 1 — Search (highest value, get these first)

| Provider | Env Vars | What it unlocks | Sign-up |
|---|---|---|---|
| SerpApi | `SERPAPI_API_KEY` | Parts search, store search, reviews | https://serpapi.com |
| eBay Browse API | `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET` | eBay parts and device listings | https://developer.ebay.com |

**eBay setup steps:**
1. Register at https://developer.ebay.com
2. Create an application — choose "Production" environment
3. Copy the "App ID (Client ID)" → `EBAY_CLIENT_ID`
4. Copy the "Cert ID (Client Secret)" → `EBAY_CLIENT_SECRET`
5. Set `EBAY_MARKETPLACE_ID` to your market (default: `EBAY_US`; South Africa: `EBAY_ZA`)

### Group 2 — Manufacturer Serial Lookup

Serial lookup providers identify the device from its serial number (e.g. `SN/1234567`).
Without these, serial lookup will show "not connected" and users must enter device details manually.

| Provider | Env Vars | Notes |
|---|---|---|
| Dell | `DELL_CLIENT_ID` + `DELL_CLIENT_SECRET` | https://developer.dell.com — free |
| HP | `HP_API_KEY` | Requires business account approval |
| Lenovo | `LENOVO_API_KEY` | Partner API |
| Apple GSX | `APPLE_GSX_CERT` + `APPLE_GSX_KEY` | Requires Apple Authorised Service Provider agreement |
| Samsung | `SAMSUNG_API_KEY` | |
| Asus | `ASUS_API_KEY` | |
| Acer | `ACER_API_KEY` | |
| Microsoft Surface | `MICROSOFT_SURFACE_API_KEY` | |

**Important:** Serial numbers are never logged, never stored in URLs, and never sent via GET requests.
They are masked in all server-side logs as `SN/****xxxx` (last 4 digits only visible).

### Group 3 — South African Retailer APIs

These are stubs awaiting official retailer API or data feed partnerships. They will return
`not-configured` until a real key/feed exists. Do not scrape without explicit written permission.

| Store | Env Var |
|---|---|
| Takealot | `TAKEALOT_API_KEY` |
| Incredible Connection | `INCREDIBLE_CONNECTION_API_KEY` |
| Evetech | `EVETECH_API_KEY` |
| Wootware | `WOOTWARE_API_KEY` |
| iStore | `ISTORE_API_KEY` |
| Makro | `MAKRO_API_KEY` |
| Computer Mania | `COMPUTER_MANIA_API_KEY` |
| GeeWiz | `GEEWIZ_API_KEY` |

### Group 4 — Barcode/UPC Lookup

Used when a product page URL contains a UPC/EAN/GTIN barcode.

| Provider | Env Var | Notes |
|---|---|---|
| UPCItemDB | `UPCITEMDB_API_KEY` | Limited free tier at https://www.upcitemdb.com |
| BarcodeLookup | `BARCODELOOKUP_API_KEY` | |
| EAN Search | `EAN_SEARCH_API_KEY` | |
| GoUPC | `GOUPC_API_KEY` | |

### Group 5 — Security / NVD

The NVD (National Vulnerability Database) provider works without a key on the free tier.
Setting `NVD_API_KEY` gives higher rate limits.

```
NVD_API_KEY=your_key_here   # optional — get at https://nvd.nist.gov/developers/request-an-api-key
```

---

## Checking Provider Status

### Via browser (dev only)

```
GET http://localhost:3000/api/debug/providers
```

Returns a JSON summary of every provider:
- Which are configured
- Which env vars are missing for unconfigured providers
- Quick-start instructions

This endpoint returns **403 in production** (`NODE_ENV=production`).

### Example response

```json
{
  "summary": { "total": 28, "configured": 3, "notConfigured": 25 },
  "quickStart": ["Copy .env.example to .env.local", "..."],
  "byCategory": {
    "parts": [
      { "name": "SerpApi Shopping", "configured": true, "missingEnvVars": [] },
      { "name": "eBay Browse API", "configured": false, "missingEnvVars": ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"] }
    ]
  },
  "notConfiguredEnvVars": ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "..."]
}
```

---

## Minimum Working Setup (recommended for first test)

Add to `.env.local`:

```bash
SERPAPI_API_KEY=your_serpapi_key
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
EBAY_MARKETPLACE_ID=EBAY_ZA
```

With these four variables set, the following flows work end-to-end:
- Paste any product page URL → extract specs → view upgradeability report
- Click "Find parts" → get real eBay listings + Google Shopping results
- Browse store comparison → real eBay device listings
- Review signals → Google organic search snippets

---

## Environment Variable Security Rules

- Never commit `.env.local` to source control (it is in `.gitignore`)
- Never put secret keys in `.env.example` — that file is committed and public
- Never pass serial numbers in URLs or GET params — the app uses POST for all serial lookups
- Never log full serial numbers — `maskSerial()` masks them to `SN/****xxxx` format
