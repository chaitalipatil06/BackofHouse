"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { recordMade } from "@/app/actions";
import { useAnnounce } from "@/components/Announcer";
import { DietTags } from "@/components/DietTags";
import { Icon } from "@/components/Icon";
import { StatusChip } from "@/components/StatusChip";
import { SIZE_FACTOR, formatRecipeAmount, servingsLeft, stockStatus } from "@/lib/stock";
import type { InventoryItem, MenuItem } from "@/lib/types";

function useTimer(onDone: () => void) {
  const [left, setLeft] = useState<number | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setLeft(null); setKey(null); done.current(); return; }
    const t = setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return {
    left, key,
    start: (k: string, s: number) => { setKey(k); setLeft(s); },
    stop: () => { setKey(null); setLeft(null); },
  };
}

function TimerButton({ id, seconds, timer }: { id: string; seconds: number; timer: ReturnType<typeof useTimer> }) {
  const running = timer.key === id;
  return (
    <button type="button" className="btn" onClick={() => (running ? timer.stop() : timer.start(id, seconds))} aria-label={running ? `Stop timer, ${timer.left} seconds left` : `Start a ${seconds} second timer`}>
      <Icon name="timer" />
      <span className="num">{running ? `${timer.left}s` : `${seconds}s`}</span>
    </button>
  );
}

export function RecipeView({ item, inventory }: { item: MenuItem; inventory: InventoryItem[] }) {
  const isDrink = item.category !== "Food";
  const [size, setSize] = useState<12 | 16>(12);
  const [training, setTraining] = useState(false);
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const announce = useAnnounce();
  const timer = useTimer(() => announce("Time's up."));
  const stepHeading = useRef<HTMLParagraphElement>(null);
  const factor = isDrink ? SIZE_FACTOR[size] : 1;
  const byId = new Map(inventory.map((i) => [i.id, i]));
  const canMake = servingsLeft(item, inventory, factor);

  useEffect(() => {
    if (training) stepHeading.current?.focus();
  }, [training, step]);

  const made = () =>
    start(async () => {
      timer.stop();
      await recordMade(item.id, size);
      setTraining(false);
      setStep(0);
      announce(`Logged one ${isDrink ? `${size} oz ` : ""}${item.name.toLowerCase()}. Stock is updated.`);
    });

  if (training) {
    const s = item.steps[step];
    const last = step === item.steps.length - 1;
    return (
      <section className="trainer" aria-labelledby="train-title">
        <div className="spread">
          <h2 id="train-title" className="small" style={{ fontFamily: "inherit", fontWeight: 700 }}>Practice: step {step + 1} of {item.steps.length}</h2>
          <button type="button" className="btn" onClick={() => { timer.stop(); setTraining(false); }}>Stop practice</button>
        </div>
        <div className="progress" aria-hidden="true" style={{ marginTop: 12 }}>
          {item.steps.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
        </div>
        <p className="big" ref={stepHeading} tabIndex={-1}>{s.text}</p>
        {s.tip && <p style={{ maxWidth: "60ch" }}><strong>Tip:</strong> {s.tip}</p>}
        <div className="spread" style={{ marginTop: 24 }}>
          <div>{s.seconds ? <TimerButton id={`t${step}`} seconds={s.seconds} timer={timer} /> : null}</div>
          <div className="row">
            <button type="button" className="btn" disabled={step === 0} onClick={() => { timer.stop(); setStep(step - 1); }}>Back</button>
            {last ? (
              <button type="button" className="btn btn-primary" onClick={made} disabled={pending || canMake < 1}>Done, log one made</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => { timer.stop(); setStep(step + 1); }}>Next step</button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <section className="card stack" aria-labelledby="ing-title">
        <div className="spread">
          <h2 id="ing-title">What you need</h2>
          {isDrink && (
            <fieldset className="choices">
              <legend className="visually-hidden">Cup size</legend>
              {([12, 16] as const).map((oz) => (
                <label key={oz} className="choice">
                  <input type="radio" name="size" checked={size === oz} onChange={() => setSize(oz)} />
                  <span>{oz} oz</span>
                </label>
              ))}
            </fieldset>
          )}
        </div>
        <DietTags item={item} />
        <ul className="list">
          {Object.entries(item.uses).map(([id, amount]) => {
            const stock = byId.get(id);
            if (!stock) return null;
            return (
              <li key={id}>
                <span className="grow">{stock.name}</span>
                <span className="num" style={{ fontWeight: 600 }}>{formatRecipeAmount(stock.unit, amount * factor)}</span>
                <StatusChip status={stockStatus(stock)} />
              </li>
            );
          })}
          {isDrink && (
            <li>
              <span className="grow">{size} oz cup</span>
              <span className="num" style={{ fontWeight: 600 }}>1</span>
              {byId.get(`cup${size}`) && <StatusChip status={stockStatus(byId.get(`cup${size}`)!)} />}
            </li>
          )}
        </ul>
        <p className="muted small">There's enough stock for about {canMake} more.</p>
      </section>

      <section className="card stack" aria-labelledby="steps-title">
        <h2 id="steps-title">How to make it</h2>
        <ol className="steps">
          {item.steps.map((s, i) => (
            <li key={i}>
              <div>
                <p>{s.text}</p>
                {s.tip && <p className="muted small" style={{ marginTop: 4 }}>{s.tip}</p>}
              </div>
              {s.seconds ? <TimerButton id={`s${i}`} seconds={s.seconds} timer={timer} /> : <span />}
            </li>
          ))}
        </ol>
        <div className="row" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          <button type="button" className="btn" onClick={() => { timer.stop(); setStep(0); setTraining(true); }}>Practice step by step</button>
          <button type="button" className="btn btn-primary" onClick={made} disabled={pending || canMake < 1}>{pending ? "Logging…" : "Log one made"}</button>
        </div>
      </section>
    </div>
  );
}
