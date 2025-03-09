-- Create campaign performance tables
CREATE TABLE campaign_performance_daily (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    conversions DECIMAL(15,2) NOT NULL DEFAULT 0,
    conversion_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    search_impression_share VARCHAR(10),
    search_top_is VARCHAR(10),
    search_abs_top_is VARCHAR(10),
    search_lost_is_rank VARCHAR(10),
    search_lost_top_is_rank VARCHAR(10),
    search_lost_abs_top_is_rank VARCHAR(10),
    search_lost_is_budget VARCHAR(10),
    search_exact_match_is VARCHAR(10),
    click_share VARCHAR(10),
    relative_ctr VARCHAR(10),
    optimization_score VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_status VARCHAR(50),
    status VARCHAR(50),
    status_reasons TEXT,
    campaign_type VARCHAR(50),
    campaign_subtype VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, campaign_id)
);

CREATE TABLE campaign_budgets (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    budget_name VARCHAR(255),
    budget DECIMAL(15,2),
    budget_type VARCHAR(50),
    recommended_budget DECIMAL(15,2),
    est_add_interactions_per_week INTEGER,
    est_add_cost_per_week DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, campaign_id)
);

CREATE TABLE campaign_bid_strategies (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    bid_strategy VARCHAR(255),
    bid_strategy_type VARCHAR(50),
    target_cpa DECIMAL(15,2),
    target_roas DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, campaign_id)
);

CREATE TABLE campaign_optimization (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    account_optimization_headroom VARCHAR(50),
    all_changes VARCHAR(50),
    keyword_changes VARCHAR(50),
    ad_changes VARCHAR(50),
    budget_changes VARCHAR(50),
    status_changes VARCHAR(50),
    network_changes VARCHAR(50),
    bid_changes VARCHAR(50),
    targeting_changes VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, campaign_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_campaign_perf_date ON campaign_performance_daily(date);
CREATE INDEX idx_campaign_perf_client ON campaign_performance_daily(client_id);
CREATE INDEX idx_campaign_perf_campaign ON campaign_performance_daily(campaign_id);
CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaigns_campaign ON campaigns(campaign_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_campaign_performance_daily_updated_at
    BEFORE UPDATE ON campaign_performance_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_budgets_updated_at
    BEFORE UPDATE ON campaign_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_bid_strategies_updated_at
    BEFORE UPDATE ON campaign_bid_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_optimization_updated_at
    BEFORE UPDATE ON campaign_optimization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 