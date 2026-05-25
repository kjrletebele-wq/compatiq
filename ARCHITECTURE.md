# CompatIQ — Full Architecture Document

Generated: 2026-05-22

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.2.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Icons | lucide-react | 1.16.0 |
| Class utilities | clsx + tailwind-merge | 2.1.1 / 3.6.0 |
| Package manager | npm | — |
| Build tool | Turbopack (Next.js built-in) | — |

---

## Full Folder Tree

```
compatiq/
│
├── app/                               ← Next.js App Router — all page routes
│   ├── globals.css                    ← Global styles, Tailwind import, scrollbar
│   ├── layout.tsx                     ← Root layout: wraps all pages with TopNav + Footer
│   ├── page.tsx                       ← Homepage
│   ├── advisory-report/
│   │   └── page.tsx                   ← Advisory Report display page
│   ├── i-have-device/
│   │   └── page.tsx                   ← "I have a device" identification page
│   ├── looking-for-device/
│   │   └── page.tsx                   ← "Looking for device" search/form page
│   ├── parts-results/
│   │   └── page.tsx                   ← Compatible parts listing page
│   └── how-it-works/
│       └── page.tsx                   ← Explanatory page
│
├── components/                        ← All React components
│   │
│   ├── layout/
│   │   ├── TopNav.tsx                 ← Sticky header, logo, nav links, mobile hamburger
│   │   └── Footer.tsx                 ← Footer, advisory disclaimer
│   │
│   ├── forms/
│   │   ├── LookingForDeviceForm.tsx   ← Category → Brand → Model → UseCase dropdowns
│   │   └── IHaveDeviceForm.tsx        ← Serial lookup tab + manual dropdown tab + part type filter
│   │
│   ├── ui/
│   │   ├── Button.tsx                 ← Reusable button (5 variants, 3 sizes, loading state)
│   │   ├── Card.tsx                   ← White card + DarkCard component
│   │   ├── Badge.tsx                  ← Status badges (7 variants)
│   │   └── SelectField.tsx            ← SelectField, InputField, TextAreaField
│   │
│   ├── parts/
│   │   ├── PartCard.tsx               ← Part listing card with compatibility label, price, seller question
│   │   └── PartsFilters.tsx           ← Filter sidebar: sort, part type, compat, price, condition
│   │
│   └── reports/
│       ├── RecommendationBadge.tsx    ← RecommendationBadge (inline) + RecommendationBlock (full-width)
│       ├── SpecsTable.tsx             ← Full specs table rendered from a Device object
│       ├── UseCaseSection.tsx         ← Suitability banner, progress bar, strengths, weaknesses, tools
│       ├── FutureOwnershipSection.tsx ← Risk cards grid (low/medium/high colour coded)
│       └── ReviewSignalsSection.tsx   ← Placeholder or live review sentiment + concerns
│
├── lib/                               ← All business logic, types, and data
│   │
│   ├── types/
│   │   ├── device.ts                  ← Device, DeviceSpecs, DeviceCategory, UseCase, USE_CASE_LABELS
│   │   ├── advisory.ts                ← AdvisoryReport, UseCaseAdvisory, FinalRecommendation, FutureOwnershipRisk
│   │   ├── parts.ts                   ← PartListing, PartType, CompatibilityLabel, PARTS_BY_CATEGORY
│   │   └── reviews.ts                 ← ReviewSignal
│   │
│   ├── data/
│   │   ├── deviceDatabase.ts          ← 48 real device specs, DEVICE_DB lookup map, makeDeviceKey()
│   │   │
│   │   ├── mock/
│   │   │   ├── mockDevices.ts         ← 7 legacy demo Device objects + findMockDeviceById/BySerial()
│   │   │   ├── mockParts.ts           ← 12 demo PartListing entries, getAllMockParts()
│   │   │   ├── mockReviews.ts         ← REVIEW_PLACEHOLDER + 2 device review signals, getMockReviewForDevice()
│   │   │   └── mockStores.ts          ← MOCK_STORES string array for filter UI
│   │   │
│   │   ├── freshness/
│   │   │   └── freshness.ts           ← DEMO_FRESHNESS constant, makeDemoFreshness(), freshnessLabel()
│   │   │
│   │   ├── normalisers/
│   │   │   └── normaliseDevice.ts     ← normaliseDeviceFromForm(RawDeviceFormData) → Device
│   │   │
│   │   └── providers/
│   │       └── productLinkProvider.ts ← extractProductFromUrl() async stub (link extraction MVP stub)
│   │
│   ├── logic/
│   │   ├── deviceLookup.ts            ← lookupDevice(c,b,m) → Device from DEVICE_DB or fallback stub
│   │   ├── dropdownResolver.ts        ← BRANDS_BY_CATEGORY, LAPTOP/PHONE/PC_MODELS, getBrandsForCategory(), getModelsForBrand()
│   │   ├── advisoryEngine.ts          ← generateAdvisoryReport(device, useCase, reviewSignal) → AdvisoryReport
│   │   ├── useCaseAdvisor.ts          ← generateUseCaseAdvisory(device, useCase) — 12 rule-based advisories
│   │   ├── compatibilityEngine.ts     ← getPartsForDevice(device, filters, sort) → PartListing[]
│   │   └── serialSearch.ts            ← searchBySerial(serial) → SerialSearchResult (demo only)
│   │
│   └── utils.ts                       ← cn(), formatPrice(), formatDate(), generateId(), truncate()
│
├── public/                            ← Static file serving (empty in MVP)
│
├── ARCHITECTURE.md                    ← This document
├── package.json                       ← Dependencies and scripts
├── package-lock.json
├── tsconfig.json                      ← TypeScript config, @/* path alias
├── next.config.ts                     ← Next.js config (minimal)
├── eslint.config.mjs                  ← ESLint 9 flat config
├── CLAUDE.md                          ← References AGENTS.md
└── AGENTS.md                          ← Instructions for Claude Code agents
```

---

## Every File — Purpose & Contents

---

### `app/layout.tsx`
**Type:** Server Component — Root Layout
**Purpose:** Wraps every page. Imports `TopNav` and `Footer`. Sets global metadata. Sets `bg-[#050a14]` dark body background.

```
Renders:
  <html>
    <body>
      <TopNav />
      <main>{children}</main>
      <Footer />
    </body>
  </html>

Metadata:
  title: "CompatIQ — Know what works before you buy"
  description: advisory + use-case description
```

---

### `app/globals.css`
**Type:** Global stylesheet
**Purpose:** Tailwind import, CSS variables, system font stack, scrollbar styling.

```
Contents:
  @import "tailwindcss"
  :root { --background: #050a14; --foreground: #f8fafc }
  body { font: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif }
  ::-webkit-scrollbar { width: 6px; track: #0f172a; thumb: #334155 }
```

---

### `app/page.tsx`
**Type:** Server Component — Homepage
**Route:** `/`
**Purpose:** Landing page. Two CTA cards linking to the two main journeys. Category tiles, what-you-get section, trust/no-fake-certainty note.

```
Sections:
  1. Hero — headline + two large white choice cards
       [I'm looking for a device] → /looking-for-device
       [I have a device]          → /i-have-device
  2. Supported categories — Laptop / Smartphone / PC tiles
  3. What you get — 3 feature blocks (use-case advisory, ownership risk, parts finder)
  4. Trust note — Shield icon + advisory language explanation
```

