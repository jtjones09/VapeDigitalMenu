-- Enable trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index on product_name for fast fuzzy searches
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(product_name gin_trgm_ops);

-- Add GIN index on brand names
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm 
ON brands USING gin(brand_name gin_trgm_ops);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_is_custom ON products(is_custom);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(created_by_shop_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_nicotine_type ON products(nicotine_type);
CREATE INDEX IF NOT EXISTS idx_products_flavor ON products(flavor_category);

-- Product variants - speed up joins
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- Shop products - speed up menu queries
CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_product ON shop_products(product_id);
