import { supabaseConfigured } from "../supabase/server";
import { demoStore } from "./demo";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

/** Supabase when it's configured, otherwise the in-memory demo. */
export const store = (): Store => (supabaseConfigured() ? supabaseStore : demoStore);
