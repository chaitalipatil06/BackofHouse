"use client";

import { useState, useTransition } from "react";
import { approveOrder } from "@/app/actions";
import { useAnnounce } from "@/components/Announcer";
import { Icon } from "@/components/Icon";
import { groupBySupplier, museMessage, orderJson, type DraftLine } from "@/lib/reorder";
import { formatAmount } from "@/lib/stock";
import type { Order } from "@/lib/types";

type Props = { lines: DraftLine[]; isManager: boolean; shopName: string; requester: string; pastOrders: Order[] };

export function ReorderBuilder({ lines, isManager, shopName, requester, pastOrders }: Props) {
  const [packs, setPacks] = useState<Record<string, number>>(() => Object.fromEntries(lines.map((l) => [l.itemId, l.suggestedPacks])));
  const [approved, setApproved] = useState<Order | null>(null);
  const [format, setFormat] = useState<"message" | "json">("message");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const announce = useAnnounce();

  if (!lines.length && !approved) {
    return (
      <div className="card empty">
        <h3>Nothing to order</h3>
        <p>Everything is above its reorder level. When something runs low, it shows up here on its own.</p>
      </div>
    );
  }

  const current = lines.map((l) => ({ ...l, packs: packs[l.itemId] ?? 0, quantity: (packs[l.itemId] ?? 0) * (l.quantity / l.suggestedPacks) }));
  const chosen = current.filter((l) => l.packs > 0);
  const handoff = approved
    ? format === "message" ? museMessage(approved.lines, shopName) : JSON.stringify(orderJson(approved.lines, shopName, requester), null, 2)
    : "";

  const approve = () => {
    setError("");
    start(async () => {
      try {
        const order = await approveOrder(chosen.map((l) => ({ itemId: l.itemId, packs: l.packs })));
        setApproved(order);
        announce("Order list approved. Copy it into Muse when you're ready.");
      } catch {
        setError("We couldn't approve the list. Check you're signed in as a manager and try again.");
      }
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(handoff);
      announce("Copied. Paste it into Muse.");
    } catch {
      const el = document.getElementById("handoff");
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); }
      announce("The text is selected. Press Control C, or Command C on a Mac, to copy it.");
    }
  };

  if (approved) {
    return (
      <section className="card" aria-labelledby="handoff-title">
        <div className="card-head">
          <div>
            <p className="chip chip-ok" style={{ marginBottom: 8 }}><Icon name="check" size={16} />Approved</p>
            <h2 id="handoff-title">Hand it to Muse</h2>
            <p className="muted" style={{ marginTop: 4, maxWidth: "60ch" }}>Copy this and paste it into Muse, in its app or on WhatsApp. Muse asks you to confirm before it buys anything.</p>
          </div>
          <fieldset className="choices">
            <legend className="visually-hidden">Format</legend>
            <label className="choice"><input type="radio" name="fmt" checked={format === "message"} onChange={() => setFormat("message")} /><span>Message</span></label>
            <label className="choice"><input type="radio" name="fmt" checked={format === "json"} onChange={() => setFormat("json")} /><span>Data (JSON)</span></label>
          </fieldset>
        </div>
        <pre id="handoff" className="handoff" tabIndex={0} aria-label="Order text">{handoff}</pre>
        <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-primary" onClick={copy}><Icon name="copy" />Copy</button>
        </div>
      </section>
    );
  }

  return (
    <div className="stack">
      {groupBySupplier(current).map(([supplier, ls]) => (
        <section key={supplier} className="card" aria-labelledby={`sup-${supplier}`}>
          <h2 id={`sup-${supplier}`} style={{ marginBottom: 4 }}>{supplier}</h2>
          <ul className="list">
            {ls.map((l) => (
              <li key={l.itemId} style={{ flexWrap: "wrap" }}>
                <div className="grow" style={{ flexBasis: 220 }}>
                  <p className="title" id={`name-${l.itemId}`}>{l.name}</p>
                  <p className="muted small">{formatAmount({ unit: l.unit, par: l.par }, l.onHand)} left · comes as {l.packLabel}</p>
                </div>
                <div className="stepper" role="group" aria-labelledby={`name-${l.itemId}`}>
                  <button type="button" className="btn icon-btn" disabled={!isManager || l.packs === 0} onClick={() => setPacks((p) => ({ ...p, [l.itemId]: Math.max(0, l.packs - 1) }))} aria-label={`One less ${l.packLabel}`}><Icon name="minus" /></button>
                  <span className="num" style={{ minWidth: 92, textAlign: "center", fontWeight: 600 }} aria-live="polite">{l.packs === 0 ? "Skip" : `${l.packs} ${l.packs === 1 ? "pack" : "packs"}`}</span>
                  <button type="button" className="btn icon-btn" disabled={!isManager || l.packs >= 99} onClick={() => setPacks((p) => ({ ...p, [l.itemId]: l.packs + 1 }))} aria-label={`One more ${l.packLabel}`}><Icon name="plus" /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {error && <p role="alert" className="note" style={{ background: "var(--blush)", color: "var(--danger)" }}>{error}</p>}

      <div className="spread">
        <p className="muted">{chosen.length} {chosen.length === 1 ? "item" : "items"} from {groupBySupplier(chosen).length} {groupBySupplier(chosen).length === 1 ? "supplier" : "suppliers"}.</p>
        {isManager ? (
          <button type="button" className="btn btn-primary" onClick={approve} disabled={pending || chosen.length === 0}>{pending ? "Approving…" : "Approve order list"}</button>
        ) : (
          <p className="note"><Icon name="info" />A manager approves the order. You can check the list and let them know it's ready.</p>
        )}
      </div>

      {pastOrders.length > 0 && (
        <section className="card" aria-labelledby="past-title">
          <h2 id="past-title" style={{ marginBottom: 4 }}>Recent orders</h2>
          <ul className="list">
            {pastOrders.map((o) => (
              <li key={o.id}>
                <span className="grow">{new Date(o.createdAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })} · {o.lines.length} items</span>
                <span className="muted small">by {o.createdBy}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
