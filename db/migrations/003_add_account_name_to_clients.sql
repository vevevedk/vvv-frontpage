-- Add account_name column to clients table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'account_name'
    ) THEN
        ALTER TABLE clients ADD COLUMN account_name VARCHAR(255);
        -- Add an index for faster lookups
        CREATE INDEX idx_clients_account_name ON clients (account_name);
    END IF;
END $$;

-- Update the migrations table
INSERT INTO migrations (name, executed_at) 
VALUES ('003_add_account_name_to_clients', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING; 