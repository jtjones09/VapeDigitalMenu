import { db } from "./db";
import { brands, products, productVariants } from "@shared/schema";

const demoData = {
  brands: [
    { brandName: "CloudBurst", manufacturer: "CloudBurst Labs", website: "https://cloudburst.com" },
    { brandName: "VaporWave", manufacturer: "VW Industries", website: "https://vaporwave.io" },
    { brandName: "MistMaker", manufacturer: "Mist Co.", website: "https://mistmaker.com" },
    { brandName: "PureVapor", manufacturer: "Pure Labs", website: "https://purevapor.com" },
    { brandName: "FlavorMax", manufacturer: "FlavorMax Inc", website: "https://flavormax.com" },
    { brandName: "CloudNine", manufacturer: "CN Vapes", website: "https://cloudnine.com" },
    { brandName: "ZenVape", manufacturer: "Zen Industries", website: "https://zenvape.com" },
    { brandName: "AeroMist", manufacturer: "Aero Labs", website: "https://aeromist.com" },
  ],
  products: [
    // E-Liquids - Fruit
    { productName: "Tropical Paradise", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "A refreshing blend of mango, pineapple, and coconut" },
    { productName: "Berry Blast", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Mixed berries including strawberry, blueberry, and raspberry" },
    { productName: "Citrus Sunrise", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Orange, grapefruit, and lemon with a hint of sweetness" },
    { productName: "Watermelon Wave", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Fresh watermelon with a cool finish" },
    { productName: "Apple Orchard", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Crisp red and green apple blend" },
    { productName: "Peach Perfection", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Ripe Georgia peaches with subtle sweetness" },
    { productName: "Grape Escape", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Purple grape candy flavor" },
    { productName: "Kiwi Strawberry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Sweet kiwi and strawberry fusion" },
    
    // E-Liquids - Dessert
    { productName: "Vanilla Custard", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Rich vanilla custard with caramel notes" },
    { productName: "Cinnamon Roll", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Warm cinnamon roll with cream cheese frosting" },
    { productName: "Strawberry Cheesecake", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Creamy cheesecake topped with fresh strawberries" },
    { productName: "Blueberry Muffin", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Freshly baked muffin loaded with blueberries" },
    { productName: "Chocolate Fudge", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Rich dark chocolate fudge" },
    { productName: "Caramel Latte", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Espresso coffee with sweet caramel cream" },
    
    // E-Liquids - Menthol
    { productName: "Arctic Freeze", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Intense menthol ice blast" },
    { productName: "Mint Glacier", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Cool spearmint with icy undertones" },
    { productName: "Polar Chill", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Extra strong menthol cooling sensation" },
    { productName: "Peppermint Frost", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Fresh peppermint with frosty finish" },
    { productName: "Menthol Fusion", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Classic menthol with a smooth throat hit" },
    
    // E-Liquids - Tobacco
    { productName: "Classic Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Traditional tobacco flavor" },
    { productName: "Virginia Gold", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Light Virginia tobacco with honey notes" },
    { productName: "Turkish Blend", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Aromatic Turkish tobacco mix" },
    { productName: "Cuban Cigar", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Rich Cuban cigar flavor profile" },
    
    // E-Liquids - Beverage
    { productName: "Lemonade Stand", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Fresh squeezed lemonade" },
    { productName: "Cola Float", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Classic cola with vanilla ice cream" },
    { productName: "Green Tea", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Smooth Japanese green tea" },
    { productName: "Energy Rush", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Energy drink flavor boost" },
    
    // E-Liquids - Candy
    { productName: "Gummy Bears", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Classic gummy bear candy" },
    { productName: "Cotton Candy", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Fluffy pink cotton candy sweetness" },
    { productName: "Sour Belts", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sour candy belt rainbow" },
    { productName: "Bubblegum", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Classic pink bubblegum flavor" },
    { productName: "Lollipop", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sweet cherry lollipop" },
    
    // Disposables
    { productName: "CloudBar 5000", productType: "disposable", flavorCategory: "fruit", flavorDescription: "5000 puff disposable with mixed fruits" },
    { productName: "MistPod Pro", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Rechargeable disposable with menthol" },
    { productName: "VapePen Mini", productType: "disposable", flavorCategory: "tobacco", flavorDescription: "Compact tobacco disposable" },
    { productName: "FlavorStick 3000", productType: "disposable", flavorCategory: "candy", flavorDescription: "3000 puff candy flavor pod" },
    { productName: "ZenPod Ultra", productType: "disposable", flavorCategory: "dessert", flavorDescription: "Premium dessert disposable device" },
    { productName: "AeroBar Max", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Maximum capacity fruit blend" },
    
    // Hardware
    { productName: "CloudMod 200W", productType: "hardware", flavorCategory: "other", flavorDescription: "Advanced 200W box mod with temperature control" },
    { productName: "MiniPod Starter", productType: "hardware", flavorCategory: "other", flavorDescription: "Beginner-friendly pod system" },
    { productName: "TankMaster Pro", productType: "hardware", flavorCategory: "other", flavorDescription: "Sub-ohm tank with top airflow" },
    { productName: "BatteryPack X2", productType: "hardware", flavorCategory: "other", flavorDescription: "Dual 18650 battery charger" },
    { productName: "CoilMaster Kit", productType: "hardware", flavorCategory: "other", flavorDescription: "DIY coil building kit" },
    
    // Accessories
    { productName: "Drip Tips Set", productType: "accessory", flavorCategory: "other", flavorDescription: "Set of 5 colorful drip tips" },
    { productName: "Carry Case", productType: "accessory", flavorCategory: "other", flavorDescription: "Protective vape carrying case" },
    { productName: "Cleaning Kit", productType: "accessory", flavorCategory: "other", flavorDescription: "Complete tank cleaning supplies" },
    { productName: "Lanyard Holder", productType: "accessory", flavorCategory: "other", flavorDescription: "Adjustable vape lanyard" },
  ],
};

export async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    // Check if data already exists
    const existingBrands = await db.select().from(brands).limit(1);
    if (existingBrands.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Insert brands
    const insertedBrands = await db.insert(brands).values(demoData.brands).returning();
    console.log(`Inserted ${insertedBrands.length} brands`);

    // Insert products with random brand assignments
    const nicotineLevels = ["0mg", "3mg", "6mg", "12mg", "18mg"];
    const vgPgRatios = ["50/50", "70/30", "MAX VG"];
    const bottleSizes = ["30ml", "60ml", "100ml"];

    for (const productData of demoData.products) {
      const randomBrand = insertedBrands[Math.floor(Math.random() * insertedBrands.length)];
      
      const [product] = await db.insert(products).values({
        ...productData,
        brandId: randomBrand.id,
      }).returning();

      // Add variants for e-liquids
      if (productData.productType === "e-liquid") {
        for (const nicotine of nicotineLevels.slice(0, 3)) {
          for (const ratio of vgPgRatios.slice(0, 2)) {
            await db.insert(productVariants).values({
              productId: product.id,
              nicotineLevel: nicotine,
              vgPgRatio: ratio,
              bottleSize: bottleSizes[Math.floor(Math.random() * bottleSizes.length)],
              msrp: parseFloat((15 + Math.random() * 20).toFixed(2)),
            });
          }
        }
      } else if (productData.productType === "disposable") {
        // Disposables have fixed nicotine
        await db.insert(productVariants).values({
          productId: product.id,
          nicotineLevel: "50mg",
          msrp: parseFloat((20 + Math.random() * 15).toFixed(2)),
        });
      } else {
        // Hardware/accessories - just price
        await db.insert(productVariants).values({
          productId: product.id,
          msrp: parseFloat((25 + Math.random() * 75).toFixed(2)),
        });
      }
    }

    console.log(`Inserted ${demoData.products.length} products with variants`);
    console.log("Database seed complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
