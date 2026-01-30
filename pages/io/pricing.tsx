import Link from "next/link";
import IoLayout from "../../components/io/IoLayout";
import { appHref } from "../../lib/io/appLinks";

type Tier = {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$499/mo",
    blurb: "For small teams standardizing reporting and introducing automation safely.",
    features: [
      "Multi-channel performance dashboard",
      "Recommendations and alerts",
      "Basic guardrails (caps, pacing, thresholds)",
      "Email support",
    ],
    ctaText: "Start trial",
    ctaHref: appHref("/register"),
  },
  {
    name: "Growth",
    price: "$1,499/mo",
    blurb: "For teams scaling across markets with agentic execution + governance.",
    features: [
      "Agentic optimization (human-in-the-loop approvals)",
      "Experiment automation (geo/language splits)",
      "Anomaly detection + performance narratives",
      "Slack/Email alerts (where configured)",
    ],
    ctaText: "Start trial",
    ctaHref: appHref("/register"),
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    blurb: "For large advertisers needing governance, security reviews, and custom workflows.",
    features: [
      "SSO / advanced access controls",
      "Custom policies and approval flows",
      "Dedicated success manager",
      "Security reviews and SLAs",
    ],
    ctaText: "Book a demo",
    ctaHref: "mailto:hello@veveve.io?subject=Veveve%20demo%20request",
  },
];

export default function IoPricingPage() {
  return (
    <IoLayout
      title="Veveve — Pricing | Agentic PPC Automation"
      description="Simple, transparent plans for agentic PPC automation. Start a trial or talk to sales for enterprise governance."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Pricing that scales with you</h1>
            <p className="text-xl text-gray-600">
              Start small, then scale internationally with agentic systems and governance. Pricing shown in USD
              (excluding taxes). For EUR/local billing, contact us.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid lg:grid-cols-3 gap-6">
            {[
              { k: "Time saved", v: "10+ hrs/week", d: "Automate reporting + repetitive optimizations." },
              { k: "Faster iteration", v: "3×", d: "Standardize tests across markets and channels." },
              { k: "Governance", v: "Built-in", d: "Policies, approvals, and audit-friendly workflows." },
            ].map((m) => (
              <div key={m.k} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-600">{m.k}</div>
                <div className="text-2xl font-bold text-gray-900">{m.v}</div>
                <div className="text-gray-600 mt-2">{m.d}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={[
                  "rounded-2xl border p-8",
                  tier.highlighted ? "border-blue-600 shadow-lg" : "border-gray-200",
                  "bg-white",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{tier.name}</h2>
                  {tier.highlighted ? (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{tier.price}</div>
                <p className="text-gray-600 mb-6">{tier.blurb}</p>

                <ul className="space-y-3 text-gray-700 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-2 h-2 rounded-full bg-teal-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={[
                    "block text-center px-6 py-3 rounded-lg font-semibold transition-colors",
                    tier.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                  ].join(" ")}
                >
                  {tier.ctaText}
                </Link>
                {tier.name === "Enterprise" ? (
                  <div className="text-sm text-gray-500 mt-3">
                    Prefer email?{" "}
                    <a className="text-blue-600 hover:underline" href="mailto:hello@veveve.io">
                      hello@veveve.io
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">What’s included (all plans)</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              {[
                "International reporting structure (markets, languages, channels)",
                "Guardrails: caps, pacing, thresholds",
                "Explainability: why an action was suggested",
                "Support for onboarding and best-practice setup",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">FAQ</h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <div className="font-semibold mb-1">Do you replace marketers?</div>
                <div className="text-gray-600">
                  No. Agents operate within your policies and can require approval for sensitive changes. Humans stay in
                  control.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Can you support multiple markets and languages?</div>
                <div className="text-gray-600">
                  Yes—international scaling is core. We structure accounts/reporting by market and language so teams can
                  scale with clarity.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">What channels do you support?</div>
                <div className="text-gray-600">
                  Google, Meta, LinkedIn (expandable). Exact integrations depend on configuration and plan.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">How do you handle security?</div>
                <div className="text-gray-600">
                  See{" "}
                  <Link href="/security" className="text-blue-600 hover:underline">
                    Security
                  </Link>{" "}
                  for baseline practices and governance.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to scale internationally?</h3>
                <p className="text-blue-100">
                  Start a trial to see the workflow, or contact us for enterprise governance and security needs.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={appHref("/register")} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold">
                  Start Free Trial
                </a>
                <a
                  href="mailto:hello@veveve.io?subject=Veveve%20pricing%20question"
                  className="border-2 border-white px-6 py-3 rounded-lg font-semibold"
                >
                  Ask a question
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

