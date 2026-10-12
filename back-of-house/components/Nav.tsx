"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { Icon } from "./Icon";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function SideNav({ lowCount }: { lowCount: number }) {
  const path = usePathname();
  return (
    <ul className="nav-list">
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <Link href={s.href} className="nav-link" aria-current={isActive(path, s.href) ? "page" : undefined}>
            <span className="nav-icon" style={{ ["--tint" as string]: s.tint }}><Icon name={s.icon} /></span>
            {s.label}
            {s.id === "reorder" && lowCount > 0 && (
              <span className="nav-count"><span className="visually-hidden">, </span>{lowCount}<span className="visually-hidden"> items to order</span></span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TabBar({ lowCount }: { lowCount: number }) {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Sections">
      {SECTIONS.map((s) => (
        <Link key={s.id} href={s.href} className="tab" aria-current={isActive(path, s.href) ? "page" : undefined} style={{ ["--tint" as string]: s.tint }}>
          <span className="nav-icon"><Icon name={s.icon} /></span>
          {s.short}
          {s.id === "reorder" && lowCount > 0 && (
            <>
              <span className="tab-dot" aria-hidden="true" />
              <span className="visually-hidden">, {lowCount} items to order</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
