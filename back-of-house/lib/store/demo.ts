import { SEED_INVENTORY, SEED_MENU, SEED_STAFF } from "../seed";
import { SIZE_FACTOR } from "../stock";
import type { InventoryItem, Order, PublishedMenu, ShiftEvent } from "../types";
import type { Store } from "./types";

// Demo mode keeps everything in server memory, seeded with sample data.
// It resets when the server restarts or someone taps "Reset demo data".

type DemoState = {
  inventory: InventoryItem[];
  shifts: Record<string, string | null>;
  events: ShiftEvent[];
  published: PublishedMenu | null;
  orders: Order[];
};

const today = () => new Date().toLocaleDateString("en-CA");

function at(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function fresh(): DemoState {
  const mayaIn = at(6, 2);
  const leoIn = at(6, 31);
  return {
    inventory: structuredClone(SEED_INVENTORY),
    shifts: { maya: mayaIn, leo: leoIn, priya: null, sam: null },
    events: [
      { id: "e1", staffName: "Maya Ortiz", kind: "in", at: mayaIn },
      { id: "e2", staffName: "Leo Tran", kind: "in", at: leoIn },
    ],
    published: null,
    orders: [],
  };
}

const g = globalThis as unknown as { __bohDemo?: DemoState };
const state = () => (g.__bohDemo ??= fresh());

export function resetDemo() {
  g.__bohDemo = fresh();
}

let seq = 100;
const id = (p: string) => `${p}${++seq}`;

export const demoStore: Store = {
  async listStaff() {
    return SEED_STAFF.map(({ pin: _pin, ...s }) => ({ ...s, onShiftSince: state().shifts[s.id] ?? null }));
  },

  async clock(staffId, pin) {
    const person = SEED_STAFF.find((s) => s.id === staffId);
    if (!person) return { ok: false, message: "We couldn't find that person." };
    if (person.pin !== pin) return { ok: false, message: "That PIN doesn't match. Try again or ask your manager." };
    const s = state();
    const now = new Date().toISOString();
    const first = person.name.split(" ")[0];
    if (s.shifts[staffId]) {
      const hours = (Date.now() - new Date(s.shifts[staffId]!).getTime()) / 36e5;
      s.shifts[staffId] = null;
      s.events.push({ id: id("e"), staffName: person.name, kind: "out", at: now });
      return { ok: true, message: `${first} clocked out after ${hours.toFixed(1)} hours. See you soon!` };
    }
    s.shifts[staffId] = now;
    s.events.push({ id: id("e"), staffName: person.name, kind: "in", at: now });
    return { ok: true, message: `Welcome, ${first}. You're clocked in.` };
  },

  async listShiftEvents() {
    return [...state().events].reverse();
  },

  async listInventory() {
    return structuredClone(state().inventory);
  },

  async setQuantity(itemId, quantity) {
    const item = state().inventory.find((i) => i.id === itemId);
    if (item) item.quantity = Math.max(0, Math.round(quantity * 100) / 100);
  },

  async listMenuItems() {
    return SEED_MENU;
  },

  async recordMade(menuItemId, size) {
    const item = SEED_MENU.find((m) => m.id === menuItemId);
    if (!item) return;
    const factor = item.category === "Food" ? 1 : SIZE_FACTOR[size];
    const inv = state().inventory;
    for (const [ingredient, amount] of Object.entries(item.uses)) {
      const stock = inv.find((i) => i.id === ingredient);
      if (stock) stock.quantity = Math.max(0, Math.round((stock.quantity - amount * factor) * 100) / 100);
    }
    if (item.category !== "Food") {
      const cup = inv.find((i) => i.id === `cup${size}`);
      if (cup) cup.quantity = Math.max(0, cup.quantity - 1);
    }
  },

  async getPublishedMenu() {
    const p = state().published;
    return p && p.date === today() ? p : null;
  },

  async publishMenu({ itemIds, specialId, forecast, publishedBy }) {
    const menu: PublishedMenu = { date: today(), itemIds, specialId, forecast, publishedBy, publishedAt: new Date().toISOString() };
    state().published = menu;
    return menu;
  },

  async createOrder(lines, createdBy) {
    const order: Order = { id: id("o"), createdAt: new Date().toISOString(), createdBy, lines };
    state().orders.unshift(order);
    return order;
  },

  async listOrders(limit = 5) {
    return state().orders.slice(0, limit);
  },
};
