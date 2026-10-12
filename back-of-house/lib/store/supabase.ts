import { supabaseServer } from "../supabase/server";
import type { InventoryItem, MenuItem, Order, PublishedMenu, ShiftEvent, Staff } from "../types";
import type { Store } from "./types";

// Row shapes match supabase/migrations/0001_init.sql.
type InventoryRow = {
  id: string; name: string; category: InventoryItem["category"]; unit: InventoryItem["unit"];
  quantity: number; reorder_at: number; par: number; pack_size: number; pack_label: string; supplier: string;
};

const toItem = (r: InventoryRow): InventoryItem => ({
  id: r.id, name: r.name, category: r.category, unit: r.unit, quantity: Number(r.quantity),
  reorderAt: Number(r.reorder_at), par: Number(r.par), packSize: Number(r.pack_size), packLabel: r.pack_label, supplier: r.supplier,
});

const today = () => new Date().toLocaleDateString("en-CA");

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export const supabaseStore: Store = {
  async listStaff() {
    const db = await supabaseServer();
    const rows = check(await db.from("staff_on_shift").select("id, name, role, on_shift_since").order("name"));
    return (rows ?? []).map((r: { id: string; name: string; role: Staff["role"]; on_shift_since: string | null }) => ({
      id: r.id, name: r.name, role: r.role, onShiftSince: r.on_shift_since,
    }));
  },

  async clock(staffId, pin) {
    const db = await supabaseServer();
    // clock_toggle checks the PIN hash inside the database, so PINs never leave Postgres.
    const res = await db.rpc("clock_toggle", { p_staff_id: staffId, p_pin: pin });
    if (res.error) return { ok: false, message: "Something went wrong. Please try again." };
    const row = (res.data as { ok: boolean; message: string }[])[0];
    return row ?? { ok: false, message: "Something went wrong. Please try again." };
  },

  async listShiftEvents() {
    const db = await supabaseServer();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const rows = check(
      await db.from("shift_events").select("id, kind, at, staff(name)").gte("at", start.toISOString()).order("at", { ascending: false }),
    ) as unknown as { id: string; kind: "in" | "out"; at: string; staff: { name: string } | null }[];
    return rows.map((r): ShiftEvent => ({ id: r.id, kind: r.kind, at: r.at, staffName: r.staff?.name ?? "Unknown" }));
  },

  async listInventory() {
    const db = await supabaseServer();
    return (check(await db.from("inventory_items").select("*").order("category").order("name")) as InventoryRow[]).map(toItem);
  },

  async setQuantity(itemId, quantity) {
    const db = await supabaseServer();
    check(await db.from("inventory_items").update({ quantity: Math.max(0, quantity) }).eq("id", itemId));
  },

  async listMenuItems() {
    const db = await supabaseServer();
    const rows = check(
      await db
        .from("menu_items")
        .select("*, recipe_ingredients(inventory_item_id, amount), recipe_steps(position, instruction, seconds, tip)")
        .order("name"),
    ) as any[];
    return rows.map(
      (r): MenuItem => ({
        id: r.id, name: r.name, category: r.category, temp: r.temp, price: Number(r.price),
        sugarFree: r.sugar_free, dairyFree: r.dairy_free, caffeine: r.caffeine, comfort: r.comfort,
        uses: Object.fromEntries(r.recipe_ingredients.map((i: any) => [i.inventory_item_id, Number(i.amount)])),
        steps: r.recipe_steps
          .sort((a: any, b: any) => a.position - b.position)
          .map((s: any) => ({ text: s.instruction, seconds: s.seconds ?? undefined, tip: s.tip ?? undefined })),
      }),
    );
  },

  async recordMade(menuItemId, size) {
    const db = await supabaseServer();
    check(await db.rpc("record_made", { p_menu_item_id: menuItemId, p_size: size }));
  },

  async getPublishedMenu() {
    const db = await supabaseServer();
    const row = check(
      await db.from("published_menus").select("*").eq("menu_date", today()).order("published_at", { ascending: false }).limit(1).maybeSingle(),
    ) as any;
    return row
      ? { date: row.menu_date, itemIds: row.item_ids, specialId: row.special_id, forecast: row.forecast, publishedAt: row.published_at, publishedBy: row.published_by_name }
      : null;
  },

  async publishMenu({ itemIds, specialId, forecast, publishedBy }) {
    const db = await supabaseServer();
    const row = check(
      await db
        .from("published_menus")
        .insert({ menu_date: today(), item_ids: itemIds, special_id: specialId, forecast, published_by_name: publishedBy })
        .select("*")
        .single(),
    ) as any;
    return { date: row.menu_date, itemIds: row.item_ids, specialId: row.special_id, forecast: row.forecast, publishedAt: row.published_at, publishedBy } satisfies PublishedMenu;
  },

  async createOrder(lines, createdBy) {
    const db = await supabaseServer();
    const row = check(await db.from("orders").insert({ lines, created_by_name: createdBy }).select("*").single()) as any;
    return { id: row.id, createdAt: row.created_at, createdBy, lines: row.lines } satisfies Order;
  },

  async listOrders(limit = 5) {
    const db = await supabaseServer();
    const rows = check(await db.from("orders").select("*").order("created_at", { ascending: false }).limit(limit)) as any[];
    return rows.map((r): Order => ({ id: r.id, createdAt: r.created_at, createdBy: r.created_by_name, lines: r.lines }));
  },
};
