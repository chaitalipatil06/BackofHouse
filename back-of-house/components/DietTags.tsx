import type { MenuItem } from "@/lib/types";
import { Icon } from "./Icon";

export function DietTags({ item }: { item: MenuItem }) {
  return (
    <span className="tags">
      {item.sugarFree && (
        <span className="chip chip-ok"><Icon name="leaf" size={15} />Sugar-free</span>
      )}
      {item.dairyFree && <span className="chip chip-info">Dairy-free</span>}
      {item.caffeine === "high" && (
        <span className="chip chip-low"><Icon name="bolt" size={15} />High caffeine</span>
      )}
      {item.caffeine === "none" && item.category !== "Food" && <span className="chip chip-plain">No caffeine</span>}
    </span>
  );
}
