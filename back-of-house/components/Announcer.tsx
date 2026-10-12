"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const Ctx = createContext<(message: string) => void>(() => {});

/** Shows a short toast and reads it out to screen readers through a polite live region. */
export function Announcer({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback((text: string) => {
    setMessage("");
    // A tick later, so repeating the same message is still announced.
    requestAnimationFrame(() => setMessage(text));
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 4000);
  }, []);

  return (
    <Ctx.Provider value={announce}>
      {children}
      <div className="visually-hidden" role="status" aria-live="polite">{message}</div>
      {visible && message && <div className="toast" aria-hidden="true">{message}</div>}
    </Ctx.Provider>
  );
}

export const useAnnounce = () => useContext(Ctx);
