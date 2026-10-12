import { Icon } from "./Icon";
import { STATUS_LABEL, type StockStatus } from "@/lib/stock";

const ICON = { ok: "check", low: "alert", out: "x" } as const;

/** Color, icon and words together, so status never depends on color alone. */
export function StatusChip({ status }: { status: StockStatus }) {
  return (
    <span className={`chip chip-${status}`}>
      <Icon name={ICON[status]} size={16} />
      {STATUS_LABEL[status]}
    </span>
  );
}
