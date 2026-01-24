# MenuBoard Product Architecture

## Overview

Two-tier product management:
1. **Global Products** - Platform-managed catalog all shops can browse
2. **Custom Products** - Shop-specific products created by owners

## Database Tables

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────────┐
│   brands    │────<│    products     │────<│ product_variants  │
└─────────────┘     └─────────────────┘     └───────────────────┘
                           │
                    ┌──────┴──────┐
              ┌─────▼─────┐  ┌────▼────┐
              │shop_products│  │  shops  │
              │ (junction) │──│         │
              └───────────┘  └─────────┘
```

### brands
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| brand_name | varchar(255) | Brand name (required) |
| manufacturer | varchar(255) | Manufacturer name |
| website | varchar(500) | Brand website URL |
| logo_url | varchar(500) | Brand logo image URL |

### products
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| brand_id | varchar (FK) | Reference to brands (nullable for custom) |
| product_name | varchar(255) | Required |
| product_type | varchar(50) | e-liquid, disposable, hardware, accessory |
| flavor_category | varchar(50) | fruit, dessert, menthol, tobacco, beverage, candy, other |
| flavor_description | text | Detailed flavor profile |
| nicotine_type | varchar(20) | regular, salt, none |
| image_url | varchar(500) | Product image |
| **is_custom** | boolean | false = global, true = shop-created |
| **created_by_shop_id** | varchar | Shop ID (custom products only) |

### product_variants
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| product_id | varchar (FK) | Links to products |
| nicotine_level | varchar(20) | 0mg, 3mg, 6mg, 12mg, 18mg, 24mg, 50mg |
| vg_pg_ratio | varchar(20) | 50/50, 60/40, 70/30, 80/20, MAX VG |
| bottle_size | varchar(20) | 10ml, 30ml, 60ml, 100ml, 120ml |
| sku | varchar(100) | Stock keeping unit |
| msrp | decimal(10,2) | Retail price |
| cost | decimal(10,2) | Shop's cost |

### shop_products (Junction)
| Column | Type | Description |
|--------|------|-------------|
| shop_id | varchar (FK) | Reference to shops |
| product_id | varchar (FK) | Reference to products |
| display_order | integer | Menu order |
| is_active | boolean | Show on menu? |
| custom_price | decimal(10,2) | Shop's override price |

## Enum Values

```typescript
productTypes = ["e-liquid", "disposable", "hardware", "accessory"]
flavorCategories = ["fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"]
nicotineTypes = ["regular", "salt", "none"]
nicotineLevels = ["0mg", "3mg", "6mg", "12mg", "18mg", "24mg", "50mg"]
vgPgRatios = ["50/50", "60/40", "70/30", "80/20", "MAX VG"]
bottleSizes = ["10ml", "30ml", "60ml", "100ml", "120ml"]
```

## Current Behavior

### Global Products Flow
1. Platform seeds products into `products` table with `is_custom = false`
2. Shop owners browse the global catalog at `/admin/products`
3. When added to menu, a `shop_products` record is created
4. Variants with pricing already exist in `product_variants`

### Custom Products Flow
1. Shop owner creates product at `/admin/custom-products`
2. Product saved with `is_custom = true` and `created_by_shop_id = shop.id`
3. Product automatically added to `shop_products` for that shop
4. **Gap:** Variants are NOT created (no UI for this yet)

## Current Gaps

1. **Custom products have no variant management** - Can't add sizes/nicotine/pricing
2. **No brand field for custom products** - No way to specify brand name
3. **Nicotine type missing from form** - Not collected for custom products
4. **Pricing confusion** - Variants have MSRP/cost, but shop_products also has custom_price

## Questions for Discussion

1. Should custom products use the same `product_variants` table or a separate one?
2. Should there be a `custom_brands` table or just a text field?
3. How should pricing work for custom products - per variant or single price?
4. Can shops add custom variants to global products they've added?
