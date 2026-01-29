import Link from "next/link";
import React from "react";

const navLinks = [
  { href: "/", label: "Forside" },
  { href: "/ydelser", label: "Ydelser" },
  { href: "/priser", label: "Priser" },
  { href: "/cases", label: "Cases" },
  { href: "/om-os", label: "Om os" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function DkNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">veveve</span>
          <span className="hidden text-sm text-gray-600 sm:inline">Boutique bureau</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://veveve.io/login"
            className="hidden md:inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-black/20 transition-colors"
          >
            Login
          </a>
          <Link
            href="/kontakt#lead-form"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Book et møde
          </Link>
        </div>
      </nav>
    </header>
  );
}

