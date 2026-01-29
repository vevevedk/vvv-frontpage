import Link from "next/link";
import React from "react";
import DkLayout from "../components/dk/DkLayout";
import CtaBlock from "../components/dk/CtaBlock";
import { DK_PACKAGES } from "../lib/dk/siteContent";

export default function Home() {
  return (
    <DkLayout
      title="veveve — Boutique performance marketing for danske virksomheder"
      description="Personlig performance marketing for danske SMB’er. Vi hjælper med Google Ads, Meta og tracking — med tæt samarbejde og tydelige resultater."
    >
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Boutique bureau · Danmark</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Personlig performance marketing for danske virksomheder
            </h1>
            <p className="mt-6 text-lg text-gray-700">
              Vi hjælper SMB’er med at få mere ud af Google Ads, Meta og tracking — med tæt samarbejde,
              tydelige prioriteringer og rapportering, du faktisk kan bruge.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kontakt#lead-form"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Book et møde
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:border-black/20 transition-colors"
              >
                Se cases
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm border border-black/5">Fast kontaktperson</div>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-black/5">Klar 30-dages plan</div>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-black/5">Transparente dashboards</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ydelser til SMB’er</h2>
            <p className="mt-2 text-gray-600">
              Vælg en fokuseret indsats — eller lad os samle det hele i en enkel pakke.
            </p>
          </div>
          <Link href="/ydelser" className="hidden text-sm font-semibold text-primary md:inline">
            Se alle ydelser →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Google Ads", text: "Struktur, budstrategi og løbende optimering med fokus på profit." },
            { title: "Meta Ads", text: "Kreativer, audiences og skalering — uden at miste overblikket." },
            { title: "Tracking (GA4/GTM)", text: "Pålidelige data og events, så du kan styre efter de rigtige tal." },
          ].map((s) => (
            <div key={s.title} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-primary">{s.title}</div>
              <p className="mt-2 text-sm text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <Link href="/ydelser" className="text-sm font-semibold text-primary">
            Se alle ydelser →
          </Link>
        </div>
      </section>

      {/* Packages preview */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pakker</h2>
              <p className="mt-2 text-gray-600">Start med en 30-dages plan og en fast cadence.</p>
            </div>
            <Link href="/priser" className="hidden text-sm font-semibold text-primary md:inline">
              Se priser →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {DK_PACKAGES.map((p) => (
              <div key={p.name} className="rounded-xl border border-black/5 bg-gray-50 p-6">
                <div className="text-sm font-semibold text-primary">{p.name}</div>
                <p className="mt-2 text-sm text-gray-700">{p.forWho}</p>
                <div className="mt-4 text-sm font-semibold text-gray-900">{p.priceNote}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 md:hidden">
            <Link href="/priser" className="text-sm font-semibold text-primary">
              Se priser →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBlock
        title="Vil du have en tydelig plan på 30 dage?"
        text="Book et kort møde. Du får en konkret prioritering og næste skridt — uden salgspres."
        secondaryHref="/ydelser"
        secondaryLabel="Se ydelser"
      />
    </DkLayout>
  );
}
