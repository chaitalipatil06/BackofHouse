import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseConfigured, supabaseServer } from "./supabase/server";
import type { Role, Session } from "./types";

export const DEMO_COOKIE = "boh_demo_role";

export const DEMO_PEOPLE: Record<Role, string> = { manager: "Maya Ortiz", barista: "Leo Tran" };

export const shopName = () => process.env.NEXT_PUBLIC_SHOP_NAME || "Little Bloom Café";

export async function getSession(): Promise<Session | null> {
  if (!supabaseConfigured()) {
    const role = (await cookies()).get(DEMO_COOKIE)?.value;
    if (role !== "manager" && role !== "barista") return null;
    return { role, name: DEMO_PEOPLE[role], mode: "demo" };
  }
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await db.from("profiles").select("display_name, role").eq("user_id", data.user.id).maybeSingle();
  return {
    name: profile?.display_name ?? data.user.email ?? "Team member",
    role: profile?.role === "manager" ? "manager" : "barista",
    mode: "supabase",
  };
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireManager(): Promise<Session> {
  const s = await requireSession();
  if (s.role !== "manager") throw new Error("Only a manager can do this.");
  return s;
}
