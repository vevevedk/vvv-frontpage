import Link from "next/link";
import IoLayout from "../../components/io/IoLayout";

export default function IoSecurityPage() {
  return (
    <IoLayout
      title="Veveve — Security | Governance for Agentic PPC"
      description="Security and governance overview for veveve.io. Human-in-the-loop controls, auditability, and privacy-conscious practices."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Security & governance</h1>
            <p className="text-xl text-gray-600">
              A transparent overview of how we approach access, auditability, and safe automation for agentic PPC.
              Details depend on configuration and plan—this page is intentionally accurate and avoids overpromising.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/pricing" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold">
                View plans
              </Link>
              <a
                href="mailto:hello@veveve.io?subject=Veveve%20security%20question"
                className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold"
              >
                Ask a security question
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid lg:grid-cols-3 gap-6">
            {[
              { k: "Principle", v: "Least privilege", d: "Access is scoped by role and responsibility." },
              { k: "Principle", v: "Auditability", d: "Actions should be inspectable and explainable." },
              { k: "Principle", v: "Safe automation", d: "Guardrails + approvals prevent costly mistakes." },
            ].map((m, idx) => (
              <div key={`${m.v}-${idx}`} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="text-sm text-gray-600">{m.k}</div>
                <div className="text-2xl font-bold text-gray-900">{m.v}</div>
                <div className="text-gray-600 mt-2">{m.d}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Human-in-the-loop controls</h2>
              <ul className="space-y-2 text-gray-700">
                <li>Approval workflows for high-impact changes</li>
                <li>Policies for spend caps, pacing, and market budgets</li>
                <li>Role-based access controls (RBAC) approach</li>
                <li>Environment separation (where applicable)</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Auditability</h2>
              <ul className="space-y-2 text-gray-700">
                <li>Action history for changes agents propose/execute</li>
                <li>Explainability notes (why an action was taken)</li>
                <li>Rollback guidance for safe experimentation</li>
                <li>Change reviews and approvals for sensitive actions</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Privacy & data handling</h2>
              <ul className="space-y-2 text-gray-700">
                <li>Data minimization principles</li>
                <li>Clear separation between marketing site and platform data</li>
                <li>GDPR-ready communication and consent management</li>
                <li>Documented data flows and retention guidelines (plan-dependent)</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Security review (what we can provide)</h2>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>Overview of access model and operational controls</li>
                <li>Architecture and data-flow walkthrough</li>
                <li>Plan-specific answers for compliance and governance requirements</li>
              </ul>
              <p className="text-gray-700 mb-4">
                If you’re evaluating veveve.io for a security-sensitive org, we can align on requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/pricing" className="bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold">
                  View pricing
                </Link>
                <Link
                  href="/product"
                  className="bg-white text-blue-600 border-2 border-blue-600 px-5 py-3 rounded-lg font-semibold"
                >
                  Explore product
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Frequently asked</h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <div className="font-semibold mb-1">Do agents make changes automatically?</div>
                <div className="text-gray-600">
                  Only if configured. You can require approvals for high-impact actions and keep sensitive workflows
                  human-reviewed.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Can we control access per client/account?</div>
                <div className="text-gray-600">
                  Yes—access should follow least privilege. Exact controls are plan- and implementation-dependent.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Do you have a security contact?</div>
                <div className="text-gray-600">
                  Email{" "}
                  <a className="text-blue-600 hover:underline" href="mailto:hello@veveve.io">
                    hello@veveve.io
                  </a>{" "}
                  and we’ll route it to the right person.
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">How do you handle privacy/GDPR?</div>
                <div className="text-gray-600">
                  We aim for data minimization and clear data flows with GDPR-compliant consent management.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

