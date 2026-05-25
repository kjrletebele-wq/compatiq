# CompatIQ — Public Beta Readiness Report

Generated: 2026-05-25

---

## 1. Current Readiness Status

**READY FOR PUBLIC BETA**

The app is safe, honest, and functional enough for a free public beta. All critical security
and privacy protections are in place. Results are clearly marked advisory. No fake data is
presented as real. All debug/setup routes are blocked in production.

---

## 2. What Works

### Core flows
- **Buy a device** — paste product URL → extract specs → purpose fit advisory → upgradeability → reviews → store comparison
- **Have a device** — enter serial number → device identification (or brand fallback) → specs → parts search
- **Find parts** — from report, find compatible parts via SerpApi/eBay or manual search phrase fallback

### Data extraction
- **Full extraction (PASS)**: Wootware, Computermania, Matrix Warehouse, Evetech, Samsung.com, OneDayOnly
- **Slug fallback (PARTIAL)**: Incredible Connection (403), GeeWiz (403), HiFi Corp (403), Amazon SA (503), Takealot (empty SPA)
- **Partial extraction**: Bash, Cellucity

### Matching
- Store listings: scored by brand + model + CPU number + RAM + storage, variant conflict detection, accessory/forum hard filter
- Review signals: classified as exactDevice / sameModelFamily / differentVariant / unrelated; noExactSignals and mixed coverage clearly labelled
- Parts: confidence + compatibility reason + seller question shown per listing

### Fallbacks
- Sparse URL extraction → spec paste textarea → merged advisory
- Serial failure → brand chip grid (23 brands) → link to official support page
- All providers not connected → manual search phrase + copy button

---

## 3. What Is Limited

- **Serial lookup APIs**: Dell, HP, Lenovo, Apple GSX — not configured. Lookups return "not connected" status.
  Users are directed to official brand support pages as fallback.
- **Retailer APIs**: All 8 SA retailer stubs not configured. Store/parts results come from SerpApi/eBay only.
- **eBay**: Optional. If not configured, only SerpApi results are shown.
- **URL extraction**: Some stores (Takealot, Amazon, IC) can only extract from URL slug — CPU/RAM often missing.
  Spec paste UI is shown automatically in these cases.
- **Review signals**: Match quality varies. noExactSignals and mixed coverage are clearly communicated in the UI.
- **In-memory rate limiting**: Acceptable for beta but does not share state across serverless instances.
  See security section.

---

## 4. Known Unreliable Store Types

| Type | Behaviour | UI handling |
|------|-----------|-------------|
| JavaScript SPA (Takealot) | Slug fallback | Spec paste prompt shown |
| Blocked with 403 (IC, GeeWiz) | Slug fallback | Spec paste prompt shown |
| Blocked with 503 (Amazon SA) | Slug fallback | Amazon-specific warning shown |
| CAPTCHA pages (Makro, Game) | Slug fallback | isProductTitle() detects and falls back |
| Category / listing pages | ID-only slug → FAIL | "Enter manually" prompt |
| ID-only URLs (Vodacom) | FAIL | Manual fallback shown |

---

## 5. Provider Status

| Provider | Status |
|----------|--------|
| SerpApi Shopping | ✅ Configured (SERPAPI_API_KEY set) |
| SerpApi Store Search | ✅ Configured |
| SerpApi Reviews | ✅ Configured |
| eBay Browse API | ⚠ Not configured (optional) |
| NVD CVE Lookup | ✅ Configured (free tier, no key required) |
| Dell / HP / Lenovo / Apple GSX | ⚠ Not configured — official API keys required |
| All SA retailer APIs | ⚠ Not configured — no official API exists yet |

---

## 6. Privacy Protections

