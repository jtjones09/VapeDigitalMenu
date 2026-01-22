ALTER TABLE "product_variants" ADD COLUMN "cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sku";