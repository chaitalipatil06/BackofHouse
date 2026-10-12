export type Role = "manager" | "barista";

export type Unit = "g" | "ml" | "pcs";

export type InventoryItem = {
  id: string;
  name: string;
  category: "Coffee" | "Milk" | "Syrups" | "Tea" | "Energy" | "Bakery" | "Kitchen" | "Packaging";
  unit: Unit;
  /** Quantity on hand, in the base unit (g, ml or pcs). */
  quantity: number;
  /** When quantity drops below this, the item goes on the reorder list. */
  reorderAt: number;
  /** The level a restock brings the item back up to. */
  par: number;
  packSize: number;
  packLabel: string;
  supplier: string;
};

export type Caffeine = "none" | "low" | "medium" | "high";

export type RecipeStep = {
  text: string;
  /** Optional timer for this step, in seconds. */
  seconds?: number;
  /** A short tip for people still learning. */
  tip?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: "Coffee" | "Tea" | "Energy" | "Food";
  temp: "hot" | "iced" | "any";
  price: number;
  sugarFree: boolean;
  dairyFree: boolean;
  caffeine: Caffeine;
  /** A cosy pick that sells better on cold or rainy days. */
  comfort?: boolean;
  /** Ingredient amounts for one 12 oz drink (or one food portion), in base units. */
  uses: Record<string, number>;
  steps: RecipeStep[];
};

export type Staff = {
  id: string;
  name: string;
  role: Role | "trainee";
  /** ISO time of the open clock-in, or null when off shift. */
  onShiftSince: string | null;
};

export type ShiftEvent = {
  id: string;
  staffName: string;
  kind: "in" | "out";
  at: string;
};

export type Forecast = {
  tempF: number;
  rainy: boolean;
  label: string;
  source: "live" | "sample";
};

export type PublishedMenu = {
  date: string;
  itemIds: string[];
  specialId: string | null;
  forecast: Forecast;
  publishedAt: string;
  publishedBy: string;
};

export type OrderLine = {
  itemId: string;
  name: string;
  supplier: string;
  packs: number;
  packLabel: string;
  quantity: number;
  unit: Unit;
};

export type Order = {
  id: string;
  createdAt: string;
  createdBy: string;
  lines: OrderLine[];
};

export type Session = {
  name: string;
  role: Role;
  mode: "demo" | "supabase";
};
