# Barcode Scan to Add Products — Research Findings

**Date:** July 2026  
**Task:** Spike to choose technical approach before building the "scan a barcode to add a product" feature.

---

## 1. Scanning Library Recommendation

### What was evaluated

| Library | Underlying engine | iOS Safari barcodes | Android Chrome | Bundle size | Maintenance |
|---|---|---|---|---|---|
| `html5-qrcode` | ZXing-js + optional BarcodeDetector | ⚠️ Unreliable | ✅ Full | ~Medium | ⚠️ Slow |
| `@zxing/browser` | ZXing-js | ⚠️ Unreliable | ✅ Full | ~Medium | ❌ Unmaintained |
| Native `BarcodeDetector` | OS-native | ❌ Not supported | ✅ Full | Zero | N/A |

### Key findings

**BarcodeDetector (native Web API)** is the fastest and lightest option — no install, no bundle overhead — but Apple has not shipped it in WebKit/Safari as of 2025. It works great on Android Chrome and desktop Chrome/Edge. **Not viable as a standalone solution** since shop owners may use iPhones.

**@zxing/browser** was explicitly declared unmaintained by its authors. Ruled out.

**html5-qrcode** is the most-used JS scanner (~5.6k GitHub stars) and supports QR, EAN-13, EAN-8, UPC-A, and 18+ other formats. Camera-based scanning on iOS is inconsistent — the camera renders but the JS decoder struggles with non-QR formats. GitHub issues from April 2024 confirm iPhones frequently fail to decode product barcodes even when the camera is live.

### Recommendation: Hybrid approach

Use **BarcodeDetector** as the primary path (zero bundle cost, best performance) with **html5-qrcode** as a JS fallback, plus a **`<input type="file" capture="environment">` photo fallback** for iOS Safari where live camera scanning is unreliable.

```
1. if ('BarcodeDetector' in window)  → use native API  (Android Chrome, desktop)
2. else if camera access available   → use html5-qrcode (Android Firefox, older browsers)
3. else / iOS Safari barcode issues  → show "Take a photo" button using
                                        <input type="file" accept="image/*" capture="environment">
                                        then decode the captured image via html5-qrcode
```

This three-tier approach ensures coverage across:
- ✅ Android Chrome — fast native BarcodeDetector
- ✅ Android Firefox / older browsers — html5-qrcode camera stream
- ✅ iOS Safari — photo-capture fallback (opens native iOS camera, reliable)
- ✅ iOS Chrome/Firefox (iOS 15.1+) — html5-qrcode camera stream

> **If production reliability on iOS is critical:** Consider **Dynamsoft Barcode Reader** (WASM, ~$50/mo) or **Scanbot SDK** — they ship WebAssembly engines specifically tuned for mobile cameras and handle iOS barcodes reliably. Budget permitting, this is the cleanest path. For an MVP, the hybrid html5-qrcode + photo fallback is sufficient.

---

## 2. Product Lookup Strategy

### What was evaluated

| API | Vape/tobacco coverage | Free tier | Paid entry | Best for |
|---|---|---|---|---|
| Open Food Facts | ❌ None — food-only | Unlimited | Free | Not applicable |
| Barcode Lookup | ✅ Best (mainstream brands) | ~50 req/day | ~$49/mo | Primary lookup |
| UPC Item DB | ⚠️ Moderate (popular brands) | 100 req/day | ~$9.99/mo | Fallback / bulk |

### Coverage reality for vape products

No public barcode database was built for vape/tobacco. Realistic hit rates:
- **Major disposables** (Elf Bar, Breeze, Vuse, JUUL): Barcode Lookup ~60–70% hit rate
- **Boutique e-liquid brands**: 20–40% hit rate across all APIs
- **Vape hardware** (SMOK, Voopoo devices): Barcode Lookup ~70%+ (tracked as electronics)
- **Regional/indie brands**: Near-zero match — manual entry required

Open Food Facts is entirely irrelevant for this use case.

### Recommendation: Internal catalog first, then external API

```
Scan UPC
  ↓
1. Look up UPC in our own product_variants table
   → Found: one-tap "Add to menu" (fastest path, zero API cost)
   ↓ not found
2. Call Barcode Lookup API (or UPC Item DB as fallback)
   → Returns product name, brand, image URL
   → Pre-fill the custom-product creation form with returned data
   → Owner reviews, confirms, and saves
   ↓ API returns nothing
3. Show empty custom-product form, pre-populated only with the scanned barcode
   → Owner types name/brand manually
```

This means over time, every product scanned by any shop gets stored with its UPC in our database — **each scan enriches the internal catalog**, reducing future API calls and costs.

**Start with UPC Item DB** (free: 100/day, paid: $9.99/mo) since the free tier is sufficient for an MVP. Upgrade to Barcode Lookup if coverage is inadequate once real-world usage is measured.

---

## 3. Schema Impact

### Where does UPC live — `products` or `product_variants`?

**Answer: `product_variants`.**

Different nicotine levels and bottle sizes of the same product have distinct UPC codes at retail. For example:
- "Elf Bar BC5000 Strawberry Ice 50mg/mL" has a different UPC than the 0mg version
- "Naked 100 Hawaiian POG 60ml" has a different UPC than the 30ml version

