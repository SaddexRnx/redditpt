import type { ReactNode } from "react";

export function Section({ title, desc, children, right }: {
  title: string; desc?: string; children: ReactNode; right?: ReactNode;
}) {
  return (
    <section className="rpt-card space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-text tracking-tight">{title}</h2>
          {desc && <p className="text-[11px] text-muted mt-0.5">{desc}</p>}
        </div>
        {right}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
