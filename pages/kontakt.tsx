import Link from "next/link";
import React, { useMemo, useState } from "react";
import DkLayout from "../components/dk/DkLayout";
import { DK_EMAIL, DK_PHONE_DISPLAY, DK_PHONE_TEL } from "../lib/dk/siteContent";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  goal: string;
  budget: string;
  timeline: string;
  channels: string[];
  message: string;
  website_hp: string; // honeypot
};

export default function KontaktPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const initial: FormState = useMemo(
    () => ({
      name: "",
      email: "",
      phone: "",
      company: "",
      website: "",
      goal: "",
      budget: "",
      timeline: "",
      channels: [],
      message: "",
      website_hp: "",
    }),
    [],
  );
  const [form, setForm] = useState<FormState>(initial);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source_path: "/kontakt" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kunne ikke sende. Prøv igen.");
      }
      setDone(true);
      setForm(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DkLayout title="Kontakt — veveve" description="Send en kort beskrivelse, så vender vi tilbage med næste skridt.">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kontakt</h1>
        <p className="mt-3 text-gray-700">
          Fortæl kort hvad du vil opnå, så vender vi tilbage med næste skridt (typisk indenfor 1 hverdag). Alternativt kan du sende en mail til{" "}
          <a className="font-semibold text-primary" href={`mailto:${DK_EMAIL}`}>
            {DK_EMAIL}
          </a>
          .
        </p>
        {DK_PHONE_DISPLAY && DK_PHONE_TEL && (
          <p className="mt-2 text-sm text-gray-600">
            Du kan også ringe på{" "}
            <a className="font-semibold text-primary" href={DK_PHONE_TEL}>
              {DK_PHONE_DISPLAY}
            </a>
            .
          </p>
        )}

        <form
          id="lead-form"
          onSubmit={onSubmit}
          className="mt-10 rounded-xl border border-black/5 bg-gray-50 p-6"
        >
          <h2 className="text-lg font-bold text-gray-900">Anmod om kontakt / møde</h2>
          <p className="mt-2 text-sm text-gray-700">
            Jo mere kontekst du giver, jo hurtigere kan vi vende tilbage med konkrete næste skridt.
          </p>

          {/* Honeypot (hidden) */}
          <div className="hidden">
            <label>
              Website
              <input
                value={form.website_hp}
                onChange={(e) => setForm((f) => ({ ...f, website_hp: e.target.value }))}
                name="website_hp"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-semibold text-gray-900">Navn</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm">
              <span className="font-semibold text-gray-900">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm">
              <span className="font-semibold text-gray-900">Telefon</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="mt-1 text-xs text-gray-500">Valgfrit, men anbefalet for hurtigere afklaring.</div>
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="font-semibold text-gray-900">Virksomhed</span>
              <input
                required
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="font-semibold text-gray-900">Website</span>
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm">
              <span className="font-semibold text-gray-900">Primært mål</span>
              <select
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Vælg…</option>
                <option value="leads">Flere leads</option>
                <option value="sales">Flere salg (e-commerce)</option>
                <option value="tracking">Bedre tracking/data</option>
                <option value="cpa_roas">Lavere CPA / bedre ROAS</option>
                <option value="other">Andet</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="font-semibold text-gray-900">Tidshorisont</span>
              <select
                value={form.timeline}
                onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Vælg…</option>
                <option value="hurtigst_muligt">Hurtigst muligt</option>
                <option value="2_4_uger">2–4 uger</option>
                <option value="1_3_mdr">1–3 måneder</option>
                <option value="nysgerrig">Bare nysgerrig</option>
              </select>
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="font-semibold text-gray-900">Budget (ca.)</span>
              <select
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Vælg…</option>
                <option value="<10k">&lt; 10.000 kr./md</option>
                <option value="10-30k">10–30k kr./md</option>
                <option value="30-75k">30–75k kr./md</option>
                <option value="75k+">75k+ kr./md</option>
              </select>
              <div className="mt-1 text-xs text-gray-500">Brug et estimat — det hjælper os med at foreslå den rigtige pakke.</div>
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold text-gray-900">Kanaler i dag</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { key: "google_ads", label: "Google Ads" },
                  { key: "meta", label: "Meta" },
                  { key: "seo", label: "SEO" },
                  { key: "email", label: "Email" },
                  { key: "none", label: "Ingen (endnu)" },
                ].map((c) => {
                  const checked = form.channels.includes(c.key);
                  return (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f) => {
                            const next = new Set(f.channels);
                            if (e.target.checked) next.add(c.key);
                            else next.delete(c.key);
                            return { ...f, channels: Array.from(next) };
                          });
                        }}
                        className="h-4 w-4 rounded border-black/20"
                      />
                      {c.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="text-sm sm:col-span-2">
              <span className="font-semibold text-gray-900">Besked</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="mt-1 text-xs text-gray-500">
                Tip: skriv mål, nuværende setup, og hvad der frustrerer jer i dag.
              </div>
            </label>
          </div>

          {error && <div className="mt-4 text-sm font-semibold text-red-600">{error}</div>}
          {done && <div className="mt-4 text-sm font-semibold text-green-700">Tak! Vi vender tilbage snarest.</div>}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {submitting ? "Sender..." : "Send"}
            </button>
            <span className="text-xs text-gray-500">(Gemmes som lead og vi kontakter dig bagefter)</span>
          </div>
        </form>
      </section>
    </DkLayout>
  );
}