---

### `app/looking-for-device/page.tsx`
**Type:** Server Component — Page wrapper
**Route:** `/looking-for-device`
**Purpose:** Page shell that renders `LookingForDeviceForm` inside a white card with page header.

```
Renders:
  Page header (Search icon, title, description)
  <LookingForDeviceForm />  ← client component
  Demo disclaimer footnote
```

---

### `app/advisory-report/page.tsx`
**Type:** Client Component — Report display
**Route:** `/advisory-report?c=Laptop&b=Dell&m=XPS+15+9530&useCase=Coding`
**Purpose:** Reads URL params, resolves the device, generates the full advisory report, renders all report sections.

```
URL Params:
  c        → DeviceCategory
  b        → brand string
  m        → model string
  useCase  → UseCase enum value

Data flow:
  lookupDevice(c, b, m)           → Device
  getMockReviewForDevice(id)      → ReviewSignal
  generateAdvisoryReport(...)     → AdvisoryReport

Renders (top to bottom):
  ← Back to search link
  Report header card              → device name, use case, confidence badge
  RecommendationBlock             → StrongBuy / GoodBuy / BuyWithCaution / NotRecommended / NotEnoughInfo
  Missing specs warning           → if missingInformation.length > 0
  UseCaseSection                  → suitability, strengths, weaknesses, tools
  FutureOwnershipSection          → 6 risk cards
  ReviewSignalsSection            → sentiment, praises, complaints, concerns
  SpecsTable                      → full device specs
  Advisory disclaimer footnote

Error states:
  Missing params → error card
  Wrapped in <Suspense> with spinner fallback
```

---

### `app/i-have-device/page.tsx`
**Type:** Server Component — Page wrapper
**Route:** `/i-have-device`
**Purpose:** Page shell that renders `IHaveDeviceForm` inside a white card.

```
Renders:
  Page header (Zap icon, title, description)
  <IHaveDeviceForm />   ← client component
  Serial lookup disclaimer footnote
```

---

### `app/parts-results/page.tsx`
**Type:** Client Component — Parts listing
**Route:** `/parts-results?c=Laptop&b=Dell&m=XPS+15+9530&partType=Charger`
**Purpose:** Reads URL params, resolves device, loads parts, renders filter sidebar + parts grid.

```
URL Params:
  c         → DeviceCategory
  b         → brand
  m         → model
  partType  → PartType (optional initial filter)

State:
  filters: PartsSearchFilters  (default: all null)
  sort: PartsSortOrder         (default: BestCompatibility)

Data flow:
  lookupDevice(c, b, m)              → Device
  getPartsForDevice(device, f, s)    → PartListing[]

Renders:
  ← Back link
  Page header with device name and result count
  <PartsFilters />  ← left sidebar (lg: 256px wide)
  Parts grid        ← 2-column md, PartCard per result
  Empty state if 0 results
  Disclaimer footnote

  Wrapped in <Suspense> with spinner fallback
```

---

### `app/how-it-works/page.tsx`
**Type:** Server Component
**Route:** `/how-it-works`
**Purpose:** Educational page explaining both user journeys, advisory language key, report sections, supported part types.

```
Sections:
  Journey 1 — 4-step walkthrough for advisory report flow
  Journey 2 — 4-step walkthrough for parts finding flow
  Advisory language — Compatible / Likely / Check / NotEnough explained
  Data disclaimer — all data is demo
  Report anatomy — what each section of advisory report contains
  Supported part types — all 23 part types listed
```

---

### `components/layout/TopNav.tsx`
**Type:** Client Component (`'use client'`)
**Purpose:** Sticky dark header with logo, desktop nav links, active state detection, mobile hamburger.

```
Features:
  Logo: Zap icon in sky-500 rounded square + "CompatIQ" text
  Desktop nav: Home, Looking for a device, I have a device, How it works
  Active state: pathname === href (exact) or pathname.startsWith(href)
  Mobile: Hamburger (Menu/X icon toggle) → dropdown menu
  Sticky: top-0 z-50 backdrop-blur-xl bg-[#050a14]/90
```

---

### `components/layout/Footer.tsx`
**Type:** Server Component
**Purpose:** Simple footer with logo, nav links, advisory disclaimer paragraph.

```
Contents:
  Logo (Zap + CompatIQ)
  Links: How it works, Find a device, I have a device
  Disclaimer: "CompatIQ helps you make better buying decisions.
               It does not guarantee compatibility."
```

---

### `components/forms/LookingForDeviceForm.tsx`
**Type:** Client Component (`'use client'`)
**Purpose:** 4-step progressive form for the advisory report journey.

```
State:
  category: DeviceCategory | null
  brand: string
  model: string
  useCase: UseCase | null

Step 1 — Category tiles (Laptop / Smartphone / PC icon buttons)
Step 2 — Brand <select> (populated by getBrandsForCategory(category))
Step 3 — Model <select> (populated by getModelsForBrand(category, brand))
           + spec availability hint (green if in DB, amber if pending)
Step 4 — Use-case pills (grouped: Work & productivity / Creative / Other)

Submit → router.push(/advisory-report?c=&b=&m=&useCase=)

Validation: all 4 fields required before submit button appears
```

---

### `components/forms/IHaveDeviceForm.tsx`
**Type:** Client Component (`'use client'`)
**Purpose:** Two-tab form for identifying a device the user already owns, then finding parts.

```
Tabs:
  "Choose your device" — same 3-step dropdown chain as LookingForDeviceForm
  "Search by serial"   — text input + Look up button → searchBySerial()

Choose tab state:
  category, brand, model (same as LookingForDeviceForm)

Serial tab state:
  serial: string
  serialResult: SerialSearchResult | null
  serialSearched: boolean

Shared state:
  partType: PartType | null   ← optional filter shown after device resolved

Part type pills:
  Shown once device category is known
  Filtered to PARTS_BY_CATEGORY[category]

Submit (both tabs):
  → router.push(/parts-results?c=&b=&m=&partType=)

Serial fallback:
  If not found → "Choose manually" link switches tab
```

---

### `components/ui/Button.tsx`
**Type:** Client-compatible Component
**Purpose:** Reusable button with consistent styling.

```
Variants:
  primary   → bg-sky-500, white text, shadow
  secondary → bg-slate-800, slate-100 text, border
  ghost     → transparent, text-slate-300, hover bg
  danger    → red tinted bg, red text
  outline   → transparent bg, slate border

Sizes: sm (px-3.5 py-2), md (px-5 py-2.5), lg (px-7 py-3.5)

Props:
  loading?: boolean   → shows spinner, disables button
  fullWidth?: boolean → w-full
  All standard HTMLButtonElement attrs

Focus ring: ring-2 ring-sky-500/40
Disabled: opacity-50 cursor-not-allowed
```

---

### `components/ui/Card.tsx`
**Type:** Server Component
**Purpose:** Card layout primitives.

```
Card (white):
  bg-white border border-slate-200 rounded-2xl shadow-sm

DarkCard:
  bg-[#0f172a] border border-white/10 rounded-2xl

Props: children, className
```

---

