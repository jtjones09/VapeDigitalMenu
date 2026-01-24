# Duplicate Prevention for Custom Products - Full Specification

## Core Principle
Custom products = Global products. The ONLY differences:
- is_custom flag (true vs false)
- created_by_shop_id (shop ID vs null)
- Visibility (one shop vs all shops)

## Implementation Phases

### Phase 1: Database Foundation
- Add custom_brand_name field to products table
- Add database constraints (custom products must have shop ID)
- Add unique constraint on shop_products (shop_id, product_id)
- Enable pg_trgm extension for fuzzy matching
- Add GIN indexes for fuzzy search performance

### Phase 2: Duplicate Search API
- POST /api/products/search-duplicates - fuzzy match against global products
- GET /api/brands/search?q=term - fuzzy brand search
- Use SIMILARITY function with 0.6 threshold
- Return top 5 matches ordered by similarity

### Phase 3: Form UI Overhaul
- Convert custom product form to split layout (form left, matches right)
- Real-time debounced search (500ms delay, min 3 chars)
- Matches panel showing similar global products
- Each match shows: name, brand, type, similarity %, variant count

### Phase 4: Actions & Integration
- "Use This Product" - adds global product to shop menu via shop_products
- "View Details" modal - shows full product info and variants
- Confirmation dialog before adding
- Success toast and redirect

### Phase 5: Fuzzy Brand Search (Enhancement)
- Replace brand dropdown with searchable combobox
- Fuzzy matching on brand names as user types
- Option to create custom brand if no match

### Phase 6: Archive/Promote (DEFERRED - Platform Admin)
- archived_at and promoted_to_product_id columns
- Platform admin can promote custom to global
- Original archived, not deleted

---

## Database Changes

### products table additions:
```sql
custom_brand_name VARCHAR(255)  -- For brands not in brands table
```

### Constraints:
```sql
-- Custom products must have shop ID, global products must not
CHECK (
  (is_custom = false AND created_by_shop_id IS NULL) OR 
  (is_custom = true AND created_by_shop_id IS NOT NULL)
)
```

### shop_products unique constraint:
```sql
UNIQUE (shop_id, product_id)  -- Prevent adding same product twice
```

### pg_trgm extension and indexes:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_brands_name_trgm ON brands USING gin(brand_name gin_trgm_ops);
CREATE INDEX idx_products_is_custom ON products(is_custom);
CREATE INDEX idx_products_shop_id ON products(created_by_shop_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_shop_products_shop ON shop_products(shop_id);
```

---

## API Endpoints

### POST /api/products/search-duplicates
Request:
```json
{
  "brandId": "uuid (optional)",
  "brandName": "string (optional, for custom brand)",
  "productName": "string (required, min 3 chars)",
  "productType": "string (optional)"
}
```

Response:
```json
{
  "matches": [
    {
      "id": "uuid",
      "productName": "string",
      "productType": "string", 
      "brandName": "string",
      "similarity": 0.95,
      "isCustom": false,
      "variantCount": 5
    }
  ]
}
```

### GET /api/brands/search?q=term
Response:
```json
{
  "brands": [
    {
      "id": "uuid",
      "brandName": "string",
      "similarity": 0.85,
      "logoUrl": "string"
    }
  ]
}
```

---

## UI Components

### ProductMatchesPanel
Props:
- matches: array of match objects
- isSearching: boolean
- onViewProduct: (productId) => void
- onUseProduct: (productId) => void

States:
- Loading: spinner + "Searching for matches..."
- No matches: checkmark + "No matching products found"
- Matches found: list of product cards with actions

### Split Layout Form
- Left column (60%): product form fields
- Right column (40%): matches panel
- Mobile: stacked vertically

### Similarity Badge Colors
- > 0.9: Green accent (very similar)
- 0.7-0.9: Blue accent (similar)
- 0.6-0.7: Gray accent (possibly related)

---

## Pricing Hierarchy (Reference)
1. variant.msrp = default price set by product creator
2. shop_products.custom_price = shop's override (if set)
3. Customer sees: custom_price ?? msrp

---

## Validation Rules
- E-liquid products MUST have at least 1 variant
- Disposable products MUST have at least 1 variant
- Hardware/accessory variants are optional
- Product name minimum 3 characters for duplicate search
