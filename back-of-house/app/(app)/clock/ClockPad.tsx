"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { clockToggle } from "@/app/actions";
import { useAnnounce } from "@/components/Announcer";
import type { Staff } from "@/lib/types";

const ROLE = { manager: "Manager", barista: "Barista", trainee: "Trainee" } as const;
const TINTS = ["var(--lavender)", "var(--mint)", "var(--peach)", "var(--sky)"];

export function ClockPad({ staff }: { staff: Staff[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const announce = useAnnounce();
  const padRef = useRef<HTMLDivElement>(null);
  const person = staff.find((s) => s.id === selected);

  useEffect(() => {
    if (selected) padRef.current?.focus();
  }, [selected]);

  const submit = (full: string) => {
    if (!person) return;
    start(async () => {
      const res = await clockToggle(person.id, full);
      if (res.ok) {
        announce(res.message);
        setSelected(null);
        setError("");
      } else {
        setError(res.message);
      }
      setPin("");
    });
  };

  const press = (digit: string) => {
    if (pending || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) submit(next);
  };

  // Typing on a keyboard works too.
  const onKey = (e: React.KeyboardEvent) => {
    if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
    if (e.key === "Backspace") { e.preventDefault(); setPin((p) => p.slice(0, -1)); }
    if (e.key === "Escape") setSelected(null);
  };

  return (
    <div className="stack">
      <div className="people" role="group" aria-label="Choose your name">
        {staff.map((s, i) => (
          <button key={s.id} type="button" className="person" aria-pressed={selected === s.id} onClick={() => { setSelected(s.id); setPin(""); setError(""); }}>
            <span className="row">
              <span className="avatar" style={{ background: TINTS[i % TINTS.length] }} aria-hidden="true">{s.name.split(" ").map((x) => x[0]).join("")}</span>
              <span>
                <strong style={{ display: "block" }}>{s.name}</strong>
                <span className="muted small">{ROLE[s.role]}</span>
              </span>
            </span>
            <span className={`chip ${s.onShiftSince ? "chip-ok" : "chip-plain"}`}>
              {s.onShiftSince
                ? `On shift since ${new Date(s.onShiftSince).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                : "Not clocked in"}
            </span>
          </button>
        ))}
      </div>

      {person && (
        <section className="card" aria-labelledby="pin-title">
          <h2 id="pin-title">{person.onShiftSince ? "Clock out" : "Clock in"}: {person.name.split(" ")[0]}</h2>
          <p className="muted" id="pin-help">Type your 4-number PIN with the buttons or your keyboard.</p>
          <div ref={padRef} tabIndex={0} onKeyDown={onKey} aria-describedby="pin-help" aria-label={`PIN entry, ${pin.length} of 4 numbers entered`} style={{ display: "inline-block", borderRadius: 16, padding: 4 }}>
            <div className="pin-dots" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} className={pin.length > i ? "on" : ""} />)}
            </div>
            <div className="pinpad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button key={d} type="button" onClick={() => press(d)} tabIndex={-1}>{d}</button>
              ))}
              <button type="button" onClick={() => setPin("")} tabIndex={-1} aria-label="Clear">C</button>
              <button type="button" onClick={() => press("0")} tabIndex={-1}>0</button>
              <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} tabIndex={-1} aria-label="Delete last number">⌫</button>
            </div>
          </div>
          {error && <p role="alert" className="note" style={{ marginTop: 16, background: "var(--blush)", color: "var(--danger)" }}>{error}</p>}
          {pending && <p className="muted" style={{ marginTop: 12 }}>Checking…</p>}
        </section>
      )}
    </div>
  );
}
