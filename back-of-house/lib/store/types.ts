import type { Forecast, InventoryItem, MenuItem, Order, OrderLine, PublishedMenu, ShiftEvent, Staff } from "../types";

export type ClockResult = { ok: boolean; message: string };

/** Everything the app reads and writes. Demo mode and Supabase both implement it. */
export interface Store {
  listStaff(): Promise<Staff[]>;
  clock(staffId: string, pin: string): Promise<ClockResult>;
  listShiftEvents(): Promise<ShiftEvent[]>;

  listInventory(): Promise<InventoryItem[]>;
  setQuantity(itemId: string, quantity: number): Promise<void>;

  listMenuItems(): Promise<MenuItem[]>;
  recordMade(menuItemId: string, size: 12 | 16): Promise<void>;

  getPublishedMenu(): Promise<PublishedMenu | null>;
  publishMenu(input: { itemIds: string[]; specialId: string | null; forecast: Forecast; publishedBy: string }): Promise<PublishedMenu>;

  createOrder(lines: OrderLine[], createdBy: string): Promise<Order>;
  listOrders(limit?: number): Promise<Order[]>;
}
