import Link from "next/link";
import { GetServerSideProps } from "next";
import IoLayout from "../../../components/io/IoLayout";
import { appHref } from "../../../lib/io/appLinks";

type Props = {
  slug: string;
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function IoCaseStudyDetailPage({ slug }: Props) {
  const title = titleFromSlug(slug);

  return (
    <IoLayout
      title={`Veveve — Case Study | ${title}`}
      description="Case study placeholder. Replace with real story, metrics, and timeline during Sprint 2."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Link href="/case-studies" className="text-blue-600 font-semibold hover:underline">
              ← Back to case studies
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-4">{title}</h1>
            <p className="text-xl text-gray-600">
              This is a stub template. It’s here so routing, SEO structure, and design can be built before final copy.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Context</h2>
            <p className="text-gray-700">
              Describe the company, market(s), channels, and constraints (budget, tracking quality, team size).
            </p>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Problem</h2>
            <ul className="space-y-2 text-gray-700">
              <li>What was breaking (ROAS volatility, scaling limits, slow iteration)?</li>
              <li>What “good” looked like (targets, constraints, governance)?</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">What we did (agentic system)</h2>
            <ul className="space-y-2 text-gray-700">
              <li>Guardrails + approval flows (human-in-the-loop).</li>
              <li>Automated monitoring + anomaly detection.</li>
              <li>Action execution (bids, budgets, queries, experiments).</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Results</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { k: "ROAS", v: "+__%" },
                { k: "Ops time", v: "-__%" },
                { k: "Markets", v: "__" },
              ].map((m) => (
                <div key={m.k} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <div className="text-sm text-gray-600">{m.k}</div>
                  <div className="text-2xl font-bold text-gray-900">{m.v}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-4">Replace placeholders with real metrics + timeframe + measurement method.</p>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">Want similar results?</h2>
            <p className="text-blue-100 mb-6">
              Start a trial or explore pricing to see which plan fits your team’s governance needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={appHref("/register")} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold">
                Start Free Trial
              </a>
              <Link href="/pricing" className="border-2 border-white px-6 py-3 rounded-lg font-semibold">
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const slugParam = context.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) {
    return { notFound: true };
  }

  return { props: { slug } };
};