Attaching UPC to the variant level is both more accurate and more useful for scanning (a cashier or owner scanning a product is holding a specific variant, not a generic product).

### Proposed schema change

Add one optional column to `product_variants`:

```ts
// shared/schema.ts — product_variants table
upc: varchar("upc", { length: 50 }),   // EAN-13 / UPC-A / UPC-E
```

- **Optional** — global catalog entries added via the existing form won't have a UPC
- **Indexed** for fast lookup: `CREATE INDEX idx_product_variants_upc ON product_variants(upc)`
- No changes needed to the `products` table

No migration complexity: single nullable column, existing rows are unaffected.

---

## 4. UX Flow

### Happy path: product found in internal catalog

```
[Scan button] → camera opens → barcode detected
  → lookup UPC in product_variants
  → found: show product card (name, brand, image, variants)
  → [Add to Menu] button (one tap)
  → success toast, scanner stays open for next scan
```

### Partial match: API returns data but not in our catalog

```
barcode detected → not in our DB → call Barcode Lookup API
  → API returns: name "Vuse Alto Menthol Pod", brand "Vuse", image URL
  → open "New Product" form, pre-filled with API data
  → owner adjusts categories (productType, flavorCategory, nicotineType)
  → owner adds variant details (nicotine level, size, price)
  → save → product created and added to menu, UPC stored on the new variant
```

### No match: unknown product

```
barcode detected → not in our DB → API returns nothing
  → open "New Product" form with UPC pre-filled in a notes/SKU field
  → owner enters all details manually
  → same save flow as above
```

### iOS / camera unavailable fallback

Instead of a live viewfinder, show a "Take a Photo" button (`<input type="file" capture="environment">`). Owner snaps a photo of the barcode, the image is decoded client-side with html5-qrcode, and the same lookup flow runs.

---

## 5. Constraints

### Camera permission on mobile browsers

`navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` triggers the browser's camera permission prompt. Key facts:
- **Android Chrome**: works everywhere, permission prompt is standard
- **iOS Safari 14.3+**: WebRTC works, camera prompt is standard — but UPC/EAN decode accuracy is poor with JS libraries
- **iOS Chrome/Firefox before iOS 15.1**: camera access blocked (Apple restriction); use photo-capture fallback
- **HTTPS required**: getUserMedia is blocked on non-HTTPS origins — the Replit dev environment proxies HTTPS so this is fine; production deployments need TLS (Replit deploys always use TLS)

### iOS PWA limitations

If the admin portal is added to the iOS home screen as a PWA:
- Camera access works the same as Safari
- Live barcode scanning reliability remains poor (same iOS WebKit limitation)
- Photo-capture fallback still works in PWA mode

### Product images from barcode APIs

Barcode Lookup and UPC Item DB return image URLs pointing to their own CDN. **Do not proxy or re-host these during the lookup flow.** Simply store the URL as-is in `imageUrl` on the product. If the shop owner wants to upload their own photo later, they can use the existing image upload flow. There is no need to involve Replit Object Storage at scan time.

### API key management

Both Barcode Lookup and UPC Item DB keys must be stored as server-side environment secrets — never exposed to the client. The scan lookup should call a thin backend endpoint (`GET /api/barcode/:upc`) which proxies the external API and returns normalized product data. This also lets us rate-limit and log lookups.

---

## 6. Proposed Implementation Plan

This spike's output becomes the spec for the follow-up build task.

### Phase 1: Schema + backend (1–2 days)
1. Add `upc` column to `product_variants` + migration
2. Add `GET /api/barcode/:upc` endpoint:
   - Check internal `product_variants` table by UPC → return match if found
   - If not found, call UPC Item DB API (env secret: `UPCITEMDB_KEY`)
   - Return normalized `{ found: boolean, source: "internal"|"api"|null, product?: {...} }`
3. Add `upc` field to the variant create/edit forms so owners can manually enter UPCs

### Phase 2: Scanner UI (2–3 days)
4. Create `BarcodeScanner` component:
   - Tier 1: BarcodeDetector API (Android/desktop)
   - Tier 2: html5-qrcode camera stream
   - Tier 3: `<input capture="environment">` photo fallback
5. Add a "Scan Barcode" button to the My Products page (alongside existing "Import from File")
6. On scan: call `/api/barcode/:upc` → show result sheet:
   - Internal match → product card + "Add to Menu" button
   - API match → pre-filled "New Product" form with UPC locked in
   - No match → empty form with UPC pre-filled

### Phase 3: Catalog enrichment (optional, deferred)
7. When a shop owner creates a product from a barcode scan and sets its variants, automatically store the UPC on the variant → all future scans of that product globally resolve without an API call

### Dependencies
- `html5-qrcode` npm package (install at build time)
- UPC Item DB API key (store as `UPCITEMDB_KEY` environment secret)
- Barcode Lookup key (optional upgrade path: `BARCODELOOKUP_KEY`)

### Risk: iOS barcode reliability
The biggest unknown is whether real-world iOS scanning in the vape shop environment (harsh lighting, shiny packaging, small labels) is good enough with the photo-capture fallback. Recommend testing on-device with real product packaging during Phase 2 before shipping. If hit rate is too low, budget for Dynamsoft SDK (~$50/mo).
