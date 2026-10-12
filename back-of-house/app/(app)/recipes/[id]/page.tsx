import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { store } from "@/lib/store";
import { RecipeView } from "./RecipeView";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [items, inventory] = await Promise.all([store().listMenuItems(), store().listInventory()]);
  const item = items.find((m) => m.id === id);
  if (!item) notFound();
  return (
    <>
      <PageHeader section="recipes" title={item.name} help={`$${item.price.toFixed(2)} · ${item.temp === "iced" ? "Served over ice" : item.temp === "hot" ? "Served hot" : "Ready to serve"}. Tap “Log one made” after serving, and the ingredients come out of stock for you.`}>
        <Link href="/recipes" className="btn">All recipes</Link>
      </PageHeader>
      <div className="page-body">
        <RecipeView item={item} inventory={inventory} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = (await store().listMenuItems()).find((m) => m.id === id);
  return { title: item?.name ?? "Recipe" };
}
