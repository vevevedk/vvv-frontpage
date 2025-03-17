-- Create enum types for various classifications
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'removed');
CREATE TYPE budget_type AS ENUM ('daily', 'lifetime', 'monthly');
CREATE TYPE targeting_type AS ENUM ('search', 'display', 'shopping', 'video');
CREATE TYPE query_type AS ENUM ('brand', 'generic', 'competitor', 'other');

-- Create campaigns table
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status campaign_status NOT NULL DEFAULT 'active',
    bid_strategy VARCHAR(100),
    targeting_type targeting_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, campaign_id)
);

-- Create campaign budgets table
CREATE TABLE campaign_budgets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    amount DECIMAL(12,2) NOT NULL,
    budget_type budget_type NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create campaign classifications table
CREATE TABLE campaign_classifications (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    query_type query_type NOT NULL,
    custom_classification VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign performance daily table
CREATE TABLE campaign_performance_daily (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    date DATE NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    average_position DECIMAL(5,2),
    quality_score DECIMAL(3,1),
    search_impression_share DECIMAL(5,2),
    search_top_impression_share DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_campaign_performance_date ON campaign_performance_daily(date);
CREATE INDEX idx_campaign_performance_campaign_date ON campaign_performance_daily(campaign_id, date);
CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaign_classifications_type ON campaign_classifications(query_type);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_budgets_updated_at
    BEFORE UPDATE ON campaign_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_classifications_updated_at
    BEFORE UPDATE ON campaign_classifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_performance_daily_updated_at
    BEFORE UPDATE ON campaign_performance_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 