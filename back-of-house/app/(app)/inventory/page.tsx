import { PageHeader } from "@/components/PageHeader";
import { store } from "@/lib/store";
import { InventoryList } from "./InventoryList";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const inventory = await store().listInventory();
  return (
    <>
      <PageHeader section="inventory" title="Count your stock" help="At closing, count each item and update the number. Anything that runs low goes on the reorder list for you." />
      <div className="page-body">
        <InventoryList items={inventory} />
      </div>
    </>
  );
}
