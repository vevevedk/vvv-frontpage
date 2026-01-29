-- 008_alter_leads_add_notes_assignment.sql
-- Adds internal triage fields to leads

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to text NULL,
  ADD COLUMN IF NOT EXISTS notes text NULL;

CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to);