### `components/ui/Badge.tsx`
**Type:** Server Component
**Purpose:** Inline status badge pills.

```
Variants: default, success, warning, danger, info, neutral, demo
Sizes: sm, md
Used for: Demo label, confidence indicators, availability status
```

---

### `components/ui/SelectField.tsx`
**Type:** Server Component
**Purpose:** Form primitives with labels, hints, error display.

```
Exports:
  SelectField   → <label> + <select> with options
  InputField    → <label> + <input>
  TextAreaField → <label> + <textarea>

All support: label, hint, error, disabled, className
```

---

### `components/parts/PartCard.tsx`
**Type:** Server Component
**Purpose:** Displays one compatible part listing with all compatibility information.

```
Layout (top to bottom):
  Compatibility header strip
    → colour-coded bg (emerald/sky/amber/slate)
    → Icon + label (Compatible / Likely compatible / Check before buying / Not enough info)
    → Confidence % right-aligned

  Body:
    Title + brand · store · availability
    Price (large, bold) + condition if not New
    Compatibility reason (1-2 sentences)
    Seller question (amber box with MessageSquare icon) — if present
    Footer: "View listing" link (or "No link available") + Demo badge

Compatibility colour configs:
  Compatible           → emerald
  LikelyCompatible     → sky
  CheckBeforeBuying    → amber
  NotEnoughInformation → slate
```

---

### `components/parts/PartsFilters.tsx`
**Type:** Client Component (`'use client'`)
**Purpose:** Left sidebar filter panel for the parts results page.

```
Controls:
  Sort by         → BestCompatibility / PriceLow / PriceHigh / BestValue / Newest
  Part type       → category-relevant types from PARTS_BY_CATEGORY
  Compatibility   → All / Compatible / LikelyCompatible / CheckBeforeBuying / NotEnoughInfo
  Condition       → Any / New / Used / Refurbished
  Price range     → Min $ / Max $ number inputs

"Clear all" button — appears when any filter is active
All changes call onFiltersChange() / onSortChange() callbacks immediately
```

---

### `components/reports/RecommendationBadge.tsx`
**Purpose:** Two components for the final advisory verdict.

```
RecommendationBadge (inline pill):
  Props: recommendation, size (sm|md|lg)
  5 colour configs + icon per FinalRecommendation

RecommendationBlock (full-width card):
  Large icon + recommendation label + "not a guarantee" subtext
  Used at top of advisory report
```

---

### `components/reports/SpecsTable.tsx`
**Purpose:** Renders a Device object into a readable specification table.

```
Rows shown (only if value is not null):
  Category, Brand, Model, Released, CPU, GPU, RAM, Storage,
  Display, Battery, Operating system, Ports, Connectivity,
  Camera, Dimensions, Weight, Price, Sold by, Warranty

Styling: hover:bg-slate-50 rows, slate label column (w-40)
```

---

### `components/reports/UseCaseSection.tsx`
**Purpose:** Renders a `UseCaseAdvisory` — the core section of every advisory report.

```
Sections:
  Suitability banner
    → colour by suitability:
        Excellent      = emerald (100% bar)
        Good           = sky     (80% bar)
        Acceptable     = amber   (55% bar)
        Limited        = orange  (30% bar)
        NotRecommended = red     (10% bar)
    → Use case label + suitability label + score progress bar
    → Summary paragraph

  Performance impact
    → Zap icon + explanation string

  Strengths + Weaknesses
    → 2-column grid, CheckCircle (green) / XCircle (red) icon lists

  Tools supported / Tools struggles
    → Pill badges: emerald for supported, red for struggles
```

---

### `components/reports/FutureOwnershipSection.tsx`
**Purpose:** Renders `FutureOwnershipRisk[]` as a responsive grid of risk cards.

```
6 risk areas:
  RAM upgrade, Storage upgrade, Battery replacement,
  Charger & accessories, Repairability, Long-term value

Risk colours:
  low     → emerald (CheckCircle icon)
  medium  → amber   (AlertTriangle icon)
  high    → red     (AlertTriangle icon)
  unknown → slate   (Info icon)

Grid: sm:grid-cols-2
```

---

### `components/reports/ReviewSignalsSection.tsx`
**Purpose:** Renders a `ReviewSignal` — either placeholder or actual review data.

```
Placeholder mode (isPlaceholder: true):
  Info icon + "No review sources connected yet" message

Live/demo mode:
  Sentiment banner (positive=emerald / mixed=amber / negative=red / neutral=slate)
  Source name + review summary + demo label if confidence='demo'
  Common praises   (ThumbsUp icons, emerald)
  Common complaints (ThumbsDown icons, red)
  Concern groups (battery / performance / reliability / build quality) → amber alert boxes
  Value for money comments (italicised quotes)
```

---

## Type Definitions

### `lib/types/device.ts`

```typescript
type DeviceCategory = 'PC' | 'Laptop' | 'Smartphone'

type UseCase =
  | 'School' | 'Office' | 'Coding' | 'GraphicDesign'
  | 'VideoEditing' | 'ThreeDDesign' | 'Gaming' | 'Business'
  | 'ContentCreation' | 'BasicHome' | 'Photography' | 'HeavyMultitasking'

const USE_CASE_LABELS: Record<UseCase, string>   // human-readable labels

interface DeviceSpecs {
  cpu: string | null
  gpu: string | null
  ram: string | null
  ramGb: number | null
  storage: string | null
  storageGb: number | null
  storageType: 'SSD' | 'HDD' | 'eMMC' | 'NVMe' | null
  display: string | null
  displayInches: number | null
  battery: string | null
  operatingSystem: string | null
  ports: string | null
  connectivity: string | null
  camera: string | null
  dimensions: string | null
  weight: string | null
  notes: string
}

interface Device {
  id: string
  category: DeviceCategory
  brand: string
  family: string | null
  model: string
  variant: string | null
  deviceName: string
  releaseYear: number | null
  specs: DeviceSpecs
  priceUsd: number | null
  priceCurrency: string | null
  sellerName: string | null
  productUrl: string | null
  warrantyInfo: string | null
  sourceName: string
  sourceUrl: string | null
  lastUpdated: string           // ISO date
  confidence: 'high' | 'medium' | 'low' | 'demo'
}

interface DropdownOption { value: string; label: string }
interface DeviceSelectorState { category, brand, family, model, variant }
```

---

### `lib/types/advisory.ts`

```typescript
type SuitabilityRating =
  | 'Excellent' | 'Good' | 'Acceptable' | 'Limited' | 'NotRecommended'

type FinalRecommendation =
  | 'StrongBuy' | 'GoodBuy' | 'BuyWithCaution'
  | 'NotRecommended' | 'NotEnoughInformation'

const RECOMMENDATION_LABELS: Record<FinalRecommendation, string>
const SUITABILITY_LABELS: Record<SuitabilityRating, string>

interface PerformanceImpact {
  label: SuitabilityRating
  explanation: string
}

interface FutureOwnershipRisk {
  area: string
  risk: 'low' | 'medium' | 'high' | 'unknown'
  note: string
}

interface UseCaseAdvisory {
  useCase: UseCase
  suitability: SuitabilityRating
  summary: string
  strengths: string[]
  weaknesses: string[]
  toolsSupported: string[]    // e.g. ["Photoshop", "Figma"]
  toolsStruggles: string[]    // e.g. ["Blender", "DaVinci"]
  performanceImpact: PerformanceImpact
}

interface AdvisoryReport {
  id: string
  device: Device
  selectedUseCase: UseCase
  useCaseAdvisory: UseCaseAdvisory
  futureOwnershipRisks: FutureOwnershipRisk[]
  recommendedFor: string[]
  notRecommendedFor: string[]
  missingInformation: string[]
  reviewSignals: ReviewSignal | null
  finalRecommendation: FinalRecommendation
  dataFreshness: 'live' | 'demo' | 'cached'
  generatedAt: string
}
```

