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
  eLiquids: [
    // ==================== E-LIQUIDS - FRUIT ====================
    { productName: "Hawaiian POG", flavorCategory: "fruit", flavorDescription: "Passion fruit, orange, and guava tropical blend", brandIndex: 0 },
    { productName: "Lava Flow", flavorCategory: "fruit", flavorDescription: "Strawberry, coconut, and pineapple paradise", brandIndex: 0 },
    { productName: "Amazing Mango", flavorCategory: "fruit", flavorDescription: "Fresh mango with low mint and cream", brandIndex: 0 },
    { productName: "Brain Freeze", flavorCategory: "fruit", flavorDescription: "Strawberry, pomegranate, and kiwi menthol", brandIndex: 0 },
    { productName: "Really Berry", flavorCategory: "fruit", flavorDescription: "Blueberry, blackberry, and lemon sugar drizzle", brandIndex: 0 },
    { productName: "Fuji Apple", flavorCategory: "fruit", flavorDescription: "Crisp fuji apple strawberry nectarine", brandIndex: 0 },
    { productName: "Killer Kustard Strawberry", flavorCategory: "fruit", flavorDescription: "Creamy custard with fresh strawberries", brandIndex: 1 },
    { productName: "Pineapple Express", flavorCategory: "fruit", flavorDescription: "Sweet pineapple with creamy coconut", brandIndex: 1 },
    { productName: "Strawberry Killer Kustard", flavorCategory: "fruit", flavorDescription: "Rich vanilla custard topped with strawberries", brandIndex: 1 },
    { productName: "Mystery Flavor", flavorCategory: "fruit", flavorDescription: "Blue raspberry candy mystery blend", brandIndex: 3 },
    { productName: "Blue Razz", flavorCategory: "fruit", flavorDescription: "Tangy blue raspberry candy explosion", brandIndex: 3 },
    { productName: "Wild Apple", flavorCategory: "fruit", flavorDescription: "Crisp wild apples with candy sweetness", brandIndex: 3 },
    { productName: "Lemon Tart", flavorCategory: "fruit", flavorDescription: "Zesty lemon curd on buttery pastry", brandIndex: 4 },
    { productName: "Strawberry Macaroon", flavorCategory: "fruit", flavorDescription: "Sweet strawberry on French macaroon", brandIndex: 4 },
    { productName: "Blood Orange", flavorCategory: "fruit", flavorDescription: "Rich Sicilian blood orange citrus", brandIndex: 5 },
    { productName: "Mango Berries", flavorCategory: "fruit", flavorDescription: "Tropical mango mixed with ripe berries", brandIndex: 5 },
    { productName: "Apple Peach Strawberry", flavorCategory: "fruit", flavorDescription: "Apple, peach, and strawberry fusion", brandIndex: 5 },
    { productName: "Fuji Apple Strawberry", flavorCategory: "fruit", flavorDescription: "Crisp fuji apple with sweet strawberry", brandIndex: 6 },
    { productName: "Passion Fruit Raspberry", flavorCategory: "fruit", flavorDescription: "Exotic passion fruit and tart raspberry", brandIndex: 6 },
    { productName: "Mango Pitaya Pineapple", flavorCategory: "fruit", flavorDescription: "Dragon fruit, mango, and pineapple", brandIndex: 6 },
    { productName: "Pink Punch Lemonade", flavorCategory: "fruit", flavorDescription: "Sweet pink lemonade with berry punch", brandIndex: 7 },
    { productName: "Honeydew Melon Chew", flavorCategory: "fruit", flavorDescription: "Fresh honeydew melon candy", brandIndex: 7 },
    { productName: "Watermelon Madness", flavorCategory: "fruit", flavorDescription: "Juicy watermelon candy chew", brandIndex: 7 },
    { productName: "God Nectar", flavorCategory: "fruit", flavorDescription: "Orange, mango, and honey blend", brandIndex: 8 },
    { productName: "Don't Care Bear", flavorCategory: "fruit", flavorDescription: "Gummy bear peach rings candy", brandIndex: 8 },
    { productName: "Dragon Fruit", flavorCategory: "fruit", flavorDescription: "Exotic dragon fruit with hints of pear", brandIndex: 0 },
    { productName: "Papaya Punch", flavorCategory: "fruit", flavorDescription: "Tropical papaya with citrus notes", brandIndex: 0 },
    { productName: "Guava Nectar", flavorCategory: "fruit", flavorDescription: "Sweet guava with tropical undertones", brandIndex: 1 },
    { productName: "Starfruit Splash", flavorCategory: "fruit", flavorDescription: "Tangy starfruit with citrus twist", brandIndex: 1 },
    { productName: "Honeydew Heaven", flavorCategory: "fruit", flavorDescription: "Fresh honeydew melon perfection", brandIndex: 3 },
    { productName: "Cantaloupe Dream", flavorCategory: "fruit", flavorDescription: "Ripe cantaloupe melon sweetness", brandIndex: 3 },
    { productName: "Pear Perfection", flavorCategory: "fruit", flavorDescription: "Juicy Asian pear flavor", brandIndex: 4 },
    { productName: "Pomegranate Burst", flavorCategory: "fruit", flavorDescription: "Tangy pomegranate explosion", brandIndex: 5 },
    { productName: "Acai Berry", flavorCategory: "fruit", flavorDescription: "Exotic acai berry superfruit", brandIndex: 6 },
    { productName: "Lychee Rose", flavorCategory: "fruit", flavorDescription: "Delicate lychee with rose notes", brandIndex: 7 },

    // ==================== E-LIQUIDS - DESSERT ====================
    { productName: "Killer Kustard", flavorCategory: "dessert", flavorDescription: "Rich vanilla custard with hints of butter", brandIndex: 1 },
    { productName: "Milk of the Poppy", flavorCategory: "dessert", flavorDescription: "Dragon fruit, berries with vanilla cream", brandIndex: 1 },
    { productName: "Killer Kustard Blueberry", flavorCategory: "dessert", flavorDescription: "Creamy vanilla custard with blueberry", brandIndex: 1 },
    { productName: "Royalty II", flavorCategory: "dessert", flavorDescription: "Peanut butter, chocolate, banana cream", brandIndex: 1 },
    { productName: "Blueberry Jam Toast", flavorCategory: "dessert", flavorDescription: "Buttery toast with blueberry jam and butter", brandIndex: 2 },
    { productName: "Strawberry Jam Toast", flavorCategory: "dessert", flavorDescription: "Warm toast topped with strawberry jam", brandIndex: 2 },
    { productName: "Grape Jam Toast", flavorCategory: "dessert", flavorDescription: "Fresh grape jam on buttered toast", brandIndex: 2 },
    { productName: "Blackberry Jam Toast", flavorCategory: "dessert", flavorDescription: "Sweet blackberry jam on warm toast", brandIndex: 2 },
    { productName: "Apple Butter Toast", flavorCategory: "dessert", flavorDescription: "Apple butter spread on cinnamon toast", brandIndex: 2 },
    { productName: "Apple Pie", flavorCategory: "dessert", flavorDescription: "Grandma's apple pie with ice cream", brandIndex: 4 },
    { productName: "Blackberry Crumble", flavorCategory: "dessert", flavorDescription: "Fresh blackberry crumble with vanilla ice cream", brandIndex: 4 },
    { productName: "Vanilla Custard", flavorCategory: "dessert", flavorDescription: "Classic rich vanilla bean custard", brandIndex: 5 },
    { productName: "Maple Butter", flavorCategory: "dessert", flavorDescription: "Buttery pancakes with maple syrup", brandIndex: 5 },
    { productName: "The Cream", flavorCategory: "dessert", flavorDescription: "Strawberries and fresh whipped cream", brandIndex: 5 },
    { productName: "Banana Milk", flavorCategory: "dessert", flavorDescription: "Fresh banana with creamy milk", brandIndex: 6 },
    { productName: "Strawberry Tres Leches", flavorCategory: "dessert", flavorDescription: "Strawberry on tres leches cake", brandIndex: 6 },
    { productName: "Farley's Gnarly Sauce", flavorCategory: "dessert", flavorDescription: "Strawberry with kiwi bubble gum", brandIndex: 8 },
    { productName: "Ugly Butter", flavorCategory: "dessert", flavorDescription: "Cinnamon banana French toast", brandIndex: 8 },
    { productName: "Cereal Trip", flavorCategory: "dessert", flavorDescription: "Fruity cereal with cold milk", brandIndex: 8 },
    { productName: "Belts", flavorCategory: "dessert", flavorDescription: "Strawberry sour belt candy", brandIndex: 9 },
    { productName: "Tiramisu", flavorCategory: "dessert", flavorDescription: "Italian coffee-soaked ladyfinger dessert", brandIndex: 1 },
    { productName: "Pumpkin Spice", flavorCategory: "dessert", flavorDescription: "Fall pumpkin with warm spices", brandIndex: 2 },
    { productName: "Churro", flavorCategory: "dessert", flavorDescription: "Cinnamon sugar fried dough", brandIndex: 2 },
    { productName: "Cookies and Cream", flavorCategory: "dessert", flavorDescription: "Chocolate cookies in vanilla cream", brandIndex: 4 },
    { productName: "Lemon Meringue", flavorCategory: "dessert", flavorDescription: "Tangy lemon with fluffy meringue", brandIndex: 4 },
    { productName: "Bread Pudding", flavorCategory: "dessert", flavorDescription: "Warm bread pudding with raisins", brandIndex: 5 },
    { productName: "Key Lime Pie", flavorCategory: "dessert", flavorDescription: "Florida key lime with graham crust", brandIndex: 6 },
    { productName: "Banana Foster", flavorCategory: "dessert", flavorDescription: "Caramelized banana with rum notes", brandIndex: 7 },
    { productName: "Chocolate Chip Cookie", flavorCategory: "dessert", flavorDescription: "Fresh-baked chocolate chip cookie", brandIndex: 8 },
    { productName: "Boston Cream", flavorCategory: "dessert", flavorDescription: "Vanilla custard with chocolate glaze", brandIndex: 9 },
    { productName: "Butterscotch Pudding", flavorCategory: "dessert", flavorDescription: "Rich creamy butterscotch pudding with caramel swirls", brandIndex: 4 },
    { productName: "Glazed Donut", flavorCategory: "dessert", flavorDescription: "Warm glazed donut with sweet icing", brandIndex: 2 },

    // ==================== E-LIQUIDS - MENTHOL ====================
    { productName: "Polar Breeze", flavorCategory: "menthol", flavorDescription: "Intense menthol ice blast", brandIndex: 0 },
    { productName: "Frost Bite", flavorCategory: "menthol", flavorDescription: "Sub-zero menthol freeze", brandIndex: 0 },
    { productName: "Menthol Tobacco", flavorCategory: "menthol", flavorDescription: "Classic tobacco with cool menthol", brandIndex: 0 },
    { productName: "Arctic Cool", flavorCategory: "menthol", flavorDescription: "Pure arctic menthol sensation", brandIndex: 3 },
    { productName: "Strawberry Ice", flavorCategory: "menthol", flavorDescription: "Sweet strawberry with icy menthol", brandIndex: 3 },
    { productName: "Watermelon Ice", flavorCategory: "menthol", flavorDescription: "Juicy watermelon with cool menthol", brandIndex: 3 },
    { productName: "Mint Tobacco", flavorCategory: "menthol", flavorDescription: "Smooth tobacco with fresh mint", brandIndex: 4 },
    { productName: "Spearmint", flavorCategory: "menthol", flavorDescription: "Refreshing spearmint leaf flavor", brandIndex: 4 },
    { productName: "Blue Razz Ice", flavorCategory: "menthol", flavorDescription: "Blue raspberry with icy finish", brandIndex: 5 },
    { productName: "Mango Ice", flavorCategory: "menthol", flavorDescription: "Tropical mango with ice menthol", brandIndex: 5 },
    { productName: "Grape Ice", flavorCategory: "menthol", flavorDescription: "Sweet grape with frosty menthol", brandIndex: 6 },
    { productName: "Peach Ice", flavorCategory: "menthol", flavorDescription: "Fresh peach with cooling sensation", brandIndex: 6 },
    { productName: "Iced Lychee", flavorCategory: "menthol", flavorDescription: "Exotic lychee with ice", brandIndex: 7 },
    { productName: "Menthol Freeze", flavorCategory: "menthol", flavorDescription: "Maximum freeze menthol blend", brandIndex: 7 },
    { productName: "Cool Mint", flavorCategory: "menthol", flavorDescription: "Fresh peppermint with cooling effect", brandIndex: 8 },

    // ==================== E-LIQUIDS - TOBACCO ====================
    { productName: "American Patriots", flavorCategory: "tobacco", flavorDescription: "Bold American tobacco blend", brandIndex: 0 },
    { productName: "Cuban Blend", flavorCategory: "tobacco", flavorDescription: "Rich Cuban cigar tobacco", brandIndex: 0 },
    { productName: "Euro Gold", flavorCategory: "tobacco", flavorDescription: "Smooth European tobacco", brandIndex: 0 },
    { productName: "RY4 Double", flavorCategory: "tobacco", flavorDescription: "Classic RY4 caramel vanilla tobacco", brandIndex: 1 },
    { productName: "Virginia Tobacco", flavorCategory: "tobacco", flavorDescription: "Light Virginia tobacco leaves", brandIndex: 4 },
    { productName: "Smooth Tobacco", flavorCategory: "tobacco", flavorDescription: "Mellow smooth tobacco flavor", brandIndex: 4 },
    { productName: "Turkish Tobacco", flavorCategory: "tobacco", flavorDescription: "Aromatic Turkish tobacco", brandIndex: 5 },
    { productName: "Caramel Tobacco", flavorCategory: "tobacco", flavorDescription: "Sweet caramel tobacco blend", brandIndex: 5 },
    { productName: "Bold Tobacco", flavorCategory: "tobacco", flavorDescription: "Strong full-bodied tobacco", brandIndex: 6 },
    { productName: "Desert Tobacco", flavorCategory: "tobacco", flavorDescription: "Sweet desert tobacco with nuts", brandIndex: 6 },

    // ==================== E-LIQUIDS - BEVERAGE ====================
    { productName: "Pink Lemonade", flavorCategory: "beverage", flavorDescription: "Sweet pink lemonade refresher", brandIndex: 7 },
    { productName: "Strawberry Lemonade", flavorCategory: "beverage", flavorDescription: "Fresh strawberry lemonade", brandIndex: 7 },
    { productName: "Iced Coffee", flavorCategory: "beverage", flavorDescription: "Cold brew coffee with cream", brandIndex: 1 },
    { productName: "Mocha Latte", flavorCategory: "beverage", flavorDescription: "Espresso with chocolate and milk", brandIndex: 1 },
    { productName: "Cola Ice", flavorCategory: "beverage", flavorDescription: "Classic cola on ice", brandIndex: 3 },
    { productName: "Energy Blast", flavorCategory: "beverage", flavorDescription: "Energy drink flavor burst", brandIndex: 3 },
    { productName: "Green Tea", flavorCategory: "beverage", flavorDescription: "Smooth Japanese green tea", brandIndex: 5 },
    { productName: "Peach Tea", flavorCategory: "beverage", flavorDescription: "Sweet peach iced tea", brandIndex: 5 },
    { productName: "Mango Smoothie", flavorCategory: "beverage", flavorDescription: "Tropical mango fruit smoothie", brandIndex: 6 },
    { productName: "Strawberry Milkshake", flavorCategory: "beverage", flavorDescription: "Creamy strawberry milkshake", brandIndex: 6 },
    { productName: "Arnold Palmer", flavorCategory: "beverage", flavorDescription: "Classic iced tea and lemonade refresher blend", brandIndex: 7 },
    { productName: "Horchata", flavorCategory: "beverage", flavorDescription: "Traditional Mexican rice milk with cinnamon and vanilla", brandIndex: 6 },
    { productName: "Ginger Ale", flavorCategory: "beverage", flavorDescription: "Crisp ginger ale with subtle spice notes", brandIndex: 5 },

    // ==================== E-LIQUIDS - CANDY ====================
    { productName: "Sour Worms", flavorCategory: "candy", flavorDescription: "Tangy sour gummy worms", brandIndex: 9 },
    { productName: "Strawberry Watermelon Bubblegum", flavorCategory: "candy", flavorDescription: "Fruity bubblegum candy", brandIndex: 9 },
    { productName: "Pink Squares", flavorCategory: "candy", flavorDescription: "Pink starburst candy flavor", brandIndex: 9 },
    { productName: "Batch", flavorCategory: "candy", flavorDescription: "Sour gummy candy batch", brandIndex: 9 },
    { productName: "Worms", flavorCategory: "candy", flavorDescription: "Sweet gummy worm candy", brandIndex: 9 },
    { productName: "Swedish", flavorCategory: "candy", flavorDescription: "Swedish fish candy", brandIndex: 9 },
    { productName: "Peachy Rings", flavorCategory: "candy", flavorDescription: "Peach ring gummy candy", brandIndex: 9 },
    { productName: "Tropic Mango", flavorCategory: "candy", flavorDescription: "Tropical mango hard candy", brandIndex: 3 },
    { productName: "Strawberry Cotton Candy", flavorCategory: "candy", flavorDescription: "Fluffy strawberry cotton candy", brandIndex: 3 },
    { productName: "Rainbow Drops", flavorCategory: "candy", flavorDescription: "Mixed fruit rainbow candy", brandIndex: 5 },
    { productName: "Cherry Bomb", flavorCategory: "candy", flavorDescription: "Sour cherry hard candy", brandIndex: 5 },
    { productName: "Grape Lollipop", flavorCategory: "candy", flavorDescription: "Sweet grape lollipop flavor", brandIndex: 7 },
    { productName: "Watermelon Bubblegum", flavorCategory: "candy", flavorDescription: "Watermelon bubble gum candy", brandIndex: 7 },
    { productName: "Laffy Taffy", flavorCategory: "candy", flavorDescription: "Stretchy taffy candy mix", brandIndex: 8 },
    { productName: "Jawbreaker", flavorCategory: "candy", flavorDescription: "Multi-layer jawbreaker candy", brandIndex: 8 },
  ],
  disposables: [
    // Elf Bar (10)
    { productName: "Elf Bar BC5000 Strawberry Mango", flavorCategory: "fruit", flavorDescription: "Sweet strawberry and tropical mango blend, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Blue Razz Ice", flavorCategory: "menthol", flavorDescription: "Blue raspberry with icy menthol, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Watermelon Ice", flavorCategory: "menthol", flavorDescription: "Fresh watermelon with cool ice, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Rainbow Candy", flavorCategory: "candy", flavorDescription: "Mixed fruit rainbow candy, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Peach Ice", flavorCategory: "menthol", flavorDescription: "Juicy peach with icy finish, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Mango Peach", flavorCategory: "fruit", flavorDescription: "Tropical mango and sweet peach, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Grape Energy", flavorCategory: "beverage", flavorDescription: "Grape energy drink flavor, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Strawberry Banana", flavorCategory: "fruit", flavorDescription: "Strawberry and banana smoothie, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Triple Berry Ice", flavorCategory: "menthol", flavorDescription: "Mixed berries with cooling ice, 5000 puffs", brandIndex: 10 },
    { productName: "Elf Bar BC5000 Cranberry Grape", flavorCategory: "fruit", flavorDescription: "Tart cranberry and sweet grape, 5000 puffs", brandIndex: 10 },
    // Lost Mary (8)
    { productName: "Lost Mary OS5000 Blue Cotton Candy", flavorCategory: "candy", flavorDescription: "Sweet blue cotton candy, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Strawberry Sundae", flavorCategory: "dessert", flavorDescription: "Strawberry ice cream sundae, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Citrus Sunrise", flavorCategory: "fruit", flavorDescription: "Orange and citrus morning blend, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Juicy Peach", flavorCategory: "fruit", flavorDescription: "Ripe Georgia peach flavor, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Grape Jelly", flavorCategory: "candy", flavorDescription: "Sweet grape jelly candy, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Pineapple Mango", flavorCategory: "fruit", flavorDescription: "Tropical pineapple mango, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Mad Blue", flavorCategory: "candy", flavorDescription: "Blue raspberry mad mix, 5000 puffs", brandIndex: 11 },
    { productName: "Lost Mary OS5000 Yummy", flavorCategory: "candy", flavorDescription: "Mystery yummy candy blend, 5000 puffs", brandIndex: 11 },
    // Puff Bar (6)
    { productName: "Puff Bar Plus Mango", flavorCategory: "fruit", flavorDescription: "Sweet tropical mango, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Lush Ice", flavorCategory: "menthol", flavorDescription: "Watermelon with menthol ice, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Pink Lemonade", flavorCategory: "beverage", flavorDescription: "Sweet pink lemonade, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Strawberry Banana", flavorCategory: "fruit", flavorDescription: "Strawberry banana smoothie, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus OMG", flavorCategory: "candy", flavorDescription: "Orange mango guava mix, 800 puffs", brandIndex: 12 },
    { productName: "Puff Bar Plus Tangerine Ice", flavorCategory: "menthol", flavorDescription: "Tangerine with ice, 800 puffs", brandIndex: 12 },
    // Geek Bar (8)
    { productName: "Geek Bar Pulse Watermelon Ice", flavorCategory: "menthol", flavorDescription: "Fresh watermelon with ice, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Blue Razz Ice", flavorCategory: "menthol", flavorDescription: "Blue raspberry ice blast, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Strawberry Mango", flavorCategory: "fruit", flavorDescription: "Strawberry mango fusion, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Tropical Rainbow", flavorCategory: "candy", flavorDescription: "Tropical rainbow candy, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Miami Mint", flavorCategory: "menthol", flavorDescription: "Cool Miami mint breeze, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Grape Ice", flavorCategory: "menthol", flavorDescription: "Sweet grape with icy finish, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Peach Ice", flavorCategory: "menthol", flavorDescription: "Juicy peach with menthol, 15000 puffs", brandIndex: 13 },
    { productName: "Geek Bar Pulse Sour Apple Ice", flavorCategory: "menthol", flavorDescription: "Sour green apple with ice, 15000 puffs", brandIndex: 13 },
    // Hyde (6)
    { productName: "Hyde IQ Blue Razz Ice", flavorCategory: "menthol", flavorDescription: "Blue raspberry with ice, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Strawberry Banana", flavorCategory: "fruit", flavorDescription: "Strawberry banana mix, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Peach Mango", flavorCategory: "fruit", flavorDescription: "Peach and mango blend, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Rainbow", flavorCategory: "candy", flavorDescription: "Rainbow skittles candy, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Mango Ice", flavorCategory: "menthol", flavorDescription: "Tropical mango with ice, 5000 puffs", brandIndex: 14 },
    { productName: "Hyde IQ Spearmint", flavorCategory: "menthol", flavorDescription: "Fresh spearmint leaves, 5000 puffs", brandIndex: 14 },
    // Breeze (4)
    { productName: "Breeze Pro Watermelon Mint", flavorCategory: "menthol", flavorDescription: "Watermelon with mint, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Strawberry Cream", flavorCategory: "dessert", flavorDescription: "Strawberry with cream, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Blueberry Lemon", flavorCategory: "fruit", flavorDescription: "Blueberry and lemon blend, 2000 puffs", brandIndex: 15 },
    { productName: "Breeze Pro Tobacco", flavorCategory: "tobacco", flavorDescription: "Classic tobacco flavor, 2000 puffs", brandIndex: 15 },
    // FLUM (4)
    { productName: "FLUM Pebble Clear", flavorCategory: "menthol", flavorDescription: "Crystal clear menthol, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Strawberry Banana", flavorCategory: "fruit", flavorDescription: "Strawberry banana blend, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Lush Ice", flavorCategory: "menthol", flavorDescription: "Watermelon lush ice, 6000 puffs", brandIndex: 16 },
    { productName: "FLUM Pebble Berry Fusion", flavorCategory: "fruit", flavorDescription: "Mixed berry fusion, 6000 puffs", brandIndex: 16 },
    // Funky Republic (4)
    { productName: "Funky Republic Ti7000 Blue Razz Ice", flavorCategory: "menthol", flavorDescription: "Blue raspberry with ice, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Tropical Rainbow", flavorCategory: "candy", flavorDescription: "Tropical rainbow candy, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Watermelon Ice", flavorCategory: "menthol", flavorDescription: "Fresh watermelon ice, 7000 puffs", brandIndex: 17 },
    { productName: "Funky Republic Ti7000 Strawberry Kiwi", flavorCategory: "fruit", flavorDescription: "Strawberry and kiwi blend, 7000 puffs", brandIndex: 17 },
  ],
  hardware: [
    // SMOK (8)
    { productName: "SMOK Nord 5", flavorCategory: "other", flavorDescription: "Compact pod system with 2000mAh battery and adjustable wattage", brandIndex: 18 },
    { productName: "SMOK RPM 5 Pro", flavorCategory: "other", flavorDescription: "Advanced pod mod with 80W output and smart mode", brandIndex: 18 },
    { productName: "SMOK Novo 5", flavorCategory: "other", flavorDescription: "Sleek pod device with side fill design", brandIndex: 18 },
    { productName: "SMOK Morph 3", flavorCategory: "other", flavorDescription: "230W box mod with TFT color screen", brandIndex: 18 },
    { productName: "SMOK Mag P3 Kit", flavorCategory: "other", flavorDescription: "Ergonomic 230W mod with trigger-style firing", brandIndex: 18 },
    { productName: "SMOK TFV18 Tank", flavorCategory: "other", flavorDescription: "Sub-ohm tank with massive cloud production", brandIndex: 18 },
    { productName: "SMOK RPM Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement coils for RPM series devices", brandIndex: 18 },
    { productName: "SMOK Nord Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement coils for Nord series", brandIndex: 18 },
    // Vaporesso (6)
    { productName: "Vaporesso XROS 3", flavorCategory: "other", flavorDescription: "Slim pod system with adjustable airflow", brandIndex: 19 },
    { productName: "Vaporesso Luxe X Pro", flavorCategory: "other", flavorDescription: "Premium pod device with 1500mAh battery", brandIndex: 19 },
    { productName: "Vaporesso Target 200", flavorCategory: "other", flavorDescription: "Dual battery 220W mod with iTank X", brandIndex: 19 },
    { productName: "Vaporesso Gen S", flavorCategory: "other", flavorDescription: "220W mod with AXON chipset and pulse mode", brandIndex: 19 },
    { productName: "Vaporesso GTX Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Universal GTX replacement coils", brandIndex: 19 },
    { productName: "Vaporesso iTank", flavorCategory: "other", flavorDescription: "Leak-proof sub-ohm tank with flip top fill", brandIndex: 19 },
    // GeekVape (5)
    { productName: "GeekVape Aegis Legend 2", flavorCategory: "other", flavorDescription: "200W waterproof shockproof mod", brandIndex: 20 },
    { productName: "GeekVape Aegis X", flavorCategory: "other", flavorDescription: "200W mod with 2.4\" color screen", brandIndex: 20 },
    { productName: "GeekVape Wenax K1", flavorCategory: "other", flavorDescription: "Compact MTL pod system", brandIndex: 20 },
    { productName: "GeekVape Zeus Tank", flavorCategory: "other", flavorDescription: "Top airflow sub-ohm tank", brandIndex: 20 },
    { productName: "GeekVape Z Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Zeus series replacement coils", brandIndex: 20 },
    // Voopoo (4)
    { productName: "Voopoo Drag 4", flavorCategory: "other", flavorDescription: "177W mod with GENE.TT 2.0 chip", brandIndex: 21 },
    { productName: "Voopoo Argus Pro 2", flavorCategory: "other", flavorDescription: "80W pod mod with PnP platform", brandIndex: 21 },
    { productName: "Voopoo Vinci 3", flavorCategory: "other", flavorDescription: "50W pod mod with cartridge system", brandIndex: 21 },
    { productName: "Voopoo PnP Coils 5-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Universal PnP replacement coils", brandIndex: 21 },
    // Uwell (4)
    { productName: "Uwell Caliburn A3", flavorCategory: "other", flavorDescription: "Slim pod device with 520mAh battery", brandIndex: 22 },
    { productName: "Uwell Caliburn G2", flavorCategory: "other", flavorDescription: "Updated Caliburn G with improved pods", brandIndex: 22 },
    { productName: "Uwell Crown 5 Tank", flavorCategory: "other", flavorDescription: "Sub-ohm tank with self-cleaning tech", brandIndex: 22 },
    { productName: "Uwell Caliburn Pods 4-Pack", productType: "accessory", flavorCategory: "other", flavorDescription: "Replacement pods for Caliburn series", brandIndex: 22 },
    // Aspire (2)
    { productName: "Aspire Nautilus Prime X", flavorCategory: "other", flavorDescription: "60W pod mod with BP coil platform", brandIndex: 23 },
    { productName: "Aspire Flexus Q", flavorCategory: "other", flavorDescription: "700mAh pod device with Flexus coils", brandIndex: 23 },
    // Innokin (1)
    { productName: "Innokin Endura T20-S", flavorCategory: "other", flavorDescription: "Starter kit for beginners", brandIndex: 24 },
    // Accessories
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
    const regularNicotineLevels = ["0mg", "3mg", "6mg", "12mg", "18mg", "24mg"];
    const saltNicotineLevels = ["20mg", "35mg", "50mg"];
    const vgPgRatios = ["50/50", "70/30", "MAX VG"];
    const bottleSizes = ["30ml", "60ml", "100ml"];

    let productCount = 0;
    let variantCount = 0;

    // Insert E-LIQUIDS - create both regular AND salt versions for each
    for (const eliquid of demoData.eLiquids) {
      const brand = insertedBrands[eliquid.brandIndex];
      
      // Create REGULAR nicotine version
      const [regularProduct] = await db.insert(products).values({
        productName: eliquid.productName,
        productType: "e-liquid",
        flavorCategory: eliquid.flavorCategory,
        flavorDescription: `${eliquid.flavorDescription}. Available in 0mg, 3mg, 6mg, 12mg, 18mg, 24mg`,
        nicotineType: "regular",
        brandId: brand.id,
      }).returning();
      productCount++;

      // Add regular nicotine variants
      for (const nicotine of regularNicotineLevels) {
        for (const ratio of vgPgRatios) {
          for (const size of bottleSizes) {
            await db.insert(productVariants).values({
              productId: regularProduct.id,
              nicotineLevel: nicotine,
              vgPgRatio: ratio,
              bottleSize: size,
              msrp: (12 + Math.random() * 18).toFixed(2),
            });
            variantCount++;
          }
        }
      }

      // Create SALT nicotine version
      const [saltProduct] = await db.insert(products).values({
        productName: eliquid.productName,
        productType: "e-liquid",
        flavorCategory: eliquid.flavorCategory,
        flavorDescription: `${eliquid.flavorDescription}. Available in 20mg, 35mg, 50mg salt nicotine for a smoother hit`,
        nicotineType: "salt",
        brandId: brand.id,
      }).returning();
      productCount++;

      // Add salt nicotine variants (typically 50/50 ratio, smaller bottles)
      for (const nicotine of saltNicotineLevels) {
        for (const size of ["30ml", "60ml"]) {
          await db.insert(productVariants).values({
            productId: saltProduct.id,
            nicotineLevel: nicotine,
            vgPgRatio: "50/50",
            bottleSize: size,
            msrp: (14 + Math.random() * 16).toFixed(2),
          });
          variantCount++;
        }
      }
    }

    // Insert DISPOSABLES with salt nicotine type
    for (const disposable of demoData.disposables) {
      const brand = insertedBrands[disposable.brandIndex];
      
      const [product] = await db.insert(products).values({
        productName: disposable.productName,
        productType: "disposable",
        flavorCategory: disposable.flavorCategory,
        flavorDescription: disposable.flavorDescription,
        nicotineType: "salt",
        brandId: brand.id,
      }).returning();
      productCount++;

      // Disposables have salt nic variants
      for (const nicotine of saltNicotineLevels) {
        await db.insert(productVariants).values({
          productId: product.id,
          nicotineLevel: nicotine,
          msrp: (18 + Math.random() * 12).toFixed(2),
        });
        variantCount++;
      }
    }

    // Insert HARDWARE with nicotineType: "none"
    for (const hw of demoData.hardware) {
      const brand = insertedBrands[hw.brandIndex];
      const productType = hw.productType || "hardware";
      
      const [product] = await db.insert(products).values({
        productName: hw.productName,
        productType: productType,
        flavorCategory: hw.flavorCategory,
        flavorDescription: hw.flavorDescription,
        nicotineType: "none",
        brandId: brand.id,
      }).returning();
      productCount++;

      // Hardware/accessories - single variant with just price
      await db.insert(productVariants).values({
        productId: product.id,
        msrp: (15 + Math.random() * 85).toFixed(2),
      });
      variantCount++;
    }

    console.log(`Inserted ${productCount} products with ${variantCount} variants`);

    // Create demo shop and add all products to it
    const [demoShop] = await db.insert(shops).values({
      id: "demo",
      shopOwnerId: "demo-user",
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

// Run seed when executed directly (not when imported)
if (process.argv[1]?.includes("seed")) {
  seedDatabase()
    .then(() => {
      console.log("Seed script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed script failed:", error);
      process.exit(1);
    });
}
