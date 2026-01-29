import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import React from "react";
import DkLayout from "../../components/dk/DkLayout";
import { DK_SERVICES, type DkService } from "../../lib/dk/siteContent";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: DK_SERVICES.map((s) => ({ params: { slug: s.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{ service: DkService }> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");
  const service = DK_SERVICES.find((s) => s.slug === slug);
  if (!service) {
    return { notFound: true };
  }
  return { props: { service } };
};

export default function ServicePage({ service }: { service: DkService }) {
  return (
    <DkLayout title={`${service.title} — veveve`} description={service.intro}>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link href="/ydelser" className="text-sm font-semibold text-primary">
          ← Tilbage til ydelser
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">{service.title}</h1>
        <p className="mt-3 text-gray-700">{service.intro}</p>

        <div className="mt-8 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Typisk leverance</div>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {service.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-xl border border-black/5 bg-gray-50 p-6">
          <div className="text-sm font-semibold text-gray-900">Næste skridt</div>
          <p className="mt-2 text-sm text-gray-700">
            Book et kort møde, så får du en 30-dages plan og en ærlig vurdering af potentiale og fokus.
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
      </section>
    </DkLayout>
  );
}

