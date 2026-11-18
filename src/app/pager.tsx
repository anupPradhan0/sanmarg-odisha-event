import Link from "next/link";

const btn = "touch-manipulation border border-rule px-4 py-2.5 font-medium hover:border-ink sm:px-3 sm:py-1.5";

export function Pager({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pages">
      <span className="text-ink-3">
        Page {page.toLocaleString("en-IN")} of {pages.toLocaleString("en-IN")}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={btn}>
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className={btn}>
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}