---

### `lib/types/parts.ts`

```typescript
type PartType =
  | 'Charger' | 'Battery' | 'RAM' | 'SSD' | 'HDD' | 'GPU' | 'PSU'
  | 'Screen' | 'Keyboard' | 'DockingStation' | 'Cable' | 'Case'
  | 'ScreenProtector' | 'PowerBank' | 'CameraLensProtector' | 'Earphones'
  | 'Monitor' | 'CoolingPad' | 'Adapter' | 'CPUCooler' | 'CaseFan'
  | 'WifiAdapter' | 'LaptopBag'

type CompatibilityLabel =
  | 'Compatible' | 'LikelyCompatible' | 'CheckBeforeBuying' | 'NotEnoughInformation'

type ItemCondition = 'New' | 'Used' | 'Refurbished'

const PART_TYPE_LABELS: Record<PartType, string>

const PARTS_BY_CATEGORY: Record<DeviceCategory, PartType[]>
  // Laptop     → 10 relevant types
  // PC         → 10 relevant types
  // Smartphone → 10 relevant types

interface PartListing {
  id: string
  partType: PartType
  title: string
  brand: string | null
  storeName: string
  price: number
  currency: string
  productUrl: string | null
  imageUrl: string | null
  compatibilityLabel: CompatibilityLabel
  compatibilityConfidence: number     // 0-100
  compatibilityReason: string
  missingConfirmation: string | null
  sellerQuestion: string | null
  condition: ItemCondition
  availability: 'InStock' | 'LimitedStock' | 'OutOfStock' | 'Unknown'
  sourceName: string
  lastUpdated: string
  isDemo: boolean
}

interface PartsSearchFilters {
  partType: PartType | null
  store: string | null
  minPrice: number | null
  maxPrice: number | null
  compatibilityLabel: CompatibilityLabel | null
  brand: string | null
  condition: ItemCondition | null
  availability: string | null
}

type PartsSortOrder =
  | 'PriceLow' | 'PriceHigh' | 'BestCompatibility' | 'BestValue' | 'Newest'
```

---

### `lib/types/reviews.ts`

```typescript
interface ReviewSignal {
  sourceName: string
  reviewSummary: string
  commonPraises: string[]
  commonComplaints: string[]
  reliabilityConcerns: string[]
  batteryConcerns: string[]
  performanceConcerns: string[]
  buildQualityConcerns: string[]
  valueForMoneyComments: string[]
  sentiment: 'positive' | 'mixed' | 'negative' | 'neutral'
  lastUpdated: string
  confidence: 'high' | 'medium' | 'low' | 'demo'
  isPlaceholder: boolean
}
```

---

## Business Logic Files

### `lib/data/deviceDatabase.ts`
**Purpose:** The central device spec database. 48 real devices with manufacturer-accurate specs.

```
Lookup key format:
  `${category.toLowerCase()}:${brand.toLowerCase()}:${model.toLowerCase()}`

Devices by category:

  LAPTOPS (28 models)
  ─────────────────────────────────────────────────────────
  Apple
    MacBook Air 13" M1          (2020, 8GB RAM, 256GB SSD, fanless, ports: MagSafe2 + TB4×2)
    MacBook Air 13" M2          (2022, 8GB RAM, 256GB SSD, fanless, ports: MagSafe3 + TB4×2)
    MacBook Air 15" M2          (2023, 8GB RAM, 256GB SSD, fanless, 15.3" display)
    MacBook Air 13" M3          (2024, 8GB RAM, 256GB SSD, dual-display support)
    MacBook Pro 14" M3          (2023, 8GB RAM, 512GB SSD, active cooling)
    MacBook Pro 14" M3 Pro      (2023, 18GB RAM, 512GB SSD, 11-core CPU, 14-core GPU)
    MacBook Pro 16" M3 Pro      (2023, 18GB RAM, 512GB SSD, 12-core CPU, 18-core GPU)
    MacBook Pro 16" M3 Max      (2023, 48GB RAM, 1TB SSD, 40-core GPU, workstation class)

  Dell
    XPS 13 9340                 (2024, Core Ultra 7 155H, 16GB LPDDR5x, 512GB NVMe, 13.4" FHD+)
    XPS 15 9530                 (2023, i7-13700H, RTX 4060, 16GB DDR5, 15.6" OLED 3.5K)
    XPS 16 9640                 (2024, Core Ultra 9 185H, RTX 4070, 32GB, 16.3" OLED QHD+)
    Inspiron 15 3525            (2022, Ryzen 5 5625U, 8GB DDR4, 256GB SSD, budget)

  HP
    HP Pavilion 15              (2023, Ryzen 5 7530U, 8GB DDR4, 256GB SSD, entry-level)
    HP Envy x360 15             (2023, Ryzen 7 7730U, 16GB, 512GB NVMe, 2-in-1)
    HP Spectre x360 14          (2024, Core Ultra 5 125H, 16GB LPDDR5x, OLED 2.8K)
    HP OMEN 16                  (2023, i7-13700HX, RTX 4070, 16GB DDR5, 165Hz QHD)

  Lenovo
    ThinkPad T14 Gen 4          (2023, Ryzen 7 7840U, 16GB LPDDR5X, business)
    ThinkPad X1 Carbon Gen 11   (2023, i7-1365U, 16GB LPDDR5, 1.12kg ultralight)
    IdeaPad 5 15                (2023, Ryzen 5 7530U, 16GB DDR4, 512GB NVMe)
    Legion 5 Gen 8              (2023, Ryzen 7 7745HX, RTX 4060, 16GB DDR5, gaming)

  Asus
    ZenBook 14 OLED             (2023, i5-1335U, 16GB LPDDR5, 14" OLED 2.8K 90Hz)
    VivoBook 15                 (2023, i5-1335U, 8GB DDR4, 512GB NVMe, entry-level)
    ROG Zephyrus G14            (2024, Ryzen 9 8945HS, RX 7600S, 14" OLED QHD+)
    TUF Gaming A15              (2023, Ryzen 7 7735HS, RTX 4060, MIL-STD-810H)

  Acer
    Aspire 5                    (2023, i5-1335U, 8GB DDR5, 512GB NVMe, budget)
    Swift 3 OLED                (2023, Ryzen 5 7535U, 16GB, 14" OLED 2.8K)
    Nitro 5                     (2023, i5-13420H, RTX 3050, entry gaming)

  Microsoft Surface
    Surface Laptop 5            (2022, i5-1235U, 8GB LPDDR5, 13.5" PixelSense Touch)
    Surface Laptop 6            (2024, Core Ultra 5 135H, 16GB, Copilot+ PC)
    Surface Pro 9               (2022, i5-1235U, 8GB, 13" PixelSense 120Hz tablet)

  Samsung
    Galaxy Book4 Pro            (2024, Core Ultra 5 125H, 16GB, 14" Dynamic AMOLED 2X 120Hz)

  SMARTPHONES (15 models)
  ─────────────────────────────────────────────────────────
  Apple
    iPhone 14                   (2022, A15 Bionic, 6GB, Lightning, 6.1" 60Hz OLED)
    iPhone 15                   (2023, A16 Bionic, 6GB, USB-C, 6.1" 60Hz, Dynamic Island)
    iPhone 15 Pro               (2023, A17 Pro, 8GB, USB-C USB3, 120Hz, titanium, Camera Control)
    iPhone 15 Pro Max           (2023, A17 Pro, 8GB, 5× tetraprism telephoto, 6.7" 120Hz)
    iPhone 16                   (2024, A18, 8GB, Wi-Fi 7, Camera Control button)
    iPhone 16 Pro               (2024, A18 Pro, 8GB, 6.3" 120Hz, 48MP ultrawide)
    iPhone 16 Pro Max           (2024, A18 Pro, 8GB, 6.9" 120Hz, 4685mAh, 33h battery)

  Samsung
    Galaxy S24                  (2024, SD 8 Gen 3, 8GB, Wi-Fi 7, 7 years updates)
    Galaxy S24+                 (2024, SD 8 Gen 3, 12GB, titanium, 4900mAh)
    Galaxy S24 Ultra            (2024, SD 8 Gen 3, 12GB, S Pen, 200MP camera)
    Galaxy A55                  (2024, Exynos 1480, 8GB, microSD, 5000mAh mid-range)

  Google
    Pixel 8                     (2023, Tensor G3, 8GB, 7 years updates, 6.2" OLED)
    Pixel 8 Pro                 (2023, Tensor G3, 12GB, 48MP ultrawide, temperature sensor)
    Pixel 9                     (2024, Tensor G4, 12GB, Gemini AI, satellite messaging)

  DESKTOPS / PCs (4 models)
  ─────────────────────────────────────────────────────────
  Dell
    OptiPlex 7010               (2023, i5-13500, 8GB DDR4, 256GB NVMe, SFF business)
    Alienware Aurora R16        (2023, i7-13700KF, RTX 4070 12GB, 16GB DDR5, gaming)

  HP
    OMEN 45L                    (2023, i7-13700K, RTX 4070 Ti, 16GB DDR5, full tower)

  Lenovo
    ThinkCentre M90t            (2023, i7-13700, 16GB DDR4, 512GB NVMe, business tower)

Exports:
  DEVICE_DB: Record<string, Device>      ← keyed lookup map (built on module load)
  makeDeviceKey(c, b, m): string         ← key builder
  getAllDevices(): Device[]              ← full array
```

