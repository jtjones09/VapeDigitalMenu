import { db } from "./db";
import { brands, products, productVariants, shops, shopProducts } from "@shared/schema";

const demoData = {
  brands: [
    // E-Liquid Brands
    { brandName: "Naked 100", manufacturer: "The Schwartz", website: "https://naked100.com" },
    { brandName: "Vapetasia", manufacturer: "Vapetasia LLC", website: "https://vapetasia.com" },
    { brandName: "Jam Monster", manufacturer: "Fresh Juice Co", website: "https://jammonster.com" },
    { brandName: "Air Factory", manufacturer: "Air Factory LLC", website: "https://airfactoryeliquid.com" },
    { brandName: "Dinner Lady", manufacturer: "Dinner Lady Ltd", website: "https://dinnerlady.com" },
    { brandName: "Coastal Clouds", manufacturer: "Coastal Clouds", website: "https://coastalclouds.com" },
    { brandName: "Pachamama", manufacturer: "Charlie's Chalk Dust", website: "https://pacha-mama.com" },
    { brandName: "Twist E-Liquids", manufacturer: "Lemon Twist", website: "https://twisteliquids.com" },
    { brandName: "Bad Drip Labs", manufacturer: "Bad Drip Labs", website: "https://baddriplabs.com" },
    { brandName: "Candy King", manufacturer: "Candy King", website: "https://candyking.la" },
    // Disposable Brands
    { brandName: "Elf Bar", manufacturer: "iMiracle Technology", website: "https://elfbar.com" },
    { brandName: "Lost Mary", manufacturer: "iMiracle Technology", website: "https://lostmary.com" },
    { brandName: "Puff Bar", manufacturer: "Puff Labs", website: "https://puffbar.com" },
    { brandName: "Geek Bar", manufacturer: "Geekvape", website: "https://geekbar.com" },
    { brandName: "Hyde", manufacturer: "Hyde Vape", website: "https://hydevape.com" },
    { brandName: "Breeze", manufacturer: "Breeze Smoke", website: "https://breezesmoke.com" },
    { brandName: "FLUM", manufacturer: "Flum Vape", website: "https://flumvape.com" },
    { brandName: "Funky Republic", manufacturer: "EB Design", website: "https://funkyrepublic.com" },
    // Hardware Brands
    { brandName: "SMOK", manufacturer: "Shenzhen IVPS Technology", website: "https://smoktech.com" },
    { brandName: "Vaporesso", manufacturer: "Shenzhen Smoore Technology", website: "https://vaporesso.com" },
    { brandName: "GeekVape", manufacturer: "Shenzhen Geekvape Technology", website: "https://geekvape.com" },
    { brandName: "Voopoo", manufacturer: "Shenzhen Woody Vapes", website: "https://voopoo.com" },
    { brandName: "Uwell", manufacturer: "Uwell Technology", website: "https://myuwell.com" },
    { brandName: "Aspire", manufacturer: "Aspire Vape", website: "https://aspirevape.co" },
    { brandName: "Innokin", manufacturer: "Innokin Technology", website: "https://innokin.com" },
  ],
  products: [
    // ==================== E-LIQUIDS - FRUIT (25 products) ====================
    { productName: "Hawaiian POG", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Passion fruit, orange, and guava tropical blend", brandIndex: 0 },
    { productName: "Lava Flow", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Strawberry, coconut, and pineapple paradise", brandIndex: 0 },
    { productName: "Amazing Mango", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Fresh mango with low mint and cream", brandIndex: 0 },
    { productName: "Brain Freeze", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Strawberry, pomegranate, and kiwi menthol", brandIndex: 0 },
    { productName: "Really Berry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Blueberry, blackberry, and lemon sugar drizzle", brandIndex: 0 },
    { productName: "Fuji Apple", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Crisp fuji apple strawberry nectarine", brandIndex: 0 },
    { productName: "Killer Kustard Strawberry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Creamy custard with fresh strawberries", brandIndex: 1 },
    { productName: "Pineapple Express", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Sweet pineapple with creamy coconut", brandIndex: 1 },
    { productName: "Strawberry Killer Kustard", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Rich vanilla custard topped with strawberries", brandIndex: 1 },
    { productName: "Mystery Flavor", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Blue raspberry candy mystery blend", brandIndex: 3 },
    { productName: "Blue Razz", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Tangy blue raspberry candy explosion", brandIndex: 3 },
    { productName: "Wild Apple", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Crisp wild apples with candy sweetness", brandIndex: 3 },
    { productName: "Lemon Tart", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Zesty lemon curd on buttery pastry", brandIndex: 4 },
    { productName: "Strawberry Macaroon", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Sweet strawberry on French macaroon", brandIndex: 4 },
    { productName: "Blood Orange", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Rich Sicilian blood orange citrus", brandIndex: 5 },
    { productName: "Mango Berries", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Tropical mango mixed with ripe berries", brandIndex: 5 },
    { productName: "Apple Peach Strawberry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Apple, peach, and strawberry fusion", brandIndex: 5 },
    { productName: "Fuji Apple Strawberry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Crisp fuji apple with sweet strawberry", brandIndex: 6 },
    { productName: "Passion Fruit Raspberry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Exotic passion fruit and tart raspberry", brandIndex: 6 },
    { productName: "Mango Pitaya Pineapple", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Dragon fruit, mango, and pineapple", brandIndex: 6 },
    { productName: "Pink Punch Lemonade", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Sweet pink lemonade with berry punch", brandIndex: 7 },
    { productName: "Honeydew Melon Chew", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Fresh honeydew melon candy", brandIndex: 7 },
    { productName: "Watermelon Madness", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Juicy watermelon candy chew", brandIndex: 7 },
    { productName: "God Nectar", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Orange, mango, and honey blend", brandIndex: 8 },
    { productName: "Don't Care Bear", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Gummy bear peach rings candy", brandIndex: 8 },

    // ==================== E-LIQUIDS - DESSERT (20 products) ====================
    { productName: "Killer Kustard", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Rich vanilla custard with hints of butter", brandIndex: 1 },
    { productName: "Milk of the Poppy", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Dragon fruit, berries with vanilla cream", brandIndex: 1 },
    { productName: "Killer Kustard Blueberry", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Creamy vanilla custard with blueberry", brandIndex: 1 },
    { productName: "Royalty II", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Peanut butter, chocolate, banana cream", brandIndex: 1 },
    { productName: "Blueberry Jam Toast", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Buttery toast with blueberry jam and butter", brandIndex: 2 },
    { productName: "Strawberry Jam Toast", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Warm toast topped with strawberry jam", brandIndex: 2 },
    { productName: "Grape Jam Toast", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fresh grape jam on buttered toast", brandIndex: 2 },
    { productName: "Blackberry Jam Toast", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Sweet blackberry jam on warm toast", brandIndex: 2 },
    { productName: "Apple Butter Toast", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Apple butter spread on cinnamon toast", brandIndex: 2 },
    { productName: "Apple Pie", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Grandma's apple pie with ice cream", brandIndex: 4 },
    { productName: "Blackberry Crumble", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fresh blackberry crumble with vanilla ice cream", brandIndex: 4 },
    { productName: "Vanilla Custard", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Classic rich vanilla bean custard", brandIndex: 5 },
    { productName: "Maple Butter", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Buttery pancakes with maple syrup", brandIndex: 5 },
    { productName: "The Cream", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Strawberries and fresh whipped cream", brandIndex: 5 },
    { productName: "Banana Milk", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fresh banana with creamy milk", brandIndex: 6 },
    { productName: "Strawberry Tres Leches", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Strawberry on tres leches cake", brandIndex: 6 },
    { productName: "Farley's Gnarly Sauce", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Strawberry with kiwi bubble gum", brandIndex: 8 },
    { productName: "Ugly Butter", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Cinnamon banana French toast", brandIndex: 8 },
    { productName: "Cereal Trip", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fruity cereal with cold milk", brandIndex: 8 },
    { productName: "Belts", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Strawberry sour belt candy", brandIndex: 9 },

    // ==================== E-LIQUIDS - MENTHOL (15 products) ====================
    { productName: "Polar Breeze", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Intense menthol ice blast", brandIndex: 0 },
    { productName: "Frost Bite", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Sub-zero menthol freeze", brandIndex: 0 },
    { productName: "Menthol Tobacco", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Classic tobacco with cool menthol", brandIndex: 0 },
    { productName: "Arctic Cool", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Pure arctic menthol sensation", brandIndex: 3 },
    { productName: "Strawberry Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Sweet strawberry with icy menthol", brandIndex: 3 },
    { productName: "Watermelon Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Juicy watermelon with cool menthol", brandIndex: 3 },
    { productName: "Mint Tobacco", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Smooth tobacco with fresh mint", brandIndex: 4 },
    { productName: "Spearmint", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Refreshing spearmint leaf flavor", brandIndex: 4 },
    { productName: "Blue Razz Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Blue raspberry with icy finish", brandIndex: 5 },
    { productName: "Mango Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Tropical mango with ice menthol", brandIndex: 5 },
    { productName: "Grape Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Sweet grape with frosty menthol", brandIndex: 6 },
    { productName: "Peach Ice", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Fresh peach with cooling sensation", brandIndex: 6 },
    { productName: "Iced Lychee", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Exotic lychee with ice", brandIndex: 7 },
    { productName: "Menthol Freeze", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Maximum freeze menthol blend", brandIndex: 7 },
    { productName: "Cool Mint", productType: "e-liquid", flavorCategory: "menthol", flavorDescription: "Fresh peppermint with cooling effect", brandIndex: 8 },

    // ==================== E-LIQUIDS - TOBACCO (10 products) ====================
    { productName: "American Patriots", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Bold American tobacco blend", brandIndex: 0 },
    { productName: "Cuban Blend", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Rich Cuban cigar tobacco", brandIndex: 0 },
    { productName: "Euro Gold", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Smooth European tobacco", brandIndex: 0 },
    { productName: "RY4 Double", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Classic RY4 caramel vanilla tobacco", brandIndex: 1 },
    { productName: "Virginia Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Light Virginia tobacco leaves", brandIndex: 4 },
    { productName: "Smooth Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Mellow smooth tobacco flavor", brandIndex: 4 },
    { productName: "Turkish Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Aromatic Turkish tobacco", brandIndex: 5 },
    { productName: "Caramel Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Sweet caramel tobacco blend", brandIndex: 5 },
    { productName: "Bold Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Strong full-bodied tobacco", brandIndex: 6 },
    { productName: "Desert Tobacco", productType: "e-liquid", flavorCategory: "tobacco", flavorDescription: "Sweet desert tobacco with nuts", brandIndex: 6 },

    // ==================== E-LIQUIDS - BEVERAGE (10 products) ====================
    { productName: "Pink Lemonade", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Sweet pink lemonade refresher", brandIndex: 7 },
    { productName: "Strawberry Lemonade", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Fresh strawberry lemonade", brandIndex: 7 },
    { productName: "Iced Coffee", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Cold brew coffee with cream", brandIndex: 1 },
    { productName: "Mocha Latte", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Espresso with chocolate and milk", brandIndex: 1 },
    { productName: "Cola Ice", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Classic cola on ice", brandIndex: 3 },
    { productName: "Energy Blast", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Energy drink flavor burst", brandIndex: 3 },
    { productName: "Green Tea", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Smooth Japanese green tea", brandIndex: 5 },
    { productName: "Peach Tea", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Sweet peach iced tea", brandIndex: 5 },
    { productName: "Mango Smoothie", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Tropical mango fruit smoothie", brandIndex: 6 },
    { productName: "Strawberry Milkshake", productType: "e-liquid", flavorCategory: "beverage", flavorDescription: "Creamy strawberry milkshake", brandIndex: 6 },

    // ==================== E-LIQUIDS - CANDY (15 products) ====================
    { productName: "Sour Worms", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Tangy sour gummy worms", brandIndex: 9 },
    { productName: "Strawberry Watermelon Bubblegum", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Fruity bubblegum candy", brandIndex: 9 },
    { productName: "Pink Squares", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Pink starburst candy flavor", brandIndex: 9 },
    { productName: "Batch", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sour gummy candy batch", brandIndex: 9 },
    { productName: "Worms", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sweet gummy worm candy", brandIndex: 9 },
    { productName: "Swedish", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Swedish fish candy", brandIndex: 9 },
    { productName: "Peachy Rings", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Peach ring gummy candy", brandIndex: 9 },
    { productName: "Tropic Mango", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Tropical mango hard candy", brandIndex: 3 },
    { productName: "Strawberry Cotton Candy", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Fluffy strawberry cotton candy", brandIndex: 3 },
    { productName: "Rainbow Drops", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Mixed fruit rainbow candy", brandIndex: 5 },
    { productName: "Cherry Bomb", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sour cherry hard candy", brandIndex: 5 },
    { productName: "Grape Lollipop", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Sweet grape lollipop flavor", brandIndex: 7 },
    { productName: "Watermelon Bubblegum", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Watermelon bubble gum candy", brandIndex: 7 },
    { productName: "Laffy Taffy", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Stretchy taffy candy mix", brandIndex: 8 },
    { productName: "Jawbreaker", productType: "e-liquid", flavorCategory: "candy", flavorDescription: "Multi-layer jawbreaker candy", brandIndex: 8 },

    // ==================== E-LIQUIDS - ADDITIONAL FRUIT (10 products) ====================
    { productName: "Dragon Fruit", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Exotic dragon fruit with hints of pear", brandIndex: 0 },
    { productName: "Papaya Punch", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Tropical papaya with citrus notes", brandIndex: 0 },
    { productName: "Guava Nectar", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Sweet guava with tropical undertones", brandIndex: 1 },
    { productName: "Starfruit Splash", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Tangy starfruit with citrus twist", brandIndex: 1 },
    { productName: "Honeydew Heaven", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Fresh honeydew melon perfection", brandIndex: 3 },
    { productName: "Cantaloupe Dream", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Ripe cantaloupe melon sweetness", brandIndex: 3 },
    { productName: "Pear Perfection", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Juicy Asian pear flavor", brandIndex: 4 },
    { productName: "Pomegranate Burst", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Tangy pomegranate explosion", brandIndex: 5 },
    { productName: "Acai Berry", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Exotic acai berry superfruit", brandIndex: 6 },
    { productName: "Lychee Rose", productType: "e-liquid", flavorCategory: "fruit", flavorDescription: "Delicate lychee with rose notes", brandIndex: 7 },

    // ==================== E-LIQUIDS - ADDITIONAL DESSERT (10 products) ====================
    { productName: "Tiramisu", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Italian coffee-soaked ladyfinger dessert", brandIndex: 1 },
    { productName: "Pumpkin Spice", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fall pumpkin with warm spices", brandIndex: 2 },
    { productName: "Churro", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Cinnamon sugar fried dough", brandIndex: 2 },
    { productName: "Cookies and Cream", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Chocolate cookies in vanilla cream", brandIndex: 4 },
    { productName: "Lemon Meringue", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Tangy lemon with fluffy meringue", brandIndex: 4 },
    { productName: "Bread Pudding", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Warm bread pudding with raisins", brandIndex: 5 },
    { productName: "Key Lime Pie", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Florida key lime with graham crust", brandIndex: 6 },
    { productName: "Banana Foster", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Caramelized banana with rum notes", brandIndex: 7 },
    { productName: "Chocolate Chip Cookie", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Fresh-baked chocolate chip cookie", brandIndex: 8 },
    { productName: "Boston Cream", productType: "e-liquid", flavorCategory: "dessert", flavorDescription: "Vanilla custard with chocolate glaze", brandIndex: 9 },

    // ==================== DISPOSABLES (50 products) ====================
    // Elf Bar (10)
    { productName: "Elf Bar BC5000 Strawberry Mango", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Sweet strawberry and tropical mango blend, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Blue Razz Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Blue raspberry with icy menthol, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Watermelon Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Fresh watermelon with cool ice, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Rainbow Candy", productType: "disposable", flavorCategory: "candy", flavorDescription: "Mixed fruit rainbow candy, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Peach Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Juicy peach with icy finish, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Mango Peach", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Tropical mango and sweet peach, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Grape Energy", productType: "disposable", flavorCategory: "beverage", flavorDescription: "Grape energy drink flavor, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Strawberry Banana", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry and banana smoothie, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Triple Berry Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Mixed berries with cooling ice, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Cranberry Grape", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Tart cranberry and sweet grape, 5000 puffs", brandIndex: 10 },
    // Lost Mary (8)
    { productName: "Lost Mary OS5000 Blue Cotton Candy", productType: "disposable", flavorCategory: "candy", flavorDescription: "Sweet blue cotton candy, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Strawberry Sundae", productType: "disposable", flavorCategory: "dessert", flavorDescription: "Strawberry ice cream sundae, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Citrus Sunrise", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Orange and citrus morning blend, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Juicy Peach", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Ripe Georgia peach flavor, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Grape Jelly", productType: "disposable", flavorCategory: "candy", flavorDescription: "Sweet grape jelly candy, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Pineapple Mango", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Tropical pineapple mango, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Mad Blue", productType: "disposable", flavorCategory: "candy", flavorDescription: "Blue raspberry mad mix, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Yummy", productType: "disposable", flavorCategory: "candy", flavorDescription: "Mystery yummy candy blend, 5000 puffs", brandIndex: 11 },
    // Puff Bar (6)
    { productName: "Puff Bar Plus Mango", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Sweet tropical mango, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Lush Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Watermelon with menthol ice, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Cool Mint", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Refreshing cool mint, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus OMG", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Orange mango guava blend, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Pink Lemonade", productType: "disposable", flavorCategory: "beverage", flavorDescription: "Sweet pink lemonade, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Strawberry Banana", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry banana smoothie, 800 puffs", brandIndex: 12 },
    // Geek Bar (8)
    { productName: "Geek Bar Pulse Watermelon Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Fresh watermelon with ice, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Blue Razz Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Blue raspberry ice blast, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Strawberry Mango", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry mango fusion, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Tropical Rainbow", productType: "disposable", flavorCategory: "candy", flavorDescription: "Tropical rainbow candy, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Miami Mint", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Cool Miami mint breeze, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Grape Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Sweet grape with icy finish, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Peach Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Juicy peach with menthol, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Sour Apple Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Sour green apple with ice, 15000 puffs", brandIndex: 13 },
    // Hyde (6)
    { productName: "Hyde IQ Blue Razz Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Blue raspberry with ice, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Strawberry Banana", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry banana mix, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Peach Mango", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Peach and mango blend, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Rainbow", productType: "disposable", flavorCategory: "candy", flavorDescription: "Rainbow skittles candy, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Mango Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Tropical mango with ice, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Spearmint", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Fresh spearmint leaves, 5000 puffs", brandIndex: 14 },
    // Breeze (4)
    { productName: "Breeze Pro Watermelon Mint", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Watermelon with mint, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Strawberry Cream", productType: "disposable", flavorCategory: "dessert", flavorDescription: "Strawberry with cream, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Blueberry Lemon", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Blueberry and lemon blend, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Tobacco", productType: "disposable", flavorCategory: "tobacco", flavorDescription: "Classic tobacco flavor, 2000 puffs", brandIndex: 15 },
    // FLUM (4)
    { productName: "FLUM Pebble Clear", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Crystal clear menthol, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Strawberry Banana", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry banana blend, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Lush Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Watermelon lush ice, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Berry Fusion", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Mixed berry fusion, 6000 puffs", brandIndex: 16 },
    // Funky Republic (4)
    { productName: "Funky Republic Ti7000 Blue Razz Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Blue raspberry with ice, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Tropical Rainbow", productType: "disposable", flavorCategory: "candy", flavorDescription: "Tropical rainbow candy, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Watermelon Ice", productType: "disposable", flavorCategory: "menthol", flavorDescription: "Fresh watermelon ice, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Strawberry Kiwi", productType: "disposable", flavorCategory: "fruit", flavorDescription: "Strawberry and kiwi blend, 7000 puffs", brandIndex: 17 },

    // ==================== HARDWARE (30 products) ====================
    // SMOK (8)
    { productName: "SMOK Nord 5", productType: "hardware", flavorCategory: "other", flavorDescription: "Compact pod system with 2000mAh battery and adjustable wattage", brandIndex: 18 },
    { productName: "SMOK RPM 5 Pro", productType: "hardware", flavorCategory: "other", flavorDescription: "Advanced pod mod with 80W output and smart mode", brandIndex: 18 },
    { productName: "SMOK Novo 5", productType: "hardware", flavorCategory: "other", flavorDescription: "Sleek pod device with side fill design", brandIndex: 18 },
    { productName: "SMOK Morph 3", productType: "hardware", flavorCategory: "other", flavorDescription: "230W box mod with TFT color screen", brandIndex: 18 },
    { productName: "SMOK Mag P3 Kit", productType: "hardware", flavorCategory: "other", flavorDescription: "Ergonomic 230W mod with trigger-style firing", brandIndex: 18 },
    { productName: "SMOK TFV18 Tank", productType: "hardware", flavorCategory: "other", flavorDescription: "Sub-ohm tank with massive cloud production", brandIndex: 18 },
    { productName: "SMOK RPM Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement coils for RPM series devices", brandIndex: 18 },
    { productName: "SMOK Nord Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement coils for Nord series", brandIndex: 18 },
    // Vaporesso (6)
    { productName: "Vaporesso XROS 3", productType: "hardware", flavorCategory: "other", flavorDescription: "Slim pod system with adjustable airflow", brandIndex: 19 },
    { productName: "Vaporesso Luxe X Pro", productType: "hardware", flavorCategory: "other", flavorDescription: "Premium pod device with 1500mAh battery", brandIndex: 19 },
    { productName: "Vaporesso Target 200", productType: "hardware", flavorCategory: "other", flavorDescription: "Dual battery 220W mod with iTank X", brandIndex: 19 },
    { productName: "Vaporesso Gen S", productType: "hardware", flavorCategory: "other", flavorDescription: "220W mod with AXON chipset and pulse mode", brandIndex: 19 },
    { productName: "Vaporesso GTX Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Universal GTX replacement coils", brandIndex: 19 },
    { productName: "Vaporesso iTank", productType: "hardware", flavorCategory: "other", flavorDescription: "Leak-proof sub-ohm tank with flip top fill", brandIndex: 19 },
    // GeekVape (5)
    { productName: "GeekVape Aegis Legend 2", productType: "hardware", flavorCategory: "other", flavorDescription: "200W waterproof shockproof mod", brandIndex: 20 },
    { productName: "GeekVape Aegis X", productType: "hardware", flavorCategory: "other", flavorDescription: "200W mod with 2.4\" color screen", brandIndex: 20 },
    { productName: "GeekVape Wenax K1", productType: "hardware", flavorCategory: "other", flavorDescription: "Compact MTL pod system", brandIndex: 20 },
    { productName: "GeekVape Zeus Tank", productType: "hardware", flavorCategory: "other", flavorDescription: "Top airflow sub-ohm tank", brandIndex: 20 },
    { productName: "GeekVape Z Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Zeus series replacement coils", brandIndex: 20 },
    // Voopoo (4)
    { productName: "Voopoo Drag 4", productType: "hardware", flavorCategory: "other", flavorDescription: "177W mod with GENE.TT 2.0 chip", brandIndex: 21 },
    { productName: "Voopoo Argus Pro 2", productType: "hardware", flavorCategory: "other", flavorDescription: "80W pod mod with PnP platform", brandIndex: 21 },
    { productName: "Voopoo Vinci 3", productType: "hardware", flavorCategory: "other", flavorDescription: "50W pod mod with cartridge system", brandIndex: 21 },
    { productName: "Voopoo PnP Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Universal PnP replacement coils", brandIndex: 21 },
    // Uwell (4)
    { productName: "Uwell Caliburn A3", productType: "hardware", flavorCategory: "other", flavorDescription: "Slim pod device with 520mAh battery", brandIndex: 22 },
    { productName: "Uwell Caliburn G2", productType: "hardware", flavorCategory: "other", flavorDescription: "Updated Caliburn G with improved pods", brandIndex: 22 },
    { productName: "Uwell Crown 5 Tank", productType: "hardware", flavorCategory: "other", flavorDescription: "Sub-ohm tank with self-cleaning tech", brandIndex: 22 },
    { productName: "Uwell Caliburn Pods 4-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement pods for Caliburn series", brandIndex: 22 },
    // Aspire (2)
    { productName: "Aspire Nautilus Prime X", productType: "hardware", flavorCategory: "other", flavorDescription: "60W pod mod with BP coil platform", brandIndex: 23 },
    { productName: "Aspire Flexus Q", productType: "hardware", flavorCategory: "other", flavorDescription: "700mAh pod device with Flexus coils", brandIndex: 23 },
    // Innokin (1)
    { productName: "Innokin Endura T20-S", productType: "hardware", flavorCategory: "other", flavorDescription: "Starter kit for beginners", brandIndex: 24 },

    // ==================== ACCESSORIES (5 products) ====================
    { productName: "Battery Charger 2-Bay", productType: "accessory", flavorCategory: "other", flavorDescription: "Dual 18650/21700 battery charger", brandIndex: 18 },
    { productName: "Premium Drip Tips Set", productType: "accessory", flavorCategory: "other", flavorDescription: "Set of 5 colorful 510 drip tips", brandIndex: 19 },
    { productName: "Vape Carrying Case", productType: "accessory", flavorCategory: "other", flavorDescription: "Padded protective carrying case", brandIndex: 20 },
    { productName: "Coil Building Kit", productType: "accessory", flavorCategory: "other", flavorDescription: "Complete DIY coil building tool set", brandIndex: 20 },
    { productName: "Cotton Bacon Prime", productType: "accessory", flavorCategory: "other", flavorDescription: "Premium organic cotton for wicking", brandIndex: 23 },
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

    // Insert products with appropriate brand assignments
    const nicotineLevels = ["0mg", "3mg", "6mg", "12mg", "18mg"];
    const saltNicotineLevels = ["20mg", "35mg", "50mg"];
    const vgPgRatios = ["50/50", "70/30", "MAX VG"];
    const bottleSizes = ["30ml", "60ml", "100ml"];

    let productCount = 0;
    let variantCount = 0;

    for (const productData of demoData.products) {
      const brand = insertedBrands[productData.brandIndex];
      
      const [product] = await db.insert(products).values({
        productName: productData.productName,
        productType: productData.productType,
        flavorCategory: productData.flavorCategory,
        flavorDescription: productData.flavorDescription,
        brandId: brand.id,
      }).returning();

      productCount++;

      // Add variants based on product type
      if (productData.productType === "e-liquid") {
        // E-liquids get multiple nicotine/VG-PG/size variants
        for (const nicotine of nicotineLevels) {
          for (const ratio of vgPgRatios) {
            for (const size of bottleSizes) {
              await db.insert(productVariants).values({
                productId: product.id,
                nicotineLevel: nicotine,
                vgPgRatio: ratio,
                bottleSize: size,
                msrp: (12 + Math.random() * 18).toFixed(2),
              });
              variantCount++;
            }
          }
        }
      } else if (productData.productType === "disposable") {
        // Disposables have salt nic variants
        for (const nicotine of saltNicotineLevels) {
          await db.insert(productVariants).values({
            productId: product.id,
            nicotineLevel: nicotine,
            msrp: (18 + Math.random() * 12).toFixed(2),
          });
          variantCount++;
        }
      } else {
        // Hardware/accessories - single variant with just price
        await db.insert(productVariants).values({
          productId: product.id,
          msrp: (15 + Math.random() * 85).toFixed(2),
        });
        variantCount++;
      }
    }

    console.log(`Inserted ${productCount} products with ${variantCount} variants`);

    // Create demo shop and add all products to it
    const [demoShop] = await db.insert(shops).values({
      id: "demo",
      userId: "demo-user",
      shopName: "Demo Vape Shop",
      ownerName: "Demo Owner",
      city: "Los Angeles",
      state: "CA",
      isOnboarded: true,
      kioskTimeoutMinutes: 5,
    }).returning();

    console.log(`Created demo shop: ${demoShop.shopName}`);

    // Add all products to demo shop
    const allProducts = await db.select().from(products);
    for (let i = 0; i < allProducts.length; i++) {
      await db.insert(shopProducts).values({
        shopId: demoShop.id,
        productId: allProducts[i].id,
        displayOrder: i,
        isActive: true,
      });
    }

    console.log(`Added ${allProducts.length} products to demo shop`);
    console.log("Database seed complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
