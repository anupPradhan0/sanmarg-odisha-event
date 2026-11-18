import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Anek_Odia, Geist, Instrument_Serif } from "next/font/google";
import { EVENT } from "@/lib/event";
import { LangSwitch } from "./lang";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const display = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// Not preloaded: only downloaded when Odia text is on screen.
const odia = Anek_Odia({ variable: "--font-odia", subsets: ["oriya"], preload: false });

export const metadata: Metadata = {
  title: EVENT.name,
  description: `Register for the ${EVENT.name} and get your participation certificate.`,
};

export const viewport: Viewport = { themeColor: "#f4efe6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable} ${odia.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="size-3 bg-maroon-700" aria-hidden />
              <span className="font-serif text-[1.35rem] leading-none tracking-tight whitespace-nowrap min-[360px]:text-[1.6rem]">Sanmarg Odisha</span>
            </Link>
            <Suspense fallback={<LangSwitch lang="en" />}>
              <LangSwitch />
            </Suspense>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-rule">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-sm text-ink-3 sm:flex-row sm:justify-between">
            <span className="font-serif text-xl text-ink">Sanmarg Odisha</span>
            <span>
              © 2026 · sanmargodisha.in ·{" "}
              <Link href="/staff/login" className="underline decoration-rule underline-offset-4 hover:text-ink">
                Staff login
              </Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