---

### `lib/logic/deviceLookup.ts`
**Purpose:** Resolves a user's (category, brand, model) selection to a Device object.

```
lookupDevice(category, brand, model): Device
  → queries DEVICE_DB[makeDeviceKey(c, b, m)]
  → if found: returns full Device with confidence='high'
  → if not found: returns minimal stub Device with all specs=null,
    confidence='low', notes field explains specs are pending.
    The advisory engine handles null specs gracefully
    (missingInformation[] array is populated automatically).

isDeviceInDatabase(category, brand, model): boolean
  → used by forms to show "Verified specs" vs "Specs pending" hint to user
```

---

### `lib/logic/dropdownResolver.ts`
**Purpose:** Supplies all dropdown data for the dependent Category → Brand → Model selectors.

```
BRANDS_BY_CATEGORY: Record<DeviceCategory, string[]>
  Laptop     → Apple, Dell, HP, Lenovo, Asus, Acer, Microsoft Surface,
               Samsung, Huawei, MSI, Razer
  PC         → Dell, HP, Lenovo, Asus, Acer, MSI, Custom PC, Mini PC, Workstation
  Smartphone → Apple, Samsung, Huawei, Xiaomi, Oppo, Vivo, Honor,
               Google, OnePlus, Nokia, Motorola

LAPTOP_MODELS: Record<brand, string[]>
  Apple           → 8 MacBook models
  Dell            → 8 models (XPS, Inspiron, Latitude)
  HP              → 9 models (Pavilion, Envy, Spectre, ProBook, EliteBook, OMEN)
  Lenovo          → 9 models (ThinkPad, IdeaPad, Yoga, Legion)
  Asus            → 7 models (ZenBook, VivoBook, ROG, TUF)
  Acer            → 6 models (Aspire, Swift, Nitro, Predator)
  Microsoft Surface → 6 models
  Samsung         → 4 Galaxy Book models
  Huawei          → 4 MateBook models
  MSI             → 4 models
  Razer           → 4 Blade models

SMARTPHONE_MODELS: Record<brand, string[]>
  Apple     → 13 iPhone models (11 through 16 Pro Max)
  Samsung   → 14 Galaxy models (A, S, Z series)
  Google    → 6 Pixel models
  + 8 other brands

PC_MODELS: Record<brand, string[]>
  8 brands, 3-4 models each

Functions:
  getBrandsForCategory(category): DropdownItem[]
  getModelsForBrand(category, brand): DropdownItem[]
  getCategories(): DropdownItem[]

CUSTOM_PC_FIELDS: { key, label }[]
  → 7 fields: cpu, gpu, ram, storage, psu, caseSize, motherboard
```

---

### `lib/logic/advisoryEngine.ts`
**Purpose:** Composes a full `AdvisoryReport` from a Device + UseCase + ReviewSignal.

```
generateAdvisoryReport(device, useCase, reviewSignal): AdvisoryReport
  1. generateUseCaseAdvisory(device, useCase)           → UseCaseAdvisory
  2. buildFutureOwnershipRisks(device)                  → FutureOwnershipRisk[]
  3. getMissingInformation(device)                      → string[]
  4. determineFinalRecommendation(...)                  → FinalRecommendation

buildFutureOwnershipRisks(device) — 6 areas:
  RAM upgrade:
    notes contains "soldered ram" → high risk
    Smartphone                   → high risk (always soldered)
    Laptop                       → medium risk (confirm before buying)
    PC                           → low risk (standard DIMM slots)

  Storage upgrade:
    notes contains "soldered ssd" → high risk
    Smartphone                    → high risk (no expansion)
    notes contains "ssd upgradeable" → low risk
    default                       → medium risk

  Battery replacement:
    Smartphone → medium (professional service needed)
    Laptop     → medium (varies by brand)
    PC         → low (no battery concern)

  Charger & accessories:
    Apple brand → medium (proprietary MagSafe / Lightning history)
    Others      → low (USB-C standard)

  Repairability:
    Apple phone → medium
    Laptop      → medium (model-specific parts)
    PC          → low (modular, easy to repair)

  Long-term value:
    age >= 3 years → medium (OS support concern)
    newer          → low

getMissingInformation(device):
  Checks: cpu, ramGb, storageType, gpu, display
  + Smartphone only: camera
  + Non-smartphone:  battery

determineFinalRecommendation(device, suitabilityRating, missingCount):
  missingCount > 3  → NotEnoughInformation
  'Excellent'       → StrongBuy
  'Good'            → GoodBuy
  'Acceptable'      → BuyWithCaution
  'Limited'         → BuyWithCaution
  'NotRecommended'  → NotRecommended
```

