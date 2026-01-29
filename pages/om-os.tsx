import Link from "next/link";
import React from "react";
import DkLayout from "../components/dk/DkLayout";

export default function OmOsPage() {
  return (
    <DkLayout title="Om os — veveve" description="Boutique bureau med fokus på personlig service og lokale resultater.">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Om os</h1>
        <p className="mt-4 text-gray-700">
          Veveve er et lille boutique bureau. Vi arbejder tæt med danske virksomheder og prioriterer enkelhed,
          gennemsigtighed og fremdrift.
        </p>

        <div className="mt-10 space-y-6">
          <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Sådan arbejder vi</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Vi starter med en konkret 30-dages plan</li>
              <li>Vi fokuserer på det, der flytter profit (ikke vanity metrics)</li>
              <li>Vi kommunikerer kort og klart — og svarer hurtigt</li>
            </ul>
          </div>

          <div className="rounded-xl border border-black/5 bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-gray-900">Vil du se om vi er et match?</h2>
            <p className="mt-2 text-sm text-gray-700">
              Book et møde, så vurderer vi potentiale og næste skridt sammen.
            </p>
            <div className="mt-4">
              <Link
                href="/kontakt#lead-form"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Book et møde
              </Link>
            </div>
          </div>
        </div>
      </section>
    </DkLayout>
  );
}

