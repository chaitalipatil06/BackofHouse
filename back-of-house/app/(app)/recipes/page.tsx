import Link from "next/link";
import { DietTags } from "@/components/DietTags";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { servingsLeft } from "@/lib/stock";
import { store } from "@/lib/store";

export const metadata = { title: "Recipes" };

const ORDER = ["Coffee", "Tea", "Energy", "Food"] as const;
const TITLE = { Coffee: "Coffee", Tea: "Tea", Energy: "Energy drinks", Food: "Food" };

export default async function RecipesPage() {
  const [items, inventory] = await Promise.all([store().listMenuItems(), store().listInventory()]);
  return (
    <>
      <PageHeader section="recipes" title="Recipes" help="Every drink, step by step. New to the bar? Open one and choose “Practice step by step”." />
      <div className="page-body">
        {ORDER.map((cat) => {
          const list = items.filter((i) => i.category === cat);
          if (!list.length) return null;
          return (
            <section key={cat} aria-labelledby={`r-${cat}`} className="stack">
              <h2 id={`r-${cat}`}>{TITLE[cat]}</h2>
              <ul className="recipe-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {list.map((m) => {
                  const left = servingsLeft(m, inventory);
                  return (
                    <li key={m.id}>
                      <Link href={`/recipes/${m.id}`} className="recipe-card">
                        <span className="spread">
                          <strong style={{ fontSize: "1.0625rem" }}>{m.name}</strong>
                          <Icon name="arrow" size={18} />
                        </span>
                        <span className="muted small">{m.steps.length} steps · {m.temp === "iced" ? "served cold" : m.temp === "hot" ? "served hot" : "ready to serve"} · enough stock for {left}</span>
                        <DietTags item={m} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