---

### `lib/logic/useCaseAdvisor.ts`
**Purpose:** Rule-based advisory for each of the 12 use cases. Core intelligence of the engine.

```
generateUseCaseAdvisory(device, useCase): UseCaseAdvisory
  → dispatches to one of 12 use-case specific functions

Helper spec signals:
  getRAMTier(ramGb):
    < 8   → 'low'
    8-15  → 'mid'
    16-31 → 'high'
    32+   → 'pro'

  hasDiscreteGPU(gpu):
    → true if GPU string contains NVIDIA / AMD Radeon + model / Radeon RX
    → false for integrated-only (Intel Iris, AMD Radeon Vega, Apple unified)

  hasSSD(storageType):
    → true for SSD / NVMe / eMMC
    → false for HDD
    → null for unknown

  getCPUTier(cpu):
    → 'weak'  : Celeron, Pentium, Atom, i3, Ryzen 3
    → 'mid'   : i5, Ryzen 5, Core Ultra 5
    → 'strong': i7, Ryzen 7, Core Ultra 7, M1/M2
    → 'pro'   : i9, Ryzen 9, Core Ultra 9, M3 Pro/Max, Tensor

  getDisplayScore(device):
    → 'excellent': OLED / Retina XDR / QHD+ / 4K / 2.8K
    → 'good'     : FHD+ / IPS 1200p+ / 120Hz
    → 'basic'    : FHD 1080p standard / unknown

12 Use Cases and their key requirements:

  School:
    Excellent → RAM high+, SSD, display good+
    Good      → RAM mid, SSD
    Acceptable → RAM mid, HDD
    Limited   → RAM low
    Notes: portable weight, battery life, webcam quality considered

  Office:
    Excellent → RAM high+, SSD, connectivity strong
    Good      → RAM mid, SSD
    Acceptable → RAM mid, HDD
    Tools: Microsoft 365, Google Workspace, Zoom, Teams, Slack

  Coding:
    Excellent → RAM high+, SSD, CPU strong+
    Good      → RAM mid, SSD, CPU mid
    Acceptable → RAM mid, any storage, CPU mid
    Limited   → RAM low
    Tools: VS Code, JetBrains, Docker, GitHub Desktop, Terminal
    Struggles: running many Docker containers simultaneously, VMs

  GraphicDesign:
    Excellent → RAM high+, display excellent, GPU discrete
    Good      → RAM high, display good, GPU any
    Acceptable → RAM mid, display good
    Limited   → RAM low or display basic
    Tools: Photoshop, Illustrator, Figma, Affinity
    Struggles: 3D rendering in Blender, 8K exports

  VideoEditing:
    Excellent → RAM pro, GPU discrete, SSD, display excellent
    Good      → RAM high, GPU discrete, SSD
    Acceptable → RAM high, no discrete GPU
    Limited   → RAM mid, HDD, no GPU
    Tools: DaVinci Resolve, Premiere Pro, Final Cut (Mac), CapCut
    Struggles: 4K+ multi-cam, DaVinci Resolve Fusion 3D

  ThreeDDesign:
    Excellent → GPU discrete, RAM pro, CPU pro
    Good      → GPU discrete, RAM high
    Acceptable → GPU discrete, RAM mid
    Limited   → no discrete GPU (integrated only)
    NotRecommended → no GPU + low RAM
    Tools: Blender, Cinema 4D, Maya, SolidWorks
    Struggles: GPU rendering without NVIDIA CUDA

  Gaming:
    Excellent → GPU discrete, RAM high+, CPU strong+
    Good      → GPU discrete, RAM mid
    Acceptable → GPU discrete, RAM low
    Limited   → integrated GPU only, RAM mid+
    NotRecommended → integrated GPU, RAM low
    Tools: Steam, Epic Games, most AAA titles (if GPU present)
    Struggles: AAA 4K gaming on integrated graphics

  Business:
    Excellent → RAM high+, SSD, connectivity, battery good
    Good      → RAM mid, SSD
    Acceptable → RAM mid, any storage
    Limited   → RAM low
    Tools: Office 365, Salesforce, SAP, Zoom, Teams
    Considers: 4G LTE availability, fingerprint/face auth

  ContentCreation:
    Excellent → display excellent, RAM high, GPU, camera good (phones)
    Good      → display good, RAM mid, some GPU
    Acceptable → display any, RAM mid
    Limited   → RAM low, poor display
    Tools: CapCut, Canva, Lightroom, Photoshop, OBS, Streamlabs

  BasicHome:
    Excellent → any modern CPU, SSD, RAM mid+
    Good      → RAM low, SSD
    Acceptable → RAM low, HDD
    (almost any modern device passes this use case)
    Tools: YouTube, Netflix, email, social media, word processing

  Photography:
    Excellent → display excellent, storage large, camera good (phones)
    Good      → display good, storage adequate
    Acceptable → display basic, storage adequate
    Tools: Lightroom, Photoshop, Snapseed, Google Photos
    Phones: camera spec directly impacts suitability

  HeavyMultitasking:
    Excellent → RAM pro, SSD, CPU pro
    Good      → RAM high, SSD, CPU strong
    Acceptable → RAM high, CPU mid
    Limited   → RAM mid
    NotRecommended → RAM low
    Tools: running many apps simultaneously, multiple browser tabs + Zoom + editors
```

---

### `lib/logic/compatibilityEngine.ts`
**Purpose:** Filters and sorts parts listings for a given device.

```
getAvailablePartTypes(device): string[]
  → returns PARTS_BY_CATEGORY[device.category]

getPartsForDevice(device, filters, sort): PartListing[]
  Step 1: getAllMockParts()   → all 12 demo parts
  Step 2: filter to PARTS_BY_CATEGORY[device.category] types only
  Step 3: apply filters:
    partType          → exact PartType match
    store             → exact storeName match
    minPrice          → p.price >= minPrice
    maxPrice          → p.price <= maxPrice
    compatibilityLabel → exact match
    brand             → exact match
    condition         → exact match
  Step 4: sort:
    PriceLow          → ascending price
    PriceHigh         → descending price
    BestCompatibility → descending compatibilityConfidence
    BestValue         → descending (confidence / price) ratio
    Newest            → descending lastUpdated date
```

---

### `lib/logic/serialSearch.ts`
**Purpose:** Serial number lookup — demo mode only.

```
SERIAL_PRIVACY_NOTE: string
  "Serial numbers can help identify a device, but exact compatibility may still
   require model number, region, or part number confirmation.
   CompatIQ does not store your serial number."

searchBySerial(serial): SerialSearchResult
  if serial.length < 4 → not found
  calls findMockDeviceBySerial(serial) (prefix matching, demo only)
  Demo prefix matching:
    XPS / DELL → Dell XPS 15 9530
    MBP / C02  → MacBook Pro 14" M3 Pro
    PF / TPT   → ThinkPad T14 Gen 4
    SAM / SM   → Samsung Galaxy S24
  Always sets: requiresManualConfirmation: true, confidence: 'demo'

interface SerialSearchResult:
  found: boolean
  device: Device | null
  confidence: 'demo' | 'low' | 'medium' | 'high'
  message: string
  requiresManualConfirmation: boolean

Production path (commented in source):
  Apple  → Apple GSX (requires Authorized Reseller status)
  Dell   → Dell Tech Direct API
  HP     → HP Warranty Check API
  Lenovo → Lenovo Warranty API
```

