import { PageHeader } from "@/components/PageHeader";
import { buildReorder } from "@/lib/reorder";
import { requireSession, shopName } from "@/lib/session";
import { store } from "@/lib/store";
import { ReorderBuilder } from "./ReorderBuilder";

export const metadata = { title: "Reorder" };

export default async function ReorderPage() {
  const session = await requireSession();
  const [inventory, orders] = await Promise.all([store().listInventory(), store().listOrders(3)]);
  return (
    <>
      <PageHeader section="reorder" title="Reorder list" help="We list everything under its reorder level and suggest enough to fill it back up. Check the amounts, approve, then hand the list to Muse." />
      <div className="page-body">
        <ReorderBuilder lines={buildReorder(inventory)} isManager={session.role === "manager"} shopName={shopName()} requester={session.name} pastOrders={orders} />
      </div>
    </>
  );
}
