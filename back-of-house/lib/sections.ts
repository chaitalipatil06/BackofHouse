export type SectionId = "today" | "clock" | "inventory" | "reorder" | "menu" | "recipes";

export const SECTIONS: { id: SectionId; href: string; label: string; short: string; tint: string; icon: IconName }[] = [
  { id: "today", href: "/", label: "Today", short: "Today", tint: "var(--berry-soft)", icon: "home" },
  { id: "clock", href: "/clock", label: "Clock in", short: "Clock in", tint: "var(--lavender)", icon: "clock" },
  { id: "inventory", href: "/inventory", label: "Inventory", short: "Stock", tint: "var(--mint)", icon: "box" },
  { id: "reorder", href: "/reorder", label: "Reorder", short: "Reorder", tint: "var(--peach)", icon: "cart" },
  { id: "menu", href: "/menu", label: "Daily menu", short: "Menu", tint: "var(--butter)", icon: "cup" },
  { id: "recipes", href: "/recipes", label: "Recipes", short: "Recipes", tint: "var(--sky)", icon: "book" },
];

export type IconName =
  | "home" | "clock" | "box" | "cart" | "cup" | "book" | "check" | "alert" | "x" | "info"
  | "timer" | "plus" | "minus" | "copy" | "sun" | "cloud" | "rain" | "snow" | "spark" | "leaf" | "bolt" | "arrow";
