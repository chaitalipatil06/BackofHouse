import type { InventoryItem, MenuItem } from "./types.ts";

// Sample data for a small café. Demo mode runs on this, and
// `npm run seed:sql` turns it into supabase/seed.sql.

const ROASTER = "Bean & Barrel Roasters";
const DAIRY = "Valley Dairy Co.";
const SUPPLY = "Café Supply Direct";
const BAKERY = "Morning Oven Bakery";

export const SEED_INVENTORY: InventoryItem[] = [
  { id: "beans", name: "Espresso beans, house blend", category: "Coffee", unit: "g", quantity: 3200, reorderAt: 4000, par: 10000, packSize: 1000, packLabel: "1 kg bag", supplier: ROASTER },
  { id: "decaf", name: "Decaf beans", category: "Coffee", unit: "g", quantity: 1500, reorderAt: 1000, par: 3000, packSize: 1000, packLabel: "1 kg bag", supplier: ROASTER },
  { id: "coldbrew", name: "Cold brew concentrate", category: "Coffee", unit: "ml", quantity: 1200, reorderAt: 3000, par: 8000, packSize: 2000, packLabel: "2 L jug", supplier: ROASTER },
  { id: "milk", name: "Whole milk", category: "Milk", unit: "ml", quantity: 9000, reorderAt: 12000, par: 30000, packSize: 4000, packLabel: "4 L jug", supplier: DAIRY },
  { id: "oat", name: "Oat milk", category: "Milk", unit: "ml", quantity: 7000, reorderAt: 4000, par: 12000, packSize: 1000, packLabel: "1 L carton", supplier: DAIRY },
  { id: "choc", name: "Chocolate sauce", category: "Syrups", unit: "ml", quantity: 1800, reorderAt: 1000, par: 3000, packSize: 1000, packLabel: "1 L bottle", supplier: SUPPLY },
  { id: "vanilla", name: "Vanilla syrup", category: "Syrups", unit: "ml", quantity: 400, reorderAt: 500, par: 2000, packSize: 750, packLabel: "750 ml bottle", supplier: SUPPLY },
  { id: "sf-vanilla", name: "Sugar-free vanilla syrup", category: "Syrups", unit: "ml", quantity: 1400, reorderAt: 500, par: 2000, packSize: 750, packLabel: "750 ml bottle", supplier: SUPPLY },
  { id: "sf-caramel", name: "Sugar-free caramel syrup", category: "Syrups", unit: "ml", quantity: 1100, reorderAt: 500, par: 2000, packSize: 750, packLabel: "750 ml bottle", supplier: SUPPLY },
  { id: "matcha", name: "Matcha powder", category: "Tea", unit: "g", quantity: 180, reorderAt: 100, par: 500, packSize: 100, packLabel: "100 g tin", supplier: SUPPLY },
  { id: "chai", name: "Chai concentrate", category: "Tea", unit: "ml", quantity: 2500, reorderAt: 2000, par: 6000, packSize: 1000, packLabel: "1 L carton", supplier: SUPPLY },
  { id: "mate", name: "Yerba mate concentrate", category: "Energy", unit: "ml", quantity: 2400, reorderAt: 1000, par: 4000, packSize: 1000, packLabel: "1 L bottle", supplier: SUPPLY },
  { id: "greencoffee", name: "Green coffee extract", category: "Energy", unit: "ml", quantity: 900, reorderAt: 400, par: 1500, packSize: 500, packLabel: "500 ml bottle", supplier: SUPPLY },
  { id: "berry", name: "Berry purée", category: "Energy", unit: "ml", quantity: 1600, reorderAt: 800, par: 3000, packSize: 1000, packLabel: "1 L pouch", supplier: SUPPLY },
  { id: "sf-berry", name: "Sugar-free berry syrup", category: "Energy", unit: "ml", quantity: 1300, reorderAt: 500, par: 2000, packSize: 750, packLabel: "750 ml bottle", supplier: SUPPLY },
  { id: "sparkling", name: "Sparkling water", category: "Energy", unit: "ml", quantity: 14000, reorderAt: 8000, par: 24000, packSize: 6000, packLabel: "case of 6 × 1 L", supplier: SUPPLY },
  { id: "lime", name: "Lime juice", category: "Energy", unit: "ml", quantity: 600, reorderAt: 300, par: 1000, packSize: 500, packLabel: "500 ml bottle", supplier: SUPPLY },
  { id: "croissant", name: "Butter croissants", category: "Bakery", unit: "pcs", quantity: 18, reorderAt: 12, par: 36, packSize: 12, packLabel: "tray of 12", supplier: BAKERY },
  { id: "muffin", name: "Blueberry muffins", category: "Bakery", unit: "pcs", quantity: 14, reorderAt: 8, par: 24, packSize: 6, packLabel: "box of 6", supplier: BAKERY },
  { id: "banana", name: "Banana bread slices", category: "Bakery", unit: "pcs", quantity: 6, reorderAt: 8, par: 20, packSize: 10, packLabel: "loaf of 10 slices", supplier: BAKERY },
  { id: "sf-cookie", name: "Sugar-free oat cookies", category: "Bakery", unit: "pcs", quantity: 20, reorderAt: 10, par: 30, packSize: 10, packLabel: "pack of 10", supplier: BAKERY },
  { id: "soup", name: "Tomato soup", category: "Kitchen", unit: "ml", quantity: 4000, reorderAt: 2000, par: 6000, packSize: 2000, packLabel: "2 L tub", supplier: BAKERY },
  { id: "cup12", name: "Cups, 12 oz", category: "Packaging", unit: "pcs", quantity: 140, reorderAt: 200, par: 600, packSize: 50, packLabel: "sleeve of 50", supplier: SUPPLY },
  { id: "cup16", name: "Cups, 16 oz", category: "Packaging", unit: "pcs", quantity: 320, reorderAt: 200, par: 600, packSize: 50, packLabel: "sleeve of 50", supplier: SUPPLY },
];

