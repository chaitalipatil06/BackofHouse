import { signOut, resetDemoData } from "@/app/actions";
import { Icon } from "@/components/Icon";
import { SideNav, TabBar } from "@/components/Nav";
import { requireSession, shopName } from "@/lib/session";
import { stockStatus } from "@/lib/stock";
import { store } from "@/lib/store";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const lowCount = (await store().listInventory()).filter((i) => stockStatus(i) !== "ok").length;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="shell">
        <aside className="sidebar" aria-label="Main">
          <div className="brand">
            <span className="brand-mark"><Icon name="cup" /></span>
            <span>
              <span className="brand-name">Back of House</span>
              <br />
              <span className="brand-shop">{shopName()}</span>
            </span>
          </div>
          <nav aria-label="App sections"><SideNav lowCount={lowCount} /></nav>
          <div className="sidebar-foot">
            <p className="who">
              <strong>{session.name}</strong>
              <span className="muted">{session.role === "manager" ? "Manager" : "Barista"}{session.mode === "demo" ? " · demo" : ""}</span>
            </p>
            <form action={signOut}><button className="btn btn-block" type="submit">Sign out</button></form>
            {session.mode === "demo" && (
              <form action={resetDemoData}><button className="btn btn-quiet btn-block" type="submit">Reset demo data</button></form>
            )}
          </div>
        </aside>
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      <TabBar lowCount={lowCount} />
    </>
  );
}
