# Campaign Performance Daily Data Ingestion

## Overview
This document outlines the data structure and ingestion process for Google Ads campaign performance data. The system uses a normalized database schema to store various aspects of campaign data efficiently.

## Database Schema

### 1. campaign_performance_daily
Stores daily performance metrics for each campaign.

```sql
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
    optimization_score VARCHAR(10)
);
```

### 2. campaigns
Stores campaign metadata.

```sql
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
    UNIQUE(client_id, campaign_id)
);
```

### 3. campaign_budgets
Stores budget information.

```sql
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
    UNIQUE(client_id, campaign_id)
);
```

### 4. campaign_bid_strategies
Stores bidding strategy information.

```sql
CREATE TABLE campaign_bid_strategies (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    campaign_id BIGINT NOT NULL,
    bid_strategy VARCHAR(255),
    bid_strategy_type VARCHAR(50),
    target_cpa DECIMAL(15,2),
    target_roas DECIMAL(15,2),
    UNIQUE(client_id, campaign_id)
);
```

### 5. campaign_optimization
Stores optimization recommendations.

```sql
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
    UNIQUE(client_id, campaign_id)
);
```

## Required CSV Columns
The following columns are required in the Google Ads performance report CSV:

- Day
- Campaign
- Campaign ID
- Campaign state
- Impr.
- Clicks
- Cost
- Conversions
- Conv. value
- Search impr. share

## Column Mappings
CSV columns are mapped to database fields as follows:

```typescript
{
    'Day': 'date',
    'Campaign': 'campaign_name',
    'Campaign ID': 'campaign_id',
    'Campaign state': 'campaign_status',
    'Impr.': 'impressions',
    'Clicks': 'clicks',
    'Cost': 'cost',
    'Conversions': 'conversions',
    'Conv. value': 'conversion_value',
    'Search impr. share': 'search_impression_share',
    'Search top IS': 'search_top_is',
    'Search abs. top IS': 'search_abs_top_is',
    'Search lost IS (rank)': 'search_lost_is_rank',
    'Search lost top IS (rank)': 'search_lost_top_is_rank',
    'Search lost abs. top IS (rank)': 'search_lost_abs_top_is_rank',
    'Search lost IS (budget)': 'search_lost_is_budget',
    'Search exact match IS': 'search_exact_match_is',
    'Click share': 'click_share',
    'Relative CTR': 'relative_ctr',
    'Optimization score': 'optimization_score',
    'Budget': 'budget',
    'Budget type': 'budget_type',
    'Bid Strategy Type': 'bid_strategy_type',
    'Target CPA': 'target_cpa',
    'Target ROAS': 'target_roas'
}
```

## Data Processing Steps

1. **File Upload**
   - User selects client and uploads CSV file
   - System validates required columns
   - System checks file format and data types

2. **Data Transformation**
   - Parse CSV data
   - Map columns to database fields
   - Clean and validate data values
   - Convert data types as needed

3. **Data Storage**
   - Insert performance metrics into campaign_performance_daily
   - Update or insert campaign metadata into campaigns
   - Update or insert budget information into campaign_budgets
   - Update or insert bid strategy data into campaign_bid_strategies
   - Update or insert optimization data into campaign_optimization

4. **Data Quality Checks**
   - Validate numeric values
   - Check for missing required fields
   - Verify date formats
   - Ensure referential integrity

## Performance Considerations

1. **Indexes**
```sql
CREATE INDEX idx_campaign_perf_date ON campaign_performance_daily(date);
CREATE INDEX idx_campaign_perf_client ON campaign_performance_daily(client_id);
CREATE INDEX idx_campaign_perf_campaign ON campaign_performance_daily(campaign_id);
CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_campaigns_campaign ON campaigns(campaign_id);
```

2. **Batch Processing**
   - Process records in batches for better performance
   - Use prepared statements for database operations
   - Implement transaction management

3. **Error Handling**
   - Log all errors with context
   - Implement rollback mechanisms
   - Provide clear error messages to users

## Data Quality Monitoring

1. **Metrics Tracked**
   - Record counts
   - Missing values
   - Data type violations
   - Value range violations
   - Relationship violations

2. **Quality Alerts**
   - Significant changes in key metrics
   - Missing data patterns
   - Unusual value distributions
   - Processing errors

## Usage

To upload campaign performance data:
1. Select "Campaign Performance Daily" as the data type
2. Choose the client
3. Upload the Google Ads performance report CSV
4. Review the validation results
5. Confirm the upload if validation passes

