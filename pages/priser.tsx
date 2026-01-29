import Link from "next/link";
import React from "react";
import DkLayout from "../components/dk/DkLayout";
import CtaBlock from "../components/dk/CtaBlock";
import { DK_PACKAGES } from "../lib/dk/siteContent";

export default function PriserPage() {
  return (
    <DkLayout title="Priser & pakker — veveve" description="Pakker til danske SMB’er. Start med en 30-dages plan.">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Priser & pakker</h1>
        <p className="mt-3 max-w-2xl text-gray-700">
          Vi holder det simpelt: et tydeligt scope, en fast cadence og en plan du kan følge. Prisen afhænger af
          kompleksitet og annoncebudget.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {DK_PACKAGES.map((p) => (
            <div key={p.name} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-primary">{p.name}</div>
              <p className="mt-2 text-sm text-gray-700">{p.forWho}</p>
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-900">
                {p.priceNote}
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {p.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-black/5 bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Typisk opstart (første 30 dage)</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
            <li>Audit + mål og prioritering</li>
            <li>Opsætning/struktur + tracking</li>
            <li>Første optimeringer + testplan</li>
            <li>Review + næste 30 dages plan</li>
          </ol>
          <div className="mt-4">
            <Link href="/kontakt#lead-form" className="text-sm font-semibold text-primary">
              Book et møde og få et oplæg →
            </Link>
          </div>
        </div>
      </section>

      <CtaBlock
        title="Vil du have et konkret oplæg?"
        text="Book et møde, så får du en 30-dages plan og et tydeligt scope."
        secondaryHref="/ydelser"
        secondaryLabel="Se ydelser"
      />
    </DkLayout>
  );
}