- ✅ Serial numbers submitted via POST only — never in URL parameters
- ✅ Serial numbers masked in UI after submission (`SN/****xxxx`)
- ✅ Serial numbers hashed (SHA-256) for internal comparison
- ✅ Serial numbers never stored in sessionStorage or localStorage
- ✅ Serial numbers redacted from all server logs
- ✅ No API keys shown to users anywhere
- ✅ `.env.local` gitignored (pattern `.env*`)
- ✅ `.env.example` contains placeholder values only; `NEXT_PUBLIC_DEMO_MODE` removed
- ✅ No secrets prefixed with `NEXT_PUBLIC_`
- ✅ Brand support chips open official brand URLs in a new tab — no serial auto-submit
- ✅ Privacy, Terms, Disclaimer pages linked in footer

---

## 7. Security Protections

### Rate limiting (in-memory sliding window)
- `POST /api/product/analyse-link` → 10 req/min/IP
- `POST /api/parts/search` → 20 req/min/IP
- `POST /api/store/search-device` → 20 req/min/IP
- `POST /api/reviews/search` → 20 req/min/IP
- `POST /api/device/serial-lookup` → 10 req/min/IP

Returns `429 Too Many Requests` with `Retry-After` header when limit exceeded.

**Note:** In-memory limiting applies per warm serverless instance. For multi-instance production
scale, replace with Redis/Upstash (`@upstash/ratelimit`). Acceptable for beta.

### Debug route protection
- `GET /api/debug/providers` → 403 in production
- `POST /api/debug/save-env-key` → 403 in production
- `POST /api/debug/test-serpapi-parts` → 403 in production
- `GET /setup-live-data` → redirect to `/` in production (server component guard)

### Other
- All API keys read server-side only (no `NEXT_PUBLIC_` keys)
- No hardcoded secrets anywhere in source code
- SerpApi key: server-side env var only, never returned in API responses
- eBay client secret: server-side env var only

---

## 8. Public Beta Warnings (shown in-app)

### Site-wide
- Beta banner on every page: "CompatIQ is in public beta. Results are advisory and depend on
  available data from stores and connected providers."

### Report pages (buy-device/report, have-device/result)
- "CompatIQ provides advisory results based on available data. It does not guarantee performance,
  compatibility, price, stock, warranty, or repairability."

### Parts page
- "Compatibility is advisory only. Verify with the seller before purchasing."

### URL extraction (partial/sparse)
- Amber warning card when CPU/RAM not found: "This retailer blocked direct access. Open the
  product listing, copy the specifications section... and paste it below."

### Serial lookup failure
- Error state with brand chip fallback and instruction: "We could not confidently identify this
  device from the serial number. Enter the model or product number manually."

### Review signals
- noExactSignals=true: amber banner "We couldn't find reviews for this exact model"
- matchCoverage='mixed': info bar noting mixed exact/similar-model coverage

---

## 9. Known Issues and Limitations (documented, not blocking)

### npm audit
Two moderate vulnerabilities in `postcss <8.5.10` (XSS in CSS stringify output).
- Source: `next@16.2.6` bundles `postcss` internally
- Impact: development/build tooling only — not exposed to end users
- Fix: requires Next.js to update their internal postcss version
- `npm audit fix --force` would incorrectly downgrade Next.js to 9.3.3 — **do not run**
- **Not a production blocker** — postcss runs at build time, not in the browser

### In-memory rate limiting
Applies per warm serverless instance. Acceptable for beta volume; upgrade to Redis before
high-traffic public launch.

### Spec extraction completeness
No extraction is complete for every store. Some stores return slug-only results. UI handles all
cases gracefully and prompts users to paste specs manually.

---

## 10. Final Go / No-Go Decision

**GO — READY FOR PUBLIC BETA**

Conditions:
- Production build: ✅ passes (0 TypeScript errors, all pages generated)
- Debug routes: ✅ blocked in production
- Legacy routes: ✅ redirect to current routes
- Rate limiting: ✅ applied to all 5 externally-facing API routes
- Serial number privacy: ✅ all checks pass
- No fake data in production paths: ✅ confirmed
- Disclaimer / beta notices: ✅ present on all relevant pages
- Legal pages: ✅ /privacy, /terms, /disclaimer — linked in footer
- Known limitations: ✅ clearly communicated to users in the UI

Recommended launch label: **"Public Beta"** — not "v1.0" or "production ready".
