import Link from "next/link";
import { LogOut, ScanLine } from "lucide-react";
import { logout } from "../staff/actions";
import { Tabs } from "./tabs";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">Walkathon 2026</p>
          <h1 className="mt-1.5 font-serif text-4xl leading-none tracking-tight sm:text-5xl">Admin</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/staff" className="inline-flex h-11 items-center gap-2 border border-ink px-3 text-sm font-semibold hover:bg-ink hover:text-paper sm:px-4">
            <ScanLine className="size-4" aria-hidden /> <span className="hidden sm:inline">Gate check-in</span>
            <span className="sm:hidden">Gate</span>
          </Link>
          <form action={logout}>
            <button className="inline-flex h-11 items-center gap-2 border border-rule px-3 text-sm font-semibold text-ink-2 hover:border-ink sm:px-4" aria-label="Log out">
              <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Log out</span>
            </button>
          </form>
        </div>
      </div>
      <Tabs />
      <div className="pt-8">{children}</div>
    </main>
  );
}
