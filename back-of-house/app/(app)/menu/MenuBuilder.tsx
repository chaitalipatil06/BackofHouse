"use client";

import { useState, useTransition } from "react";
import { publishMenu } from "@/app/actions";
import { useAnnounce } from "@/components/Announcer";
import { DietTags } from "@/components/DietTags";
import { Icon } from "@/components/Icon";
import type { MenuSuggestion } from "@/lib/menu-engine";
import type { Forecast, MenuItem, PublishedMenu } from "@/lib/types";

type Props = { items: MenuItem[]; initial: MenuSuggestion; forecast: Forecast; published: PublishedMenu | null; isManager: boolean };

const GROUPS: { title: string; test: (m: MenuItem) => boolean }[] = [
  { title: "Coffee", test: (m) => m.category === "Coffee" },
  { title: "Tea", test: (m) => m.category === "Tea" },
  { title: "Energy drinks", test: (m) => m.category === "Energy" },
  { title: "Food", test: (m) => m.category === "Food" },
];

export function MenuBuilder({ items, initial, forecast, published, isManager }: Props) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(initial.suggestions.map((s) => [s.id, s.on])));
  const [special, setSpecial] = useState<string | null>(initial.specialId);
  const [pending, start] = useTransition();
  const announce = useAnnounce();
  const byId = new Map(items.map((m) => [m.id, m]));
  const info = new Map(initial.suggestions.map((s) => [s.id, s]));
  const selected = initial.suggestions.filter((s) => on[s.id]).map((s) => byId.get(s.id)!);
  const sugarFreeCount = selected.filter((m) => m.sugarFree && m.category !== "Food").length;

  const toggle = (id: string) => {
    const next = !on[id];
    setOn((o) => ({ ...o, [id]: next }));
    if (!next && special === id) setSpecial(null);
  };

  const publish = () =>
    start(async () => {
      await publishMenu(selected.map((m) => m.id), special && on[special] ? special : null, forecast);
      announce("Menu published. The website and menu board now show it.");
    });

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="stack">
        {GROUPS.map((g) => {
          const list = initial.suggestions.map((s) => byId.get(s.id)!).filter(g.test);
          if (!list.length) return null;
          const gid = g.title.replace(/\W/g, "");
          return (
            <section key={g.title} className="card" aria-labelledby={`g-${gid}`}>
              <h2 id={`g-${gid}`} style={{ marginBottom: 4 }}>{g.title}</h2>
              <ul className="list">
                {list.map((m) => {
                  const s = info.get(m.id)!;
                  const labelId = `m-${m.id}`;
                  return (
                    <li key={m.id} style={{ alignItems: "flex-start" }}>
                      <button
                        type="button"
                        role="switch"
                        className="switch"
                        aria-checked={!!on[m.id]}
                        aria-labelledby={labelId}
                        aria-describedby={`${labelId}-why`}
                        disabled={s.blocked || !isManager}
                        onClick={() => toggle(m.id)}
                        style={{ marginTop: 2 }}
                      />
                      <div className="grow">
                        <p className="title" id={labelId}>{m.name}</p>
                        <p className="muted small" id={`${labelId}-why`}>{s.blocked ? `Off today: only enough stock for about ${s.servings}.` : s.reasons.join(". ") || "A steady seller."}</p>
                        <div style={{ marginTop: 6 }}><DietTags item={m} /></div>
                      </div>
                      {m.category !== "Food" && on[m.id] && isManager && (
                        special === m.id
                          ? <span className="chip chip-plain"><Icon name="spark" size={15} />Drink of the day</span>
                          : <button type="button" className="btn btn-quiet" onClick={() => setSpecial(m.id)} aria-label={`Make ${m.name} the drink of the day`}>Feature</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="stack" style={{ position: "sticky", top: 16 }}>
        <section className="menu-preview" aria-labelledby="preview-title">
          <p className="small" style={{ fontWeight: 700 }}>{published ? `Published at ${new Date(published.publishedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "Preview"}</p>
          <h2 id="preview-title" style={{ fontSize: "1.75rem", margin: "4px 0 12px" }}>Today at the café</h2>
          {selected.length === 0 ? (
            <p>Switch on at least one item to build the menu.</p>
          ) : (
            GROUPS.map((g) => {
              const list = selected.filter(g.test);
              if (!list.length) return null;
              return (
                <div key={g.title} style={{ marginBottom: 12 }}>
                  <h3 className="small" style={{ fontFamily: "inherit", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{g.title}</h3>
                  {list.map((m) => (
                    <div key={m.id} className={`menu-line ${m.id === special ? "special" : ""}`}>
                      <span>
                        {m.name}
                        {m.sugarFree && m.category !== "Food" && <span className="muted small"> · sugar-free</span>}
                        {m.id === special && <strong className="small"> · drink of the day</strong>}
                      </span>
                      <span className="num">${m.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </section>
        {sugarFreeCount === 0 && selected.length > 0 && (
          <p className="note"><Icon name="info" />There's no sugar-free drink on the menu. Some guests need one, so consider adding one.</p>
        )}
        {isManager ? (
          <button type="button" className="btn btn-primary btn-block" onClick={publish} disabled={pending || selected.length === 0}>
            {pending ? "Publishing…" : published ? "Publish changes" : "Publish menu"}
          </button>
        ) : (
          <p className="note"><Icon name="info" />A manager publishes the menu. You can look through today's suggestions here.</p>
        )}
      </div>
    </div>
  );
}
