import { SECTIONS, type SectionId } from "@/lib/sections";
import { Icon } from "./Icon";

/** The pastel band at the top of every page: where you are, and one sentence of help. */
export function PageHeader({ section, title, help, children }: { section: SectionId; title: string; help: string; children?: React.ReactNode }) {
  const s = SECTIONS.find((x) => x.id === section)!;
  return (
    <header className="page-head" style={{ ["--section" as string]: s.tint }}>
      <div className="spread">
        <div>
          <div className="eyebrow"><Icon name={s.icon} size={18} />{s.label}</div>
          <h1 id="page-title">{title}</h1>
          <p>{help}</p>
        </div>
        {children}
      </div>
    </header>
  );
}
