import { LoginForm } from "./form";

export const metadata = { title: "Staff login · Sanmarg Odisha" };

export default function StaffLoginPage() {
  return (
    <main className="mx-auto max-w-sm px-5 py-14">
      <p className="text-[11px] font-medium tracking-[0.2em] text-maroon-700 uppercase">Staff &amp; admin</p>
      <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight">Sign in</h1>
      <p className="mt-3 text-ink-2">For gate volunteers and organisers. Participants register on the home page.</p>
      <div className="mt-8 border-t border-ink pt-8">
        <LoginForm />
      </div>
    </main>
  );
}
