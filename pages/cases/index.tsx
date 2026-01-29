import React from "react";
import DkLayout from "../../components/dk/DkLayout";
import CtaBlock from "../../components/dk/CtaBlock";
import { DK_CASES } from "../../lib/dk/siteContent";

export default function CasesPage() {
  return (
    <DkLayout title="Cases — veveve" description="Udvalgte resultater og samarbejder fra danske SMB’er.">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cases</h1>
        <p className="mt-3 max-w-2xl text-gray-700">
          Her er et par eksempler på hvordan vi arbejder. Vi anonymiserer gerne data, når det giver mening.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {DK_CASES.map((c) => (
            <article key={c.title} className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-primary">{c.industry}</div>
              <h2 className="mt-2 text-lg font-bold text-gray-900">{c.title}</h2>
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-900">
                Resultat: <span className="text-primary">{c.result}</span>
              </div>
              <p className="mt-3 text-sm text-gray-700">{c.summary}</p>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Det gjorde vi</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {c.whatWeDid.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBlock
        title="Vil du have en plan der passer til dit budget?"
        text="Book et møde, så laver vi en 30-dages prioritering baseret på mål og data."
        secondaryHref="/priser"
        secondaryLabel="Se pakker"
      />
    </DkLayout>
  );
}

