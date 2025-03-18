# PCC App Stock Management Feature Specification

## Overview
The stock management feature aims to ensure that each client account has the correct setup of campaigns based on their specific account configuration. This feature will automate the process of maintaining properly configured campaigns across different targeting types, query types, and language/location combinations.

## Initial Scope
For the initial implementation, we will focus on:
- **Targeting Type**: standard-shopping
- **Query Type**: product-serie

## Data Sources
We need to pull data from two primary sources:
1. Google Merchant Center (GMC)
2. Google Ads

## Implementation Strategy

### Phase 1: Data Ingestion

#### Google Merchant Center
- Investigate using the Content API for Shopping to automatically fetch product data
- Focus on retrieving product-serie information for each client
- Design database schema to store GMC data efficiently
- Implement daily/scheduled data synchronization

**Key Investigation Points:**
- Content API authentication and access requirements
- API rate limits and quotas
- Required permissions for each client account
- Data structure and mapping to our database schema

#### Google Ads
Since we don't currently have API token access for Google Ads API, we'll implement an interim solution:

- Utilize Google Ads Scripts to export ad group level data
- Create scripts to:
  - Extract campaign performance data for standard-shopping campaigns
  - Focus on product-serie query types
  - Format data for PostgreSQL ingestion
  - Schedule daily exports

**Key Investigation Points:**
- Google Ads Script capabilities and limitations
- Authentication method for scripts
- Data export format options
- Method for automated transfer to our PostgreSQL database
- Schedule management and error handling

### Phase 2: Database Schema

Design the PostgreSQL schema to support:
- Client account configurations
- Campaign structures and hierarchies
- Targeting type classifications
- Query type mappings
- Language and location combinations
- Performance metrics

```sql
-- Example tables (to be refined during implementation)
CREATE TABLE account_configurations (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    targeting_types JSONB,
    query_types JSONB,
    language_locations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    targeting_type VARCHAR(255) NOT NULL,
    query_type VARCHAR(255) NOT NULL,
    language_location VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables for performance metrics, products, etc.
```

### Phase 3: Business Logic

Implement the core logic to:
1. Analyze client account configurations
2. Compare existing campaign setups with required configurations
3. Identify missing campaigns or incorrect setups
4. Generate recommendations for campaign adjustments
5. Track historical changes and performance impact

### Future Phases

After successfully implementing the initial scope, we'll expand to include:
- Additional targeting types (pmax-shopping, search-exact, etc.)
- Additional query types (category, product-brand, etc.)
- UI features for monitoring and management
- Automated campaign adjustments
- Performance reporting and insights

## Technical Requirements

### Google Merchant Center Integration
- Content API for Shopping access
- OAuth 2.0 authentication
- Regular data synchronization process
- Error handling and retry logic

### Google Ads Script Implementation
```javascript
// Example Google Ads Script structure
function main() {
  // Configuration
  const CONFIG = {
    spreadsheetUrl: 'YOUR_SPREADSHEET_URL',
    dateRange: 'LAST_30_DAYS'
  };
  
  // Get all standard shopping campaigns
  const shoppingCampaigns = getStandardShoppingCampaigns();
  
  // Filter for product-serie query types
  const productSerieCampaigns = filterByQueryType(shoppingCampaigns, 'product-serie');
  
  // Extract performance data
  const performanceData = extractPerformanceData(productSerieCampaigns);
  
  // Export data
  exportToSpreadsheet(performanceData, CONFIG.spreadsheetUrl);
}

// Helper functions
function getStandardShoppingCampaigns() {
  // Implementation details
}

function filterByQueryType(campaigns, queryType) {
  // Implementation details
}

function extractPerformanceData(campaigns) {
  // Implementation details
}

function exportToSpreadsheet(data, spreadsheetUrl) {
  // Implementation details
}
```

### PostgreSQL Integration
- Connection pooling
- Transaction management
- Efficient query design for large datasets
- Indexing strategy for performance

## Next Steps for Development Team

1. **Investigation Phase** (1-2 weeks)
   - Research Content API for Shopping capabilities and requirements
   - Explore Google Ads Script limitations and data export options
   - Design initial database schema
   - Document API endpoints and data structures

2. **Proof of Concept** (2-3 weeks)
   - Implement GMC data fetching for a single test account
   - Create Google Ads Script for exporting campaign data
   - Set up database tables and import processes
   - Develop basic business logic for campaign analysis

3. **Implementation Phase** (3-4 weeks)
   - Complete data ingestion pipelines
   - Implement full business logic
   - Create automated processes for daily updates
   - Develop monitoring and error handling

4. **Testing and Validation** (2 weeks)
   - Verify data accuracy
   - Test system with multiple client accounts
   - Benchmark performance
   - Gather feedback for improvements

5. **Documentation and Handoff** (1 week)
   - Complete technical documentation
   - Prepare for UI phase development
   - Knowledge transfer sessions

## Open Questions

- What are the specific metrics needed from Google Ads for analysis?
- How frequently should data be refreshed from each source?
- What are the client-specific configurations that need to be considered?
- Are there any special handling requirements for different markets or languages?
- What are the permission requirements for accessing client GMC and Google Ads accounts?

## Resources

- [Google Merchant Center Content API Documentation](https://developers.google.com/shopping-content/v2/quickstart)
- [Google Ads Scripts Documentation](https://developers.google.com/google-ads/scripts/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) 