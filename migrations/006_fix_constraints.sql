-- Migration: Update client accounts constraints
-- Description: Add account_type to unique constraint

-- First, view existing constraints (for verification)
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'client_accounts'::regclass;

-- Drop existing constraint
ALTER TABLE client_accounts 
DROP CONSTRAINT IF EXISTS client_accounts_unique_per_client;

-- Add new constraint including account_type
ALTER TABLE client_accounts 
ADD CONSTRAINT client_accounts_unique_combination 
UNIQUE (client_id, account_type, account_id);