---

### `lib/data/mock/mockParts.ts`
**Purpose:** 12 demo PartListing entries covering different part types and compatibility scenarios.

```
ID         Part Type       Title                                    Store           Price    Label                   Confidence
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
part-001   Charger         Anker 65W USB-C GaN (PowerPort III)      Amazon          $29.99   LikelyCompatible        72%
part-002   Charger         Dell 130W AC Adapter Barrel (7.4mm)      Dell Official   $59.99   Compatible              91%
part-003   Charger         Generic 65W USB-C (No PD listed)         Takealot        $12.99   CheckBeforeBuying       35%
part-004   RAM             Crucial 16GB DDR4-3200 SODIMM            Wootware        $39.99   LikelyCompatible        78%
part-005   RAM             Kingston 32GB DDR5-4800 SODIMM           Evetech         $79.99   CheckBeforeBuying       55%
part-006   SSD             Samsung 970 EVO Plus 1TB NVMe            Wootware        $89.99   LikelyCompatible        80%
part-007   Case            Spigen Ultra Hybrid — iPhone 15 Pro      Amazon          $19.99   Compatible              95%
part-008   Case            Generic Universal Silicone               Takealot        $4.99    NotEnoughInformation    20%
part-009   GPU             MSI RTX 4070 Gaming X Trio 12GB          Evetech         $599.99  CheckBeforeBuying       60%
part-010   ScreenProtector Whitestone Dome Glass — Galaxy S24       Amazon          $39.99   Compatible              93%
part-011   LaptopBag       Targus 15.6" Laptop Backpack (TSB966)    Takealot        $49.99   Compatible              90%
part-012   PowerBank       Anker 10000mAh USB-C Power Bank (A1229)  Amazon          $24.99   LikelyCompatible        80%
```

---

### `lib/data/mock/mockReviews.ts`
**Purpose:** Review signals for 2 specific devices + universal placeholder.

```
REVIEW_PLACEHOLDER (isPlaceholder: true):
  Used for all devices not explicitly in MOCK_REVIEWS
  Sentiment: neutral
  Message: "No verified review sources connected yet"

MOCK_REVIEWS['lp-001'] — Dell XPS 15 9530:
  Sentiment: mixed
  Praises:    OLED display quality, CPU performance, build quality, ports
  Complaints: thermal throttling, battery life, fan noise, premium price
  Battery:    6-8h real-world use (below average for 15")
  Performance: CPU throttles on battery

MOCK_REVIEWS['ph-001'] — Apple iPhone 15 Pro:
  Sentiment: positive
  Praises:    48MP camera, A17 Pro speed, titanium, USB-C, Action button
  Complaints: slow charging vs Android, average battery, high price, no charger
  Battery:    5-7h screen-on time despite 23h rated

getMockReviewForDevice(deviceId): ReviewSignal
  → returns MOCK_REVIEWS[deviceId] if exists, else REVIEW_PLACEHOLDER
```

---

### `lib/data/freshness/freshness.ts`
**Purpose:** Data freshness tracking utilities.

```
DEMO_FRESHNESS: FreshnessRecord
  → default freshness object for all demo data

makeDemoFreshness(): FreshnessRecord
  → creates a freshness record marked as demo

freshnessLabel(freshness): string
  → returns "Demo data" / "Live" / "Cached" / "Stale" based on record
```

---

### `lib/data/normalisers/normaliseDevice.ts`
**Purpose:** Converts raw form input strings to a typed Device object.

```
interface RawDeviceFormData
  → all fields as string (form values are always strings)
  → fields: category, brand, family, model, variant, deviceName, releaseYear,
            cpu, gpu, ram, ramGb, storage, storageGb, storageType, display,
            displayInches, battery, operatingSystem, ports, connectivity,
            camera, dimensions, weight, priceUsd, sellerName, productUrl,
            warrantyInfo, notes

normaliseDeviceFromForm(raw: RawDeviceFormData): Device
  → parseNumber(): converts string to number | null (strips non-numeric chars)
  → parseStorageType(): 'nvme'→NVMe, 'ssd'→SSD, 'hdd'→HDD, 'emmc'→eMMC
  → Sets confidence: 'low'
  → Sets sourceName: 'User input'
  → Generates id: `usr-${Date.now()}-${random}`
```

---

### `lib/data/providers/productLinkProvider.ts`
**Purpose:** Product URL extraction. Architecture placeholder for future link extraction.

```
extractProductFromUrl(url: string): Promise<Partial<Device>>
  → Currently: returns empty object after simulated delay (MVP stub)
  → IMPORTANT note in source: do not scrape without explicit permission
  → Production path: integrate with licensed retailer product APIs
    (Best Buy API, Samsung API, Apple product API, etc.)
```

---

### `lib/data/mock/mockStores.ts`
**Purpose:** Store name list for filter dropdowns.

```
MOCK_STORES: string[]
  Amazon, Takealot, Wootware, Evetech, Dell Official, Apple, Samsung, Lenovo, HP
```

---

### `lib/utils.ts`
**Purpose:** Shared utility functions used across all components and logic.

```
cn(...inputs: ClassValue[]): string
  → clsx + tailwind-merge
  → Resolves Tailwind class conflicts (e.g. bg-red-500 + bg-blue-500 → bg-blue-500)

formatPrice(amount: number | null, currency = 'USD'): string
  → Intl.NumberFormat 'en-US' currency format
  → Returns "Price not listed" if amount is null

formatDate(iso: string): string
  → Intl.DateTimeFormat 'en-US' → "May 1, 2026"

generateId(): string
  → `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

truncate(str: string, max: number): string
  → returns str if length <= max, else str.slice(0, max-1) + "…"
```

---

## URL Schema

```
Route                Route Format                                       Description
───────────────────────────────────────────────────────────────────────────────────────────
/                   /                                                   Homepage
/looking-for-device /looking-for-device                                 Device search form
/advisory-report    /advisory-report?c=Laptop&b=Dell&m=XPS+15+9530     Advisory report
                                     &useCase=VideoEditing
/i-have-device      /i-have-device                                      Device ID form
/parts-results      /parts-results?c=Laptop&b=Dell&m=XPS+15+9530       Parts listing
                                   &partType=Charger
/how-it-works       /how-it-works                                       Explanation page

URL Parameter keys:
  c         → DeviceCategory  ('Laptop' | 'PC' | 'Smartphone')
  b         → brand string    (e.g. 'Dell', 'Apple', 'Microsoft Surface')
  m         → model string    (e.g. 'XPS 15 9530', 'MacBook Pro 14" M3 Pro')
  useCase   → UseCase enum    (e.g. 'VideoEditing', 'Gaming', 'Coding')
  partType  → PartType enum   (e.g. 'Charger', 'RAM', 'Case') — optional
```

---

## Data Flow Diagrams

### Advisory Report Flow

```
User opens /looking-for-device
        │
        ▼