const SHOT = { text: "Pull a double shot, 18 g in and 36 g out.", seconds: 27, tip: "Aim for 25 to 30 seconds. Too fast? Grind finer. Too slow? Grind coarser." };
const STEAM = { text: "Steam the milk to 140°F with a thin layer of foam.", seconds: 30, tip: "Keep the steam tip just under the surface at first to add air, then lower it to heat." };

export const SEED_MENU: MenuItem[] = [
  // Coffee
  { id: "latte", name: "Latte", category: "Coffee", temp: "hot", price: 4.75, sugarFree: true, dairyFree: false, caffeine: "medium", uses: { beans: 18, milk: 240 },
    steps: [SHOT, STEAM, { text: "Pour the milk into the espresso and finish with a heart.", tip: "Pour from high to mix, then bring the pitcher close to draw the shape." }] },
  { id: "cappuccino", name: "Cappuccino", category: "Coffee", temp: "hot", price: 4.5, sugarFree: true, dairyFree: false, caffeine: "medium", uses: { beans: 18, milk: 150 },
    steps: [SHOT, { text: "Steam the milk with extra air for thick, light foam.", seconds: 25, tip: "The milk should grow about a third in the pitcher." }, { text: "Spoon the foam on top to fill the cup." }] },
  { id: "mocha", name: "Mocha", category: "Coffee", temp: "hot", price: 5.25, sugarFree: false, dairyFree: false, caffeine: "medium", comfort: true, uses: { beans: 18, milk: 200, choc: 30 },
    steps: [{ text: "Add 30 ml of chocolate sauce to the cup." }, { ...SHOT, text: "Pull a double shot onto the chocolate and stir.", tip: "Stirring while hot melts the sauce so it doesn't sink." }, STEAM, { text: "Pour the milk and add a chocolate drizzle." }] },
  { id: "sf-vanilla-latte", name: "Sugar-free vanilla latte", category: "Coffee", temp: "hot", price: 5.25, sugarFree: true, dairyFree: false, caffeine: "medium", uses: { beans: 18, milk: 220, "sf-vanilla": 20 },
    steps: [{ text: "Add 20 ml of sugar-free vanilla syrup to the cup.", tip: "Use the bottle with the green label. Never swap in regular vanilla." }, SHOT, STEAM, { text: "Pour the milk and stir once." }] },
  { id: "americano", name: "Americano", category: "Coffee", temp: "hot", price: 3.5, sugarFree: true, dairyFree: true, caffeine: "medium", uses: { beans: 18 },
    steps: [{ text: "Fill the cup two-thirds with hot water.", tip: "Water first keeps the crema on top." }, SHOT] },
  { id: "iced-latte", name: "Iced latte", category: "Coffee", temp: "iced", price: 5, sugarFree: true, dairyFree: false, caffeine: "medium", uses: { beans: 18, milk: 200 },
    steps: [{ text: "Fill the cup with ice." }, { text: "Pour in 200 ml of cold milk." }, { ...SHOT, text: "Pull a double shot and pour it on top.", tip: "Pouring last gives the layered look." }] },
  { id: "sf-caramel-iced", name: "Sugar-free iced caramel latte", category: "Coffee", temp: "iced", price: 5.5, sugarFree: true, dairyFree: false, caffeine: "medium", uses: { beans: 18, milk: 200, "sf-caramel": 20 },
    steps: [{ text: "Add 20 ml of sugar-free caramel syrup to the cup." }, { text: "Add ice and 200 ml of cold milk." }, { ...SHOT, text: "Pull a double shot and pour it on top." }] },
  { id: "iced-oat-vanilla", name: "Iced vanilla oat latte", category: "Coffee", temp: "iced", price: 5.75, sugarFree: false, dairyFree: true, caffeine: "medium", uses: { beans: 18, oat: 200, vanilla: 20 },
    steps: [{ text: "Add 20 ml of vanilla syrup to the cup." }, { text: "Add ice and 200 ml of oat milk." }, { ...SHOT, text: "Pull a double shot and pour it on top." }] },
  { id: "cold-brew", name: "Cold brew", category: "Coffee", temp: "iced", price: 4.5, sugarFree: true, dairyFree: true, caffeine: "high", uses: { coldbrew: 120 },
    steps: [{ text: "Fill the cup with ice." }, { text: "Add 120 ml of concentrate and top up with cold water.", tip: "Taste the first one from each new batch." }] },

  // Tea
  { id: "chai", name: "Chai latte", category: "Tea", temp: "hot", price: 4.75, sugarFree: false, dairyFree: false, caffeine: "low", comfort: true, uses: { chai: 120, milk: 120 },
    steps: [{ text: "Add 120 ml chai concentrate and 120 ml milk to the pitcher.", tip: "Steaming them together keeps the spice warm all the way through." }, { text: "Steam to 150°F.", seconds: 35 }, { text: "Pour and dust with cinnamon." }] },
  { id: "iced-matcha", name: "Iced matcha latte", category: "Tea", temp: "iced", price: 5.5, sugarFree: true, dairyFree: true, caffeine: "medium", uses: { matcha: 4, oat: 240 },
    steps: [{ text: "Sift 4 g of matcha into a bowl.", tip: "Sifting stops clumps." }, { text: "Whisk with 60 ml of warm water until frothy.", seconds: 20, tip: "Whisk in a W shape, not in circles." }, { text: "Pour over ice and 240 ml of oat milk." }] },

  // Energy
  { id: "mate-sparkler", name: "Citrus mate sparkler", category: "Energy", temp: "iced", price: 5, sugarFree: true, dairyFree: true, caffeine: "high", uses: { mate: 90, lime: 15, sparkling: 250 },
    steps: [{ text: "Fill the cup with ice." }, { text: "Add 90 ml of mate concentrate and 15 ml of lime juice." }, { text: "Top with sparkling water and stir gently once.", tip: "Stir gently or the bubbles go flat." }] },
  { id: "berry-energy", name: "Berry energy refresher", category: "Energy", temp: "iced", price: 5.5, sugarFree: false, dairyFree: true, caffeine: "high", uses: { greencoffee: 30, berry: 60, sparkling: 220 },
    steps: [{ text: "Add 30 ml of green coffee extract and 60 ml of berry purée to a shaker." }, { text: "Add ice and shake hard.", seconds: 10 }, { text: "Pour into the cup and top with sparkling water." }] },
  { id: "sf-berry-energy", name: "Sugar-free berry energy", category: "Energy", temp: "iced", price: 5.5, sugarFree: true, dairyFree: true, caffeine: "high", uses: { greencoffee: 30, "sf-berry": 25, sparkling: 260 },
    steps: [{ text: "Add 30 ml of green coffee extract and 25 ml of sugar-free berry syrup to a shaker.", tip: "Check the label says sugar-free before you pour." }, { text: "Add ice and shake hard.", seconds: 10 }, { text: "Pour into the cup and top with sparkling water." }] },

  // Food
  { id: "f-croissant", name: "Butter croissant", category: "Food", temp: "any", price: 3.75, sugarFree: false, dairyFree: false, caffeine: "none", uses: { croissant: 1 },
    steps: [{ text: "Warm in the oven at 350°F.", seconds: 120 }, { text: "Serve on a plate or in a bag." }] },
  { id: "f-muffin", name: "Blueberry muffin", category: "Food", temp: "any", price: 3.5, sugarFree: false, dairyFree: false, caffeine: "none", uses: { muffin: 1 },
    steps: [{ text: "Serve as is, or warm for 20 seconds if asked.", seconds: 20 }] },
  { id: "f-banana", name: "Banana bread", category: "Food", temp: "any", price: 3.75, sugarFree: false, dairyFree: false, caffeine: "none", uses: { banana: 1 },
    steps: [{ text: "Serve one slice, warmed if asked.", seconds: 30 }] },
  { id: "f-sf-cookie", name: "Sugar-free oat cookie", category: "Food", temp: "any", price: 2.75, sugarFree: true, dairyFree: true, caffeine: "none", uses: { "sf-cookie": 1 },
    steps: [{ text: "Serve in its own bag, away from other pastries.", tip: "Keeping it separate avoids mix-ups for people avoiding sugar." }] },
  { id: "f-soup", name: "Tomato soup cup", category: "Food", temp: "hot", price: 6, sugarFree: false, dairyFree: true, caffeine: "none", comfort: true, uses: { soup: 300 },
    steps: [{ text: "Heat 300 ml until steaming.", seconds: 90 }, { text: "Serve with a spoon and a lid." }] },
];

export const SEED_STAFF = [
  { id: "maya", name: "Maya Ortiz", role: "manager" as const, pin: "1111" },
  { id: "leo", name: "Leo Tran", role: "barista" as const, pin: "2222" },
  { id: "priya", name: "Priya Nair", role: "barista" as const, pin: "3333" },
  { id: "sam", name: "Sam Walker", role: "trainee" as const, pin: "4444" },
];
