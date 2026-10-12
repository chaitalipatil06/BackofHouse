import type { InventoryItem, OrderLine } from "./types";
import { formatAmount, stockStatus } from "./stock";

export type DraftLine = OrderLine & { onHand: number; par: number; suggestedPacks: number };

/** Everything under its reorder level, topped back up to par in whole packs. */
export function buildReorder(inventory: InventoryItem[]): DraftLine[] {
  return inventory
    .filter((i) => stockStatus(i) !== "ok")
    .map((i) => {
      const packs = Math.max(1, Math.ceil((i.par - i.quantity) / i.packSize - 1e-9));
      return {
        itemId: i.id,
        name: i.name,
        supplier: i.supplier,
        packs,
        suggestedPacks: packs,
        packLabel: i.packLabel,
        quantity: packs * i.packSize,
        unit: i.unit,
        onHand: i.quantity,
        par: i.par,
      };
    })
    .sort((a, b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name));
}

export function groupBySupplier<T extends { supplier: string }>(lines: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const l of lines) map.set(l.supplier, [...(map.get(l.supplier) ?? []), l]);
  return [...map.entries()];
}

/** A plain-language request to paste into Muse (Meta's personal AI agent). */
export function museMessage(lines: OrderLine[], shopName: string): string {
  const groups = groupBySupplier(lines.filter((l) => l.packs > 0));
  const body = groups
    .map(([supplier, ls]) =>
      `${supplier}\n` +
      ls
        .map((l) => `  - ${l.name}: ${l.packs} × ${l.packLabel} (${formatAmount({ unit: l.unit, par: l.quantity >= 1000 ? 1000 : 0 }, l.quantity)})`)
        .join("\n"),
    )
    .join("\n\n");
  return (
    `Hi Muse, please place these restock orders for ${shopName}. ` +
    `Use our usual account with each supplier, and check with me before you complete each checkout.\n\n` +
    `${body}\n\nWe need delivery by tomorrow morning if possible. Thank you!`
  );
}

/** The same order as structured data, for a future direct integration. */
export function orderJson(lines: OrderLine[], shopName: string, requestedBy: string) {
  return {
    shop: shopName,
    requested_by: requestedBy,
    instructions: "Place one order per supplier. Ask for approval before each checkout.",
    orders: groupBySupplier(lines.filter((l) => l.packs > 0)).map(([supplier, ls]) => ({
      supplier,
      items: ls.map((l) => ({ sku: l.itemId, name: l.name, pack: l.packLabel, packs: l.packs, quantity: l.quantity, unit: l.unit })),
    })),
  };
}
