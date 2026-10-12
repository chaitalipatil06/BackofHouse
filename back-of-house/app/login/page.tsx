import { redirect } from "next/navigation";
import { enterDemo } from "@/app/actions";
import { Icon } from "@/components/Icon";
import { getSession, shopName } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase/server";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  const demo = !supabaseConfigured();

  return (
    <main className="login" id="main">
      <div className="login-card">
        <div className="row">
          <span className="brand-mark"><Icon name="cup" /></span>
          <div>
            <h1 style={{ fontSize: "1.75rem" }}>Back of House</h1>
            <p className="muted">{shopName()}</p>
          </div>
        </div>

        {demo ? (
          <>
            <p>This is a demo with a sample café. Choose who you want to be. Nothing you do here is permanent.</p>
            <form action={enterDemo} className="stack">
              <button className="role-option" name="role" value="manager" type="submit">
                <span className="avatar" style={{ background: "var(--berry-soft)" }}>MO</span>
                <span><strong>Maya, the manager</strong><br /><span className="muted small">Can publish the menu and approve orders.</span></span>
              </button>
              <button className="role-option" name="role" value="barista" type="submit">
                <span className="avatar" style={{ background: "var(--sky)" }}>LT</span>
                <span><strong>Leo, a barista</strong><br /><span className="muted small">Can clock in, count stock and use recipes.</span></span>
              </button>
            </form>
          </>
        ) : (
          <SignInForm />
        )}
      </div>
    </main>
  );
}
