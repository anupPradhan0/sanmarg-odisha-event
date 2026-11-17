import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Noto_Sans_Oriya, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { EVENT } from "@/lib/event";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const odia = Noto_Sans_Oriya({ variable: "--font-odia", subsets: ["oriya"] });

export const metadata: Metadata = {
  title: EVENT.name,
  description: `Register for the ${EVENT.name} and get your participation certificate.`,
};

export const viewport: Viewport = { themeColor: "#8b1e24" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="or" className={`${jakarta.variable} ${playfair.variable} ${odia.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="bg-maroon-700 text-white">
          <div className="mx-auto flex h-14 max-w-xl items-center px-5">
            <Link href="/" className="font-serif text-xl font-bold">
              Sanmarg Odisha
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="px-5 py-8 text-center text-sm text-slate-500">© 2026 Sanmarg Odisha · sanmargodisha.in</footer>
      </body>
    </html>
  );
}
