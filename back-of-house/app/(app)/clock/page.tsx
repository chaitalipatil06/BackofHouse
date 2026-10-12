import { PageHeader } from "@/components/PageHeader";
import { requireSession } from "@/lib/session";
import { store } from "@/lib/store";
import { ClockPad } from "./ClockPad";

export const metadata = { title: "Clock in" };

export default async function ClockPage() {
  const session = await requireSession();
  const [staff, events] = await Promise.all([store().listStaff(), store().listShiftEvents()]);
  return (
    <>
      <PageHeader section="clock" title="Clock in or out" help="Tap your name, then type your 4-number PIN. The same steps clock you out at the end of your shift." />
      <div className="page-body">
        {session.mode === "demo" && (
          <p className="note">In the demo, the PINs are 1111 for Maya, 2222 for Leo, 3333 for Priya and 4444 for Sam.</p>
        )}
        <ClockPad staff={staff} />
        <section className="card" aria-labelledby="log-title">
          <h2 id="log-title" style={{ marginBottom: 12 }}>Today's sign-ins</h2>
          {events.length ? (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Clock-ins and clock-outs today, newest first</caption>
                <thead><tr><th scope="col">Time</th><th scope="col">Who</th><th scope="col">What</th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="num">{new Date(e.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</td>
                      <td>{e.staffName}</td>
                      <td>{e.kind === "in" ? "Clocked in" : "Clocked out"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty"><h3>No one has clocked in yet</h3><p>The first sign-in of the day shows up here.</p></div>
          )}
        </section>
      </div>
    </>
  );
}
