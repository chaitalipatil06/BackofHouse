"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const KEY = "boh-welcome-dismissed";

/** A short "start here" for someone's first visit. Remembered per device. */
export function WelcomeCard({ firstName }: { firstName: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;

  const hide = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  };

  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div className="spread">
        <h2 id="welcome-title">New here, {firstName}? Start with these three things.</h2>
        <button type="button" className="btn btn-quiet" onClick={hide}>Got it, hide this</button>
      </div>
      <ol className="checklist">
        <li><Link href="/clock"><span className="avatar" style={{ ["--tint" as string]: "var(--card)", background: "var(--lavender)" }}><Icon name="clock" /></span>Clock in with your PIN</Link></li>
        <li><Link href="/recipes"><span className="avatar" style={{ background: "var(--sky)" }}><Icon name="book" /></span>Practice a drink in training mode</Link></li>
        <li><Link href="/inventory"><span className="avatar" style={{ background: "var(--mint)" }}><Icon name="box" /></span>Learn how to count stock</Link></li>
      </ol>
    </section>
  );
}
