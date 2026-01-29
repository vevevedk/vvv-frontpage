import Link from "next/link";
import IoLayout from "../../../components/io/IoLayout";
import { appHref } from "../../../lib/io/appLinks";

type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  metric: string;
  tags: string[];
};

const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "ecommerce-roas-lift",
    title: "Ecommerce: ROAS lift with controlled agentic optimization",
    summary:
      "Pacing + bid guardrails reduced volatility while expanding to new markets and testing creatives faster.",
    metric: "+32% ROAS",
    tags: ["Google Ads", "Meta", "Multi-market"],
  },
  {
    slug: "b2b-pipeline-efficiency",
    title: "B2B SaaS: Faster experimentation across regions",
    summary:
      "Agents proposed geo/language split tests and automated exec reporting—freeing up operators for strategy.",
    metric: "-40% ops time",
    tags: ["LinkedIn", "Google Ads", "Reporting"],
  },
  {
    slug: "multi-market-scaling",
    title: "International expansion: from 2 to 8 markets without hiring",
    summary:
      "Approval workflows + auditability enabled safe scaling across markets while keeping governance consistent.",
    metric: "+6 markets",
    tags: ["Governance", "Approvals", "International"],
  },
  {
    slug: "anomaly-response",
    title: "Ops: anomaly detection that prevents wasted spend",
    summary:
      "Real-time alerts + recommended actions helped the team respond before performance drift became expensive.",
    metric: "-18% wasted spend",
    tags: ["Alerts", "Anomalies", "Guardrails"],
  },
];

export default function IoCaseStudiesIndexPage() {
  return (
    <IoLayout
      title="Veveve — Case Studies | Agentic PPC Automation"
      description="Real examples of agentic PPC systems improving ROAS, reducing ops time, and scaling into new markets."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Case studies</h1>
            <p className="text-xl text-gray-600">
              Outcomes-first stories that show how agentic systems help performance teams scale internationally. These are
              templates—swap with real customers, quotes, and verified metrics during Sprint 2.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid lg:grid-cols-3 gap-6">
            {[
              { k: "Pattern", v: "Governed automation", d: "Agents operate inside policies + approvals." },
              { k: "Focus", v: "International scale", d: "Markets/languages/channels stay organized." },
              { k: "Output", v: "Measurable results", d: "ROAS, ops time, scaling velocity." },
            ].map((m) => (
              <div key={m.k} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-600">{m.k}</div>
                <div className="text-2xl font-bold text-gray-900">{m.v}</div>
                <div className="text-gray-600 mt-2">{m.d}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {CASE_STUDIES.map((cs) => (
              <Link
                key={cs.slug}
                href={`/case-studies/${cs.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 inline-block px-2 py-1 rounded-full mb-3">
                  {cs.metric}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{cs.title}</h2>
                <p className="text-gray-600">{cs.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cs.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-blue-600 font-semibold">Read case study →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Want similar outcomes?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start a trial to see the workflow end-to-end, or explore the product and governance model.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={appHref("/register")} className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold">
              Start Free Trial
            </a>
            <Link href="/product" className="border-2 border-white px-8 py-4 rounded-lg font-semibold">
              Explore product
            </Link>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

