import type { NextApiRequest, NextApiResponse } from "next";
import { createRateLimiter, RateLimitError } from "../../lib/rate-limit";
import { sendEmail } from "../../lib/email";
import { DK_EMAIL } from "../../lib/dk/siteContent";
import { queryWithRetry } from "../../lib/db";
import { verifyToken } from "../../lib/auth";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string; // real company website
  message?: string;
  goal?: string;
  budget?: string;
  timeline?: string;
  channels?: string[];
  website_hp?: string; // honeypot
  source_path?: string;
};

type LeadRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  website: string | null;
  goal: string | null;
  budget: string | null;
  timeline: string | null;
  channels: string[];
  message: string;
  source_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  score: number;
  assigned_to?: string | null;
  notes?: string | null;
};

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function clamp(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function getBearerToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function requireInternalAccess(req: NextApiRequest, res: NextApiResponse) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (user.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

function getNotifyEmails(): string[] {
  // Comma-separated list supported; falls back to DK email.
  const raw = (process.env.LEAD_NOTIFY_EMAILS || process.env.LEAD_NOTIFY_EMAIL || DK_EMAIL).trim();
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function notifySlack(params: {
  leadId?: string | null;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  goal: string | null;
  budget: string | null;
  timeline: string | null;
  channels: string[];
  message: string;
  sourcePath: string;
  score: number;
}) {
  const webhook = process.env.SLACK_LEADS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const shortMsg = clamp(params.message.replace(/\s+/g, " ").trim(), 500);
  const lines = [
    `*Ny lead* (score: *${params.score}*)`,
    `*${params.company}* — ${params.name}`,
    `Email: ${params.email}`,
    params.phone ? `Telefon: ${params.phone}` : null,
    params.goal ? `Mål: ${params.goal}` : null,
    params.budget ? `Budget: ${params.budget}` : null,
    params.timeline ? `Tidshorisont: ${params.timeline}` : null,
    params.channels.length ? `Kanaler: ${params.channels.join(", ")}` : null,
    params.leadId ? `Lead ID: \`${params.leadId}\`` : null,
    `Source: ${params.sourcePath}`,
    "",
    `_${shortMsg}_`,
  ].filter(Boolean);

  const payload = {
    text: lines.join("\n"),
  };

  // Best-effort; don't break lead creation on Slack failures.
  try {
    const resp = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Slack webhook returned non-2xx:", resp.status, text);
    }
  } catch (e) {
    console.error("Slack notification failed:", e);
  }
}

async function ensureLeadsTable() {
  // Minimal, safe “create if missing”. Avoids Prisma touching Django tables.
  // Uses gen_random_uuid() so Postgres needs pgcrypto.
  await queryWithRetry(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),

      name text NOT NULL,
      email text NOT NULL,
      phone text NULL,
      company text NOT NULL,
      website text NULL,

      goal text NULL,
      budget text NULL,
      timeline text NULL,
      channels text[] NOT NULL DEFAULT '{}'::text[],

      message text NOT NULL,

      source_path text NULL,
      ip_address text NULL,
      user_agent text NULL,

      status text NOT NULL DEFAULT 'new',
      score integer NOT NULL DEFAULT 0
    );
  `);
  await queryWithRetry(`CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);`);
  await queryWithRetry(`CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);`);
  await queryWithRetry(`CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);`);

  // Add triage fields (safe if already present)
  await queryWithRetry(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to text NULL;`);
  await queryWithRetry(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text NULL;`);
  await queryWithRetry(`CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to);`);
}

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    return `${ip}:lead`;
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", "POST, GET, PATCH");
    return res.status(405).send("Method Not Allowed");
  }

  // Internal access: list + status updates
  if (req.method === "GET") {
    const user = await requireInternalAccess(req, res);
    if (!user) return;

    await ensureLeadsTable();
    const status = s(req.query.status);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || "50"), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset || "0"), 10) || 0);

    const where = status ? `WHERE status = $1` : "";
    const params = status ? [status, limit, offset] : [limit, offset];
    const limIdx = status ? 2 : 1;
    const offIdx = status ? 3 : 2;

    const q = `
      SELECT
        id, created_at, updated_at,
        name, email, phone, company, website,
        goal, budget, timeline, channels,
        message, source_path, ip_address, user_agent,
        status, score,
        assigned_to, notes
      FROM leads
      ${where}
      ORDER BY created_at DESC
      LIMIT $${limIdx} OFFSET $${offIdx}
    `;

    const rows = await queryWithRetry<LeadRow>(q, params);
    return res.status(200).json({ leads: rows.rows });
  }

  if (req.method === "PATCH") {
    const user = await requireInternalAccess(req, res);
    if (!user) return;

    const id = s((req.body || {}).id);
    const status = s((req.body || {}).status);
    const assignedTo = s((req.body || {}).assigned_to) || null;
    const notes = typeof (req.body || {}).notes === "string" ? (req.body || {}).notes : null;

    const allowed = new Set(["new", "contacted", "qualified", "won", "not_a_fit", ""]);
    if (!id) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    if (status && !allowed.has(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await ensureLeadsTable();

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) {
      sets.push(`status = $${idx++}`);
      params.push(status);
    }
    if ((req.body || {}).assigned_to !== undefined) {
      sets.push(`assigned_to = $${idx++}`);
      params.push(assignedTo);
    }
    if ((req.body || {}).notes !== undefined) {
      sets.push(`notes = $${idx++}`);
      params.push(notes);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    params.push(id);
    await queryWithRetry(`UPDATE leads SET ${sets.join(", ")} WHERE id = $${idx}`, params);
    return res.status(200).json({ ok: true });
  }

  // Public lead submission: rate limit + create + notify
  try {
    await limiter.check(req, res);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return res.status(err.statusCode).json({ error: err.message, retryAfter: err.retryAfter });
    }
    throw err;
  }

  const body = (req.body || {}) as LeadPayload;

  // Honeypot: if filled, pretend success (anti-spam).
  if (s(body.website_hp)) {
    return res.status(200).json({ ok: true });
  }

  const name = s(body.name);
  const email = s(body.email);
  const company = s(body.company);
  const message = s(body.message);

  if (!name || !email || !company || !message) {
    return res.status(400).send("Missing required fields");
  }

  const phone = s(body.phone) || null;
  const website = s(body.website) || null;
  const goal = s(body.goal) || null;
  const budget = s(body.budget) || null;
  const timeline = s(body.timeline) || null;
  const channels = Array.isArray(body.channels) ? body.channels.filter((c) => typeof c === "string").slice(0, 20) : [];
  const sourcePath = s(body.source_path) || "/kontakt";

  // Naive scoring
  let score = 0;
  if (message.length >= 200) score += 2;
  if (website) score += 2;
  if (phone) score += 1;
  if (budget && !["<10k", ""].includes(budget)) score += 1;
  if (timeline === "hurtigst_muligt") score += 1;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
  const userAgent = s(req.headers["user-agent"]) || null;

  await ensureLeadsTable();

  const insert = await queryWithRetry<{ id: string }>(
    `
      INSERT INTO leads (
        name, email, phone, company, website,
        goal, budget, timeline, channels,
        message, source_path, ip_address, user_agent, score
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,$13,$14
      )
      RETURNING id
    `,
    [
      name,
      email,
      phone,
      company,
      website,
      goal,
      budget,
      timeline,
      channels,
      message,
      sourcePath,
      ip,
      userAgent,
      score,
    ],
  );

  const leadId = insert.rows[0]?.id;

  // Notification email (best-effort)
  const notifyTo = getNotifyEmails();
  const canSend = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM;
  if (canSend) {
    const subject = `Ny lead: ${company} (${name})`;
    const html = `
      <h2>Ny lead</h2>
      <p><strong>Navn:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telefon:</strong> ${phone || "-"}</p>
      <p><strong>Virksomhed:</strong> ${company}</p>
      <p><strong>Website:</strong> ${website || "-"}</p>
      <hr />
      <p><strong>Mål:</strong> ${goal || "-"}</p>
      <p><strong>Budget:</strong> ${budget || "-"}</p>
      <p><strong>Tidshorisont:</strong> ${timeline || "-"}</p>
      <p><strong>Kanaler:</strong> ${channels.length ? channels.join(", ") : "-"}</p>
      <hr />
      <p><strong>Besked:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${clamp(
        message,
        8000,
      )}</pre>
      <hr />
      <p><strong>Lead ID:</strong> ${leadId || "-"}</p>
      <p><strong>Score:</strong> ${score}</p>
      <p><strong>Source:</strong> ${sourcePath}</p>
    `;
    try {
      await sendEmail({ to: notifyTo.join(","), subject, html });
    } catch (e) {
      // Don't fail lead creation if notification fails
      console.error("Lead notification email failed:", e);
    }
  }

  // Slack notification (best-effort)
  await notifySlack({
    leadId,
    name,
    company,
    email,
    phone,
    goal,
    budget,
    timeline,
    channels,
    message,
    sourcePath,
    score,
  });

  return res.status(200).json({ ok: true, id: leadId });
}