LookingForDeviceForm (client component)
        │
        ├── Step 1: Category tile selected
        │     └── getBrandsForCategory(category) → brand <select> populates
        │
        ├── Step 2: Brand selected
        │     └── getModelsForBrand(category, brand) → model <select> populates
        │
        ├── Step 3: Model selected
        │     └── isDeviceInDatabase(c, b, m) → "Verified specs" or "Specs pending" hint
        │
        ├── Step 4: UseCase pill clicked
        │
        └── Submit → router.push(/advisory-report?c=&b=&m=&useCase=)
                │
                ▼
        advisory-report/page.tsx
                │
                ├── useSearchParams() → c, b, m, useCase
                │
                ├── lookupDevice(c, b, m)
                │     ├── DEVICE_DB match → Device (confidence='high', full specs)
                │     └── No match       → Device stub (confidence='low', specs=null)
                │
                ├── getMockReviewForDevice(device.id)
                │     ├── MOCK_REVIEWS match → ReviewSignal
                │     └── No match           → REVIEW_PLACEHOLDER
                │
                ├── generateAdvisoryReport(device, useCase, reviewSignal)
                │     ├── generateUseCaseAdvisory(device, useCase)   [12-rule engine]
                │     ├── buildFutureOwnershipRisks(device)           [6 risk areas]
                │     ├── getMissingInformation(device)               [null spec check]
                │     └── determineFinalRecommendation(...)           [suitability + count]
                │
                └── Renders:
                      RecommendationBlock    ← verdict
                      Missing specs warning  ← if any
                      UseCaseSection         ← suitability, strengths, tools
                      FutureOwnershipSection ← 6 risk cards
                      ReviewSignalsSection   ← sentiment + concerns
                      SpecsTable             ← full specs
```

---

### Parts Finding Flow

```
User opens /i-have-device
        │
        ▼
IHaveDeviceForm (client component)
        │
        ├── Tab A: "Choose your device"
        │     ├── Category tile → getBrandsForCategory() → brand <select>
        │     ├── Brand <select> → getModelsForBrand() → model <select>
        │     └── Model selected → PARTS_BY_CATEGORY[category] part type pills shown
        │
        └── Tab B: "Search by serial"
              ├── Enter serial → Look up → searchBySerial()
              │     ├── Demo prefix match → SerialSearchResult (found=true)
              │     └── No match         → "Choose manually" fallback link
              └── If found → PARTS_BY_CATEGORY[device.category] part type pills shown
                │
                ▼
        Submit → router.push(/parts-results?c=&b=&m=&partType=)
                │
                ▼
        parts-results/page.tsx
                │
                ├── useSearchParams() → c, b, m, partType
                │
                ├── useState: filters (all null), sort ('BestCompatibility')
                │
                ├── lookupDevice(c, b, m) → Device
                │
                ├── getPartsForDevice(device, filters, sort)
                │     ├── getAllMockParts()                   [12 entries]
                │     ├── filter by PARTS_BY_CATEGORY[category]
                │     ├── apply user filters
                │     └── sort by selected order
                │
                └── Renders:
                      PartsFilters (sidebar)  ← filter controls, updates state
                      PartCard grid           ← one card per part
                      Empty state             ← if 0 results after filtering
```

---

## Advisory Language Rules

| Situation | Exact language used |
|-----------|-------------------|
| Parts with full spec match | "Compatible" |
| Parts with likely match, verify one spec | "Likely compatible" |
| Parts missing a key spec | "Check before buying" |
| Insufficient data to call | "Not enough information" |
| Device found in DEVICE_DB | "Verified specs" (green hint) |
| Device not in DEVICE_DB | "Specifications pending for this model" (amber hint) |
| Final report verdict subtext | "Advisory result — not a guarantee" |
| Serial lookup result | "Please confirm this is your device" |
| All data in MVP | "Demo data" badge |
| Page footers | "Results are advisory only. Verify with the seller before purchasing." |

---

## Colour System

```
Background:      #050a14       (near-black dark slate — all pages)
Card surfaces:   bg-white      (white on dark = high contrast)
Dark cards:      #0f172a       (slightly lighter than bg)

Primary actions: sky-500       (#0ea5e9) — advisory report journey
Secondary:       emerald-500   (#10b981) — parts/I have a device journey
Accent:          violet-400    (feature highlights on homepage)

Semantic colours:
  Excellent / Compatible / Success    → emerald
  Good / Likely compatible            → sky
  Acceptable / Check before buying    → amber
  Limited / Warning                   → orange
  NotRecommended / Danger             → red
  Unknown / Neutral / NotEnoughInfo   → slate

Text hierarchy:
  Primary text:   text-slate-800 / text-slate-900 (on white cards)
  Secondary text: text-slate-500 / text-slate-600
  Page text:      text-slate-100 / text-slate-400 (on dark bg)
```

---

## Configuration Files

### `package.json`
```json
{
  "scripts": {
    "dev":   "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint":  "next lint"
  },
  "dependencies": {
    "next":           "16.2.6",
    "react":          "^19.2.4",
    "react-dom":      "^19.2.4",
    "lucide-react":   "^1.16.0",
    "clsx":           "^2.1.1",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "typescript":           "^5",
    "tailwindcss":          "^4",
    "@eslint/eslintrc":     "^3",
    "eslint":               "^9",
    "eslint-config-next":   "16.2.6",
    "@types/react":         "^19",
    "@types/react-dom":     "^19",
    "@types/node":          "^20"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### `next.config.ts`
```typescript
// Minimal config — Turbopack handles everything
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {}
export default nextConfig
```

---

## Production Upgrade Paths

| Current MVP | Production replacement |
|-------------|----------------------|
| `mockParts.ts` — 12 hardcoded listings | PostgreSQL / Supabase parts table + live retailer product feeds |
| `mockReviews.ts` — 2 device signals | Google Shopping API, RTINGS licensed API, Reddit API sentiment |
| `serialSearch.ts` — demo prefix matching | Apple GSX, Dell Tech Direct, HP Warranty, Lenovo Warranty APIs |
| `productLinkProvider.ts` — no-op stub | Licensed retailer product APIs (not scrapers) |
| `mockDevices.ts` — 7 demo devices | Migrate to DB — `deviceDatabase.ts` structure already maps cleanly |
| URL-only state | Server-side saved reports (Supabase table) |
| No authentication | Supabase Auth or NextAuth.js |
| `getMockReviewForDevice()` | Real review lookup by device ID from review API |
| Static parts list | Scheduled jobs refreshing parts from retailer APIs weekly |

---

## Summary Counts

| Item | Count |
|------|-------|
| App routes (pages) | 6 |
| React components | 17 |
| TypeScript type files | 4 |
| Business logic files | 6 |
| Data files | 7 |
| Devices in database | 48 |
| Laptop models | 28 |
| Smartphone models | 15 |
| Desktop PC models | 4 |
| Demo part listings | 12 |
| Supported use cases | 12 |
| Supported part types | 23 |
| Dropdown laptop brands | 11 |
| Dropdown phone brands | 11 |
| Dropdown PC brands | 9 |
| Ownership risk areas analyzed | 6 |
| Compatibility label levels | 4 |
| Final recommendation levels | 5 |
| Suitability rating levels | 5 |
