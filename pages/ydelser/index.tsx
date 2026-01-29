import Link from "next/link";
import React from "react";
import DkLayout from "../../components/dk/DkLayout";
import { DK_SERVICES } from "../../lib/dk/siteContent";

export default function YdelserPage() {
  return (
    <DkLayout
      title="Ydelser — veveve"
      description="Ydelser til danske SMB’er: Google Ads, Meta Ads, tracking/GA4 og CRO."
    >
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ydelser</h1>
        <p className="mt-3 max-w-2xl text-gray-700">
          Vi arbejder som et lille, skarpt team: tæt dialog, klare prioriteringer og løbende forbedringer.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {DK_SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/ydelser/${s.slug}`}
              className="group rounded-xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {s.title}
                </div>
                <div className="text-sm font-semibold text-primary">Læs mere →</div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{s.summary}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-black/5 bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Ikke sikker på hvad der passer?</h2>
          <p className="mt-2 text-sm text-gray-700">
            Book et kort møde, så laver vi en 30-dages prioritering baseret på dine mål og dit budget.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/kontakt#lead-form"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Book et møde
            </Link>
            <Link href="/priser" className="text-sm font-semibold text-primary">
              Se pakker →
            </Link>
          </div>
        </div>
      </section>
    </DkLayout>
  );
}

