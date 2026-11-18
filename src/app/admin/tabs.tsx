"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, UserCog, Users } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Overview", Icon: ChartColumn },
  { href: "/admin/participants", label: "Participants", Icon: Users },
  { href: "/admin/staff", label: "Staff", Icon: UserCog },
] as const;

export function Tabs() {
  const path = usePathname();
  return (
    <nav className="mt-6 flex border-b border-ink" aria-label="Admin sections">
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex flex-1 items-center justify-center gap-2 border-b-[3px] px-2 py-3 text-sm font-semibold whitespace-nowrap sm:flex-none sm:px-5 sm:text-base ${
              active ? "border-maroon-700 text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <Icon className="hidden size-4 min-[400px]:block" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
