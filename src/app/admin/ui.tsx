export const fmt = (n: number) => n.toLocaleString("en-IN");

export function Loading() {
  return <p className="py-16 text-center text-ink-3">Loading…</p>;
}

/** Summary line under the tabs; the tab itself already names the section. */
export function SectionHead({ note, children }: { note: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-lg text-ink-2">{note}</p>
      {children}
    </div>
  );
}
