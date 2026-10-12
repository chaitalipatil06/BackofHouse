import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { MIN_SERVINGS, SAMPLE_FORECASTS, suggestMenu } from "@/lib/menu-engine";
import { requireSession } from "@/lib/session";
import { store } from "@/lib/store";
import { getForecast } from "@/lib/weather";
import { MenuBuilder } from "./MenuBuilder";

export const metadata = { title: "Daily menu" };

const WEATHER_ICON = (rainy: boolean, t: number): "rain" | "sun" | "snow" | "cloud" => (rainy ? "rain" : t >= 75 ? "sun" : t <= 50 ? "snow" : "cloud");

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ try?: string }> }) {
  const session = await requireSession();
  const { try: tryKey } = await searchParams;
  const live = await getForecast();
  const forecast = (tryKey && SAMPLE_FORECASTS[tryKey]) || live;
  const [items, inventory, published] = await Promise.all([store().listMenuItems(), store().listInventory(), store().getPublishedMenu()]);
  let suggestion = suggestMenu(items, inventory, forecast);
  // Once today's menu is published, open on what's live rather than a fresh suggestion.
  if (published && !tryKey) {
    suggestion = {
      specialId: published.specialId,
      suggestions: suggestion.suggestions.map((s) => ({ ...s, on: published.itemIds.includes(s.id) })),
    };
  }

  return (
    <>
      <PageHeader section="menu" title="Today's menu" help={`We suggest a menu from the weather and what's in stock. Anything we can't make at least ${MIN_SERVINGS} of stays off. Switch items on or off, then publish.`} />
      <div className="page-body">
        <section className="card" aria-labelledby="wx-title">
          <div className="spread">
            <div className="row" style={{ gap: 16 }}>
              <span className="avatar" style={{ background: "var(--butter)", width: 56, height: 56 }}><Icon name={WEATHER_ICON(forecast.rainy, forecast.tempF)} size={28} /></span>
              <div>
                <h2 id="wx-title"><span className="num">{forecast.tempF}°F</span>, {forecast.label.toLowerCase()}</h2>
                <p className="muted small">
                  {tryKey ? "You're trying a pretend forecast. " : forecast.source === "live" ? "Today's forecast for the café. " : "Sample forecast. Add the café's location to use live weather. "}
                  {tryKey && <Link href="/menu">Back to today's forecast</Link>}
                </p>
              </div>
            </div>
            <nav aria-label="Try another forecast" className="row">
              <span className="muted small" style={{ fontWeight: 700 }}>Try:</span>
              {Object.entries(SAMPLE_FORECASTS).map(([key, f]) => (
                <Link key={key} href={`/menu?try=${key}`} className="chip chip-plain" aria-current={tryKey === key ? "true" : undefined} style={{ textDecoration: "none", minHeight: 36, outlineOffset: 2, ...(tryKey === key ? { background: "var(--ink)", color: "#fff" } : {}) }}>
                  {f.tempF}° {f.rainy ? "rain" : f.label.split(" ")[0].toLowerCase()}
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <MenuBuilder
          key={`${forecast.tempF}-${forecast.rainy}`}
          items={items}
          initial={suggestion}
          forecast={forecast}
          published={published}
          isManager={session.role === "manager"}
        />
      </div>
    </>
  );
}