# Data Handling Requirements for Google Ads Campaign Performance Data

## CSV Data Processing Rules

### 1. NULL/Empty Values
- Input format: `--` (double dash)
- Appears in:
  - Text fields (e.g., Budget name)
  - Numeric fields (e.g., Target CPA, Target ROAS)
  - Percentage fields
- Processing rule: Convert all `--` values to NULL in database

### 2. Percentage Values
- Input format: `XX.XX%` (e.g., "100.00%", "69.23%")
- Special cases:
  - `> 90%` → Store as 90.0 with flag
  - `< 10%` → Store as 10.0 with flag
- Processing rules:
  - Strip % symbol
  - Convert to decimal number
  - For special cases, consider adding flag columns (e.g., is_greater_than, is_less_than)
- Affected columns:
  - search_impression_share
  - search_top_is
  - search_abs_top_is
  - search_lost_is_rank
  - search_lost_top_is_rank
  - search_lost_abs_top_is_rank
  - search_lost_is_budget
  - search_exact_match_is
  - display_lost_is_rank
  - display_lost_is_budget

### 3. Date Values
- Input format: YYYY-MM-DD
- Example: "2025-01-12"
- Processing rule: Direct PostgreSQL date format, no transformation needed
- Affected columns:
  - Day (date)
  - update_date

### 4. Currency Values
- Input format: XX.XX (e.g., "250.00", "14.65")
- Characteristics:
  - Always 2 decimal places
  - No thousand separators
  - Currency code in separate column
- Processing rules:
  - Parse as Decimal(15,2)
  - Store currency code separately
- Affected columns:
  - Budget
  - Cost
  - Recommended budget
  - Target CPA
  - Target ROAS

### 5. Integer Values with Thousand Separators
- Input format: Uses comma as thousand separator
- Example: "2,047" for impressions
- Processing rule: Remove commas before converting to integer
- Affected columns:
  - Impr.
  - Clicks
  - Est. add. interactions/wk

## Implementation Notes

```python
# Example data cleaning function structure
def clean_google_ads_csv_value(value: str, column_type: str) -> Any:
    """
    Clean Google Ads CSV data based on column type
    
    Args:
        value: Raw value from CSV
        column_type: One of 'percentage', 'currency', 'integer', 'date'
        
    Returns:
        Cleaned value in appropriate Python type
    """
    if value.strip() == '--':
        return None
    # ... rest of implementation
```

## Data Quality Checks
- Verify currency code matches expected value (e.g., 'DKK')
- Ensure all percentage values are between 0-100
- Validate date formats
- Check for unexpected thousand separators
- Verify no negative values in metrics (impressions, clicks, cost)

## Additional Processing Requirements

### Campaign Identifiers
- Campaign IDs are large integers (e.g., 21864065231)
- Must validate ID format and length
- Campaign IDs are unique within a client account

### Status and State Management
- Campaign status values:
  - "Enabled"
  - "Paused"
- Status values:
  - "Eligible (Limited)"
  - "Paused"
- Status reasons may contain multiple reasons separated by semicolon
  - Example: "limited by bidding strategy type; unknown"

### Currency Handling
- Primary currency observed: "DKK"
- Requirements:
  - Validate currency codes against ISO 4217
  - Store original currency with amounts
  - Consider future currency conversion needs

### Data Deduplication Rules
1. Primary key combination:
   - client_id
   - campaign_id
   - date
2. Update logic:
   - If row exists: update with new values
   - If row doesn't exist: insert new record
3. Track update_date for data freshness

### Campaign Name Specifications
- May contain special characters (=, &, *, etc.)
- Format patterns observed:
  - Parameter-style: "lg=da&lc=holstebro&tt=search-exact&ct=*"
  - Plain text: "CrossFit Holstebro"
- Maximum length: 255 characters
- No character restrictions (store as-is)

### Bid Strategy Specifications
- Known strategy types:
  - "CPC (enhanced)"
  - "Maximize clicks"
- Store original values without modification
- Consider adding strategy type validation

### Error Handling
1. Data Validation Errors:
   - Invalid currency codes
   - Malformed dates
   - Invalid numeric values
2. Processing Errors:
   - Duplicate records
   - Missing required fields
   - Referential integrity violations
3. Error Response:
   - Log detailed error information
   - Provide user-friendly error messages
   - Support partial success with error records 