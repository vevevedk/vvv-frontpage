import Link from "next/link";
import IoLayout from "../../components/io/IoLayout";
import { appHref } from "../../lib/io/appLinks";

export default function IoProductPage() {
  return (
    <IoLayout
      title="Veveve — Product | Agentic PPC Automation"
      description="Agentic systems for PPC: autonomous optimization with human-in-the-loop controls, scaling across markets and channels."
    >
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Scale PPC globally without scaling your team
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Autonomous agents monitor performance, propose actions, and execute within your guardrails—so you scale
              internationally without scaling headcount.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={appHref("/register")}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Start Free Trial
              </a>
              <Link
                href="/pricing"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
              <p className="text-gray-600 text-lg mb-6">
                The platform combines multi-channel performance data, attribution signals, and policy-based controls so
                agents can make fast decisions without breaking governance.
              </p>
              <ol className="space-y-4 text-gray-700">
                <li>
                  <span className="font-semibold">Observe:</span> performance and spend across accounts, markets, and
                  channels.
                </li>
                <li>
                  <span className="font-semibold">Decide:</span> generate actions (bids, budgets, queries, creatives)
                  backed by evidence.
                </li>
                <li>
                  <span className="font-semibold">Act:</span> execute automatically or request approval (human-in-the-loop).
                </li>
                <li>
                  <span className="font-semibold">Learn:</span> measure impact and refine strategies over time.
                </li>
              </ol>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/case-studies"
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  See case studies
                </Link>
                <Link
                  href="/security"
                  className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Security & governance
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Agent actions (examples)</h3>
              <ul className="space-y-3 text-gray-700">
                <li>Bid & budget adjustments within caps</li>
                <li>Keyword & query mining + negatives recommendations</li>
                <li>Creative testing suggestions and rollout plans</li>
                <li>Geo & language split experiments for new markets</li>
                <li>Alerts when performance deviates from targets</li>
              </ul>
              <div className="mt-6 text-sm text-gray-600">
                Agents operate inside your rules. You decide which actions require approval, and what can run
                automatically.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white" id="use-cases">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What teams use Veveve for</h2>
            <p className="text-lg text-gray-600">
              Common workflows for scaling performance marketing across regions and channels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Scaling into new markets",
                body: "Launch geo/language splits, learn faster, and expand with controlled spend caps.",
              },
              {
                title: "Reducing ops load",
                body: "Automate reporting, anomaly detection, and repetitive optimizations across accounts.",
              },
              {
                title: "Stabilizing ROAS",
                body: "Detect performance drift early and adjust pacing/bids within your targets.",
              },
              {
                title: "Experiment velocity",
                body: "Systematize tests for creatives, audiences, and landing pages with measurable outcomes.",
              },
              {
                title: "Governance at scale",
                body: "Approval workflows, audit logs, and role controls for distributed teams.",
              },
              {
                title: "Client transparency",
                body: "Share consistent dashboards and explainable actions to build trust with stakeholders.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50" id="channels">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for multi-channel PPC</h2>
            <p className="text-lg text-gray-600">Unify execution and insights across your paid acquisition stack.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Google Ads", body: "Search, Shopping, Performance Max — scale with guardrails." },
              { title: "Meta Ads", body: "Creative testing loops and budget pacing across markets." },
              { title: "LinkedIn Ads", body: "B2B pipeline-focused optimization and audience strategy." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white" id="controls">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Human-in-the-loop controls</h2>
              <p className="text-lg text-gray-600">
                Automation should be safe. Set policies and approvals so agents operate like your best operator—at
                machine speed.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <ul className="space-y-3 text-gray-700">
                <li>Spend caps, pacing rules, and market budgets</li>
                <li>Approval flows for high-impact changes</li>
                <li>Audit logs and explainability for every action</li>
                <li>Rollbacks and safety checks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50" id="integrations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrations (roadmap-friendly)</h2>
              <p className="text-lg text-gray-600">
                Connect the core ad channels, commerce platforms, and analytics stack. Start with the essentials, then
                expand as your team standardizes workflows.
              </p>
              <div className="mt-6 text-sm text-gray-500">
                Note: exact integration coverage depends on configuration and plan.
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
                {[
                  "Google Ads",
                  "Meta Ads",
                  "LinkedIn Ads",
                  "Google Analytics / GA4",
                  "Merchant Center (where relevant)",
                  "WooCommerce / ecommerce feeds (optional)",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See agentic PPC in action</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start a trial or explore pricing to find the right plan for your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={appHref("/register")} className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold">
              Start Free Trial
            </a>
            <Link href="/pricing" className="bg-transparent border-2 border-white px-8 py-4 rounded-lg font-semibold">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </IoLayout>
  );
}

