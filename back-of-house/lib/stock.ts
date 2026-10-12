import type { InventoryItem, MenuItem, Unit } from "./types";

export type StockStatus = "ok" | "low" | "out";

export function stockStatus(item: Pick<InventoryItem, "quantity" | "reorderAt">): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity < item.reorderAt) return "low";
  return "ok";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  ok: "In stock",
  low: "Running low",
  out: "Out of stock",
};

/** The unit people count in: kg and L for large amounts, otherwise the base unit. */
export function displayUnit(item: Pick<InventoryItem, "unit" | "par">): { label: string; factor: number } {
  if (item.unit === "g" && item.par >= 1000) return { label: "kg", factor: 1000 };
  if (item.unit === "ml" && item.par >= 1000) return { label: "L", factor: 1000 };
  return { label: item.unit, factor: 1 };
}

export function toDisplay(item: Pick<InventoryItem, "unit" | "par">, base: number): number {
  const { factor } = displayUnit(item);
  return Math.round((base / factor) * 100) / 100;
}

export function formatAmount(item: Pick<InventoryItem, "unit" | "par">, base: number): string {
  const { label } = displayUnit(item);
  return `${toDisplay(item, base)} ${label}`;
}

/** Recipe amounts read better in the base unit: "18 g", "240 ml". */
export function formatRecipeAmount(unit: Unit, amount: number): string {
  const n = Math.round(amount);
  return unit === "pcs" ? String(n) : `${n} ${unit}`;
}

/** The sensible step for a +/- button, in base units. */
export function stepFor(item: Pick<InventoryItem, "unit" | "par" | "packSize">): number {
  if (item.unit === "pcs") return item.par >= 200 ? 10 : 1;
  const { factor } = displayUnit(item);
  return factor === 1000 ? 100 : Math.max(10, Math.round(item.packSize / 10));
}

export const SIZE_FACTOR: Record<12 | 16, number> = { 12: 1, 16: 1.33 };

/** How many of a menu item the current stock can make (ignoring cups). */
export function servingsLeft(item: Pick<MenuItem, "uses">, inventory: InventoryItem[], factor = 1): number {
  const byId = new Map(inventory.map((i) => [i.id, i]));
  let min = Infinity;
  for (const [id, amount] of Object.entries(item.uses)) {
    const stock = byId.get(id);
    if (!stock) return 0;
    min = Math.min(min, Math.floor(stock.quantity / (amount * factor) + 1e-9));
  }
  return min === Infinity ? 0 : Math.max(0, min);
}
