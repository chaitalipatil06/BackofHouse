"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { resetDemo } from "@/lib/store/demo";
import { DEMO_COOKIE, requireManager, requireSession } from "@/lib/session";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import type { Forecast, OrderLine } from "@/lib/types";

// ---- sign in / out ----

export async function enterDemo(formData: FormData) {
  const role = formData.get("role") === "barista" ? "barista" : "manager";
  (await cookies()).set(DEMO_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  redirect("/");
}

export type SignInState = { error?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Check them and try again." };
  redirect("/");
}

export async function signOut() {
  if (supabaseConfigured()) await (await supabaseServer()).auth.signOut();
  else (await cookies()).delete(DEMO_COOKIE);
  redirect("/login");
}

export async function resetDemoData() {
  if (supabaseConfigured()) return;
  resetDemo();
  revalidatePath("/", "layout");
}

// ---- clock in ----

export async function clockToggle(staffId: string, pin: string) {
  // Clocking in happens on a shared counter device, so any signed-in session may do it;
  // the PIN identifies the person.
  await requireSession();
  if (!/^\d{4}$/.test(pin)) return { ok: false, message: "Your PIN is 4 numbers." };
  const result = await store().clock(staffId, pin);
  revalidatePath("/", "layout");
  return result;
}

// ---- inventory ----

export async function setQuantity(itemId: string, quantity: number) {
  await requireSession();
  if (!Number.isFinite(quantity) || quantity < 0) return { ok: false };
  await store().setQuantity(itemId, quantity);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- recipes ----

export async function recordMade(menuItemId: string, size: 12 | 16) {
  await requireSession();
  await store().recordMade(menuItemId, size === 16 ? 16 : 12);
  revalidatePath("/", "layout");
}

// ---- menu ----

export async function publishMenu(itemIds: string[], specialId: string | null, forecast: Forecast) {
  const session = await requireManager();
  await store().publishMenu({ itemIds, specialId, forecast, publishedBy: session.name });
  revalidatePath("/", "layout");
}

// ---- reorder ----

export async function approveOrder(picks: { itemId: string; packs: number }[]) {
  const session = await requireManager();
  // Rebuild every line from the inventory on the server, so only item ids and pack counts come from the browser.
  const inventory = await store().listInventory();
  const clean: OrderLine[] = picks
    .map((p) => ({ item: inventory.find((i) => i.id === p.itemId), packs: Math.floor(p.packs) }))
    .filter((p) => p.item && p.packs > 0 && p.packs <= 99)
    .map(({ item, packs }) => ({
      itemId: item!.id, name: item!.name, supplier: item!.supplier, packs,
      packLabel: item!.packLabel, quantity: packs * item!.packSize, unit: item!.unit,
    }));
  if (!clean.length) throw new Error("Add at least one item to the order.");
  const order = await store().createOrder(clean, session.name);
  revalidatePath("/reorder");
  return order;
}
