import { describe, expect, it } from "vitest";
import { buildReorder, museMessage, orderJson } from "@/lib/reorder";
import { SEED_INVENTORY } from "@/lib/seed";

describe("buildReorder", () => {
  const lines = buildReorder(SEED_INVENTORY);

  it("lists only items under their reorder level", () => {
    const ids = lines.map((l) => l.itemId).sort();
    const expected = SEED_INVENTORY.filter((i) => i.quantity < i.reorderAt).map((i) => i.id).sort();
    expect(ids).toEqual(expected);
  });

  it("orders whole packs that bring the item back to at least par", () => {
    const milk = lines.find((l) => l.itemId === "milk")!;
    // 9 L on hand, 30 L par, 4 L jugs: 21 L short → 6 jugs.
    expect(milk.packs).toBe(6);
    expect(milk.onHand + milk.quantity).toBeGreaterThanOrEqual(milk.par);
  });

  it("writes a Muse message grouped by supplier that asks for approval", () => {
    const msg = museMessage(lines, "Little Bloom Café");
    expect(msg).toContain("Hi Muse");
    expect(msg).toContain("check with me before");
    expect(msg).toContain("Valley Dairy Co.");
    expect(msg).toMatch(/Whole milk: 6 × 4 L jug \(24 L\)/);
  });

  it("skips lines set to zero packs", () => {
    const json = orderJson(lines.map((l) => (l.itemId === "milk" ? { ...l, packs: 0 } : l)), "Shop", "Maya");
    const names = json.orders.flatMap((o) => o.items.map((i) => i.sku));
    expect(names).not.toContain("milk");
  });
});
