import { describe, expect, it } from "vitest";
import { MIN_SERVINGS, SAMPLE_FORECASTS, suggestMenu } from "@/lib/menu-engine";
import { SEED_INVENTORY, SEED_MENU } from "@/lib/seed";
import type { InventoryItem } from "@/lib/types";

const inv = () => structuredClone(SEED_INVENTORY) as InventoryItem[];
const on = (r: ReturnType<typeof suggestMenu>) => r.suggestions.filter((s) => s.on).map((s) => s.id);
const item = (id: string) => SEED_MENU.find((m) => m.id === id)!;

describe("suggestMenu", () => {
  it("leads with cold drinks on a hot day", () => {
    const r = suggestMenu(SEED_MENU, inv(), SAMPLE_FORECASTS.hot);
    const drinks = r.suggestions.filter((s) => item(s.id).category !== "Food" && s.on);
    expect(item(drinks[0].id).temp).toBe("iced");
  });

  it("puts cosy drinks and soup on when it rains", () => {
    const ids = on(suggestMenu(SEED_MENU, inv(), SAMPLE_FORECASTS.rainy));
    expect(ids).toContain("chai");
    expect(ids).toContain("f-soup");
  });

  it("keeps anything we can't make enough of off the menu", () => {
    const stock = inv();
    stock.find((i) => i.id === "coldbrew")!.quantity = 120 * (MIN_SERVINGS - 1);
    const r = suggestMenu(SEED_MENU, stock, SAMPLE_FORECASTS.hot);
    const cb = r.suggestions.find((s) => s.id === "cold-brew")!;
    expect(cb.blocked).toBe(true);
    expect(cb.on).toBe(false);
  });

  it("always keeps a sugar-free drink and an energy drink when stock allows", () => {
    for (const f of Object.values(SAMPLE_FORECASTS)) {
      const ids = on(suggestMenu(SEED_MENU, inv(), f)).map(item);
      expect(ids.some((m) => m.sugarFree && m.category !== "Food")).toBe(true);
      expect(ids.some((m) => m.category === "Energy")).toBe(true);
    }
  });

  it("never fills more than the drink and food slots", () => {
    const r = suggestMenu(SEED_MENU, inv(), SAMPLE_FORECASTS.mild);
    const ids = on(r).map(item);
    expect(ids.filter((m) => m.category !== "Food").length).toBeLessThanOrEqual(8);
    expect(ids.filter((m) => m.category === "Food").length).toBeLessThanOrEqual(4);
  });

  it("picks a drink of the day that is on the menu", () => {
    const r = suggestMenu(SEED_MENU, inv(), SAMPLE_FORECASTS.warm);
    expect(r.specialId).not.toBeNull();
    expect(on(r)).toContain(r.specialId);
  });
});
