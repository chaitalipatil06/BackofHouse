import type { Forecast, InventoryItem, MenuItem } from "./types";
import { servingsLeft } from "./stock";

/** Don't offer anything we can't make at least this many of. */
export const MIN_SERVINGS = 12;
export const DRINK_SLOTS = 8;
export const FOOD_SLOTS = 4;

export type Suggestion = {
  id: string;
  on: boolean;
  /** True when stock is too low to offer it today. */
  blocked: boolean;
  servings: number;
  score: number;
  reasons: string[];
};

export type MenuSuggestion = {
  suggestions: Suggestion[];
  specialId: string | null;
};

export function scoreItem(item: MenuItem, forecast: Forecast, inventory: InventoryItem[]) {
  const t = forecast.tempF;
  const reasons: string[] = [];
  let score = 0;

  if (item.temp === "iced") {
    score += (t - 62) / 8;
    if (t >= 75) reasons.push(`Cold drinks sell well at ${t}°F`);
  } else if (item.temp === "hot") {
    score += (70 - t) / 8;
    if (t <= 60) reasons.push(`Warm drinks sell well at ${t}°F`);
  } else {
    score += 1;
  }

  if (item.category === "Energy") {
    score += 0.6;
    if (t >= 75) reasons.push("Energy drinks pick up on hot afternoons");
  }

  if (item.comfort && (forecast.rainy || t < 55)) {
    score += 1.5;
    reasons.push(forecast.rainy ? "A cosy pick for rain" : "A cosy pick for the cold");
  }

  // Gently favour things that use well-stocked ingredients, so they don't go to waste.
  const byId = new Map(inventory.map((i) => [i.id, i]));
  const plentiful = Object.keys(item.uses)
    .map((id) => byId.get(id))
    .filter((i): i is InventoryItem => !!i && i.quantity / i.par >= 0.7);
  score += 0.3 * plentiful.length;

  const servings = servingsLeft(item, inventory);
  if (servings < MIN_SERVINGS) reasons.push(`Only enough stock for about ${servings}`);
  else if (servings < 25) reasons.push(`Stock for about ${servings}`);

  return { score, reasons, servings, plentiful: plentiful.length > 0 };
}

/**
 * Suggest today's menu from the forecast and current stock.
 * Rules, in order:
 * 1. Anything we can make fewer than MIN_SERVINGS of stays off.
 * 2. Highest-scoring drinks and food fill the slots.
 * 3. Variety: if any sugar-free drink or any energy drink can be made, at least one is on.
 * 4. The drink of the day is the top drink that uses plentiful stock.
 */
export function suggestMenu(items: MenuItem[], inventory: InventoryItem[], forecast: Forecast): MenuSuggestion {
  const scored = items.map((item) => ({ item, ...scoreItem(item, forecast, inventory) }));
  const pick = (list: typeof scored, slots: number) =>
    list
      .slice()
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map((s) => ({ ...s, blocked: s.servings < MIN_SERVINGS }))
      .map((s, _i, all) => {
        const rank = all.filter((x) => !x.blocked).indexOf(s);
        return { ...s, on: !s.blocked && rank > -1 && rank < slots };
      });

  const drinks = pick(scored.filter((s) => s.item.category !== "Food"), DRINK_SLOTS);
  const food = pick(scored.filter((s) => s.item.category === "Food"), FOOD_SLOTS);

  const ensure = (test: (m: MenuItem) => boolean, reason: string) => {
    if (drinks.some((d) => d.on && test(d.item))) return;
    const candidate = drinks.find((d) => !d.blocked && test(d.item));
    if (!candidate) return;
    // Swap out the lowest-scoring drink that isn't itself protecting variety.
    const onDrinks = drinks.filter((d) => d.on);
    const drop = onDrinks.reverse().find((d) => !d.item.sugarFree && d.item.category !== "Energy") ?? onDrinks[0];
    if (drop && onDrinks.length >= DRINK_SLOTS) drop.on = false;
    candidate.on = true;
    candidate.reasons = [reason, ...candidate.reasons];
  };
  ensure((m) => m.sugarFree && m.category !== "Food", "Keeps a sugar-free choice on the menu");
  ensure((m) => m.category === "Energy", "Keeps an energy drink on the menu");

  const special = drinks.find((d) => d.on && d.plentiful) ?? drinks.find((d) => d.on);

  const suggestions: Suggestion[] = [...drinks, ...food].map((s) => ({
    id: s.item.id,
    on: s.on,
    blocked: s.blocked,
    servings: s.servings,
    score: Math.round(s.score * 100) / 100,
    reasons: s.reasons,
  }));

  return { suggestions, specialId: special?.item.id ?? null };
}

export const SAMPLE_FORECASTS: Record<string, Forecast> = {
  hot: { tempF: 96, rainy: false, label: "Hot and sunny", source: "sample" },
  warm: { tempF: 79, rainy: false, label: "Warm and clear", source: "sample" },
  mild: { tempF: 66, rainy: false, label: "Mild and cloudy", source: "sample" },
  rainy: { tempF: 54, rainy: true, label: "Cool and rainy", source: "sample" },
  cold: { tempF: 41, rainy: false, label: "Cold and clear", source: "sample" },
};
