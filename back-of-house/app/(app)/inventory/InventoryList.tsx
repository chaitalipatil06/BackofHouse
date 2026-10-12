"use client";

import { useMemo, useState, useTransition } from "react";
import { setQuantity } from "@/app/actions";
import { useAnnounce } from "@/components/Announcer";
import { Icon } from "@/components/Icon";
import { StatusChip } from "@/components/StatusChip";
import { displayUnit, formatAmount, stepFor, stockStatus, toDisplay } from "@/lib/stock";
import type { InventoryItem } from "@/lib/types";

type Filter = "all" | "low";

export function InventoryList({ items }: { items: InventoryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [local, setLocal] = useState<Record<string, number>>({});
  const [, start] = useTransition();
  const announce = useAnnounce();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((i) => ({ ...i, quantity: local[i.id] ?? i.quantity }))
      .filter((i) => (filter === "low" ? stockStatus(i) !== "ok" : true))
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, local, filter, query]);

  const lowCount = items.filter((i) => stockStatus({ ...i, quantity: local[i.id] ?? i.quantity }) !== "ok").length;

  const save = (item: InventoryItem, base: number) => {
    const qty = Math.max(0, Math.round(base * 100) / 100);
    const before = stockStatus(item);
    const after = stockStatus({ ...item, quantity: qty });
    setLocal((l) => ({ ...l, [item.id]: qty }));
    start(async () => {
      await setQuantity(item.id, qty);
      if (after !== "ok" && before === "ok") announce(`${item.name} is now running low. It's been added to the reorder list.`);
      else announce(`${item.name} saved: ${formatAmount(item, qty)}.`);
    });
  };

  const groups = [...new Set(rows.map((r) => r.category))];

  return (
    <div className="stack">
      <div className="spread">
        <fieldset className="choices">
          <legend className="visually-hidden">Show</legend>
          <label className="choice"><input type="radio" name="filter" checked={filter === "all"} onChange={() => setFilter("all")} /><span>Everything</span></label>
          <label className="choice"><input type="radio" name="filter" checked={filter === "low"} onChange={() => setFilter("low")} /><span>Running low ({lowCount})</span></label>
        </fieldset>
        <div className="field" style={{ minWidth: 0, flex: "0 1 320px" }}>
          <label htmlFor="inv-search" className="visually-hidden">Search stock</label>
          <input id="inv-search" className="input" type="search" placeholder="Search, like “milk”" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {rows.length === 0 && (
        <div className="card empty">
          <h3>Nothing matches</h3>
          <p>{filter === "low" ? "Nothing is running low. Nice work!" : "Try a different word, or clear the search."}</p>
        </div>
      )}

      {groups.map((cat) => (
        <section key={cat} className="card" aria-labelledby={`cat-${cat}`}>
          <h2 id={`cat-${cat}`} style={{ marginBottom: 4 }}>{cat}</h2>
          <ul className="list">
            {rows.filter((r) => r.category === cat).map((item) => {
              const unit = displayUnit(item);
              const step = stepFor(item);
              const inputId = `qty-${item.id}`;
              return (
                <li key={item.id} style={{ flexWrap: "wrap" }}>
                  <div className="grow" style={{ flexBasis: 220 }}>
                    <label htmlFor={inputId} className="title" style={{ display: "block" }}>{item.name}</label>
                    <p className="muted small" id={`${inputId}-help`}>Reorder below {formatAmount(item, item.reorderAt)} · full is {formatAmount(item, item.par)}</p>
                  </div>
                  <div className="stepper">
                    <button type="button" className="btn icon-btn" onClick={() => save(item, item.quantity - step)} aria-label={`Remove ${toDisplay(item, step)} ${unit.label} of ${item.name}`}><Icon name="minus" /></button>
                    <input
                      key={item.quantity}
                      id={inputId}
                      className="input"
                      inputMode="decimal"
                      defaultValue={toDisplay(item, item.quantity)}
                      aria-describedby={`${inputId}-help`}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v) && v * unit.factor !== item.quantity) save(item, v * unit.factor);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="unit">{unit.label}</span>
                    <button type="button" className="btn icon-btn" onClick={() => save(item, item.quantity + step)} aria-label={`Add ${toDisplay(item, step)} ${unit.label} of ${item.name}`}><Icon name="plus" /></button>
                  </div>
                  <StatusChip status={stockStatus(item)} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
