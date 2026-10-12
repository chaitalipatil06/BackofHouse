import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import { WelcomeCard } from "@/components/WelcomeCard";
import { requireSession } from "@/lib/session";
import { formatAmount, stockStatus } from "@/lib/stock";
import { store } from "@/lib/store";
import { getForecast } from "@/lib/weather";

export const metadata = { title: "Today" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function TodayPage() {
  const session = await requireSession();
  const s = store();
  const [staff, inventory, published, menuItems, forecast] = await Promise.all([
    s.listStaff(), s.listInventory(), s.getPublishedMenu(), s.listMenuItems(), getForecast(),
  ]);
  const onShift = staff.filter((p) => p.onShiftSince);
  const low = inventory.filter((i) => stockStatus(i) !== "ok").sort((a, b) => a.quantity / a.par - b.quantity / b.par);
  const firstName = session.name.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const liveItems = published ? menuItems.filter((m) => published.itemIds.includes(m.id)) : [];

  return (
    <>
      <PageHeader section="today" title={`${greeting()}, ${firstName}`} help={`${dateLabel}. Here's what needs you before the doors open.`} />
      <div className="page-body">
        <WelcomeCard firstName={firstName} />

        <section className="grid grid-3" aria-label="At a glance">
          <Link href="/clock" className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="stat-label">On shift</p>
            <p className="stat-value num">{onShift.length} <span className="muted" style={{ fontSize: "1.125rem" }}>of {staff.length}</span></p>
            <p className="muted small">{onShift.map((p) => p.name.split(" ")[0]).join(", ") || "Nobody has clocked in yet."}</p>
          </Link>
          <Link href="/reorder" className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="stat-label">Running low</p>
            <p className="stat-value num">{low.length}</p>
            <p className="muted small">{low.length ? "items are under their reorder level." : "Everything is well stocked."}</p>
          </Link>
          <Link href="/menu" className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <p className="stat-label">Today's weather</p>
            <p className="stat-value num">{forecast.tempF}°F</p>
            <p className="muted small">{forecast.label}{forecast.source === "sample" ? " (sample forecast)" : ""}</p>
          </Link>
        </section>

        <div className="grid grid-2">
          <section className="card" aria-labelledby="low-title">
            <div className="card-head">
              <h2 id="low-title">Needs ordering</h2>
              {low.length > 0 && <Link className="btn" href="/reorder">Make the order list</Link>}
            </div>
            {low.length ? (
              <ul className="list">
                {low.slice(0, 6).map((i) => (
                  <li key={i.id}>
                    <div className="grow">
                      <p className="title">{i.name}</p>
                      <p className="muted small">{formatAmount(i, i.quantity)} left</p>
                    </div>
                    <StatusChip status={stockStatus(i)} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty"><h3>All stocked up</h3><p>Nothing is under its reorder level.</p></div>
            )}
          </section>

          <section className="card" aria-labelledby="menu-title">
            <div className="card-head">
              <h2 id="menu-title">Today's menu</h2>
              <Link className="btn" href="/menu">{published ? "Change menu" : "Build the menu"}</Link>
            </div>
            {published ? (
              <>
                <p className="chip chip-ok" style={{ marginBottom: 12 }}><Icon name="check" size={16} />Published</p>
                <ul className="list">
                  {liveItems.map((m) => (
                    <li key={m.id}>
                      <span className="grow">{m.name}{m.id === published.specialId ? " · drink of the day" : ""}</span>
                      <span className="num">${m.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty">
                <h3>No menu yet today</h3>
                <p>We'll suggest one from the weather and what's in stock. It takes a minute.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
