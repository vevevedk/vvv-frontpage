-- 007_create_leads_table.sql
-- Stores boutique agency inbound leads (veveve.dk)

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

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_updated_at ON leads;
CREATE TRIGGER leads_set_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

