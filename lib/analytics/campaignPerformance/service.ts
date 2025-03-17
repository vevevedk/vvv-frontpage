import { Pool } from 'pg';

interface CampaignPerformanceRecord {
  date: string;
  campaign_name: string;
  campaign_id: string;
  campaign_status: string;
  account_name: string;
  status: string;
  status_reasons: string;
  campaign_type: string;
  campaign_subtype: string;
  impressions: number;
  clicks: number;
  cost: number;
  currency_code: string;
  conversions: number;
  conversion_value: number;
  budget_name: string;
  budget: number;
  budget_type: string;
  recommended_budget: number;
  est_add_interactions_per_week: number;
  est_add_cost_per_week: number;
  bid_strategy: string;
  bid_strategy_type: string;
  target_cpa: number;
  target_roas: number;
  search_impression_share: string;
  search_top_is: string;
  search_abs_top_is: string;
  search_lost_is_rank: string;
  search_lost_top_is_rank: string;
  search_lost_abs_top_is_rank: string;
  search_lost_is_budget: string;
  search_exact_match_is: string;
  display_lost_is_budget: string;
  display_lost_is_rank: string;
  search_lost_top_is_budget: string;
  search_lost_abs_top_is_budget: string;
  relative_ctr: string;
  optimization_score: string;
  account_optimization_headroom: string;
  ad_changes: string;
  bid_changes: string;
  keyword_changes: string;
  network_changes: string;
  targeting_changes: string;
  budget_changes: string;
  status_changes: string;
}

export class CampaignPerformanceService {
  constructor(private pool: Pool) {}

  private cleanPercentageValue(value: string): string | null {
    if (!value || value === '--') return null;
    if (value.startsWith('>')) return value.slice(1).trim();
    if (value.startsWith('<')) return value.slice(1).trim();
    return value.replace('%', '').trim();
  }

  private cleanNumericValue(value: string | number): number | null {
    if (!value || value === '--') return null;
    const strValue = value.toString();
    return Number(strValue.replace(/,/g, ''));
  }

  private async upsertCampaign(clientId: number, record: CampaignPerformanceRecord) {
    const result = await this.pool.query(
      `INSERT INTO campaigns (
        client_id, campaign_id, campaign_name, campaign_status,
        status, status_reasons, campaign_type, campaign_subtype,
        account_name, update_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
      ON CONFLICT (client_id, campaign_id) 
      DO UPDATE SET 
        campaign_name = EXCLUDED.campaign_name,
        campaign_status = EXCLUDED.campaign_status,
        status = EXCLUDED.status,
        status_reasons = EXCLUDED.status_reasons,
        campaign_type = EXCLUDED.campaign_type,
        campaign_subtype = EXCLUDED.campaign_subtype,
        account_name = EXCLUDED.account_name,
        update_date = CURRENT_DATE
      RETURNING id`,
      [
        clientId,
        record.campaign_id,
        record.campaign_name,
        record.campaign_status,
        record.status,
        record.status_reasons,
        record.campaign_type,
        record.campaign_subtype,
        record.account_name
      ]
    );
    return result.rows[0].id;
  }

  private async upsertCampaignBudget(clientId: number, campaignId: string, record: CampaignPerformanceRecord) {
    await this.pool.query(
      `INSERT INTO campaign_budgets (
        client_id, campaign_id, budget_name, budget, budget_type,
        recommended_budget, est_add_interactions_per_week,
        est_add_cost_per_week, currency_code, update_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
      ON CONFLICT (client_id, campaign_id)
      DO UPDATE SET
        budget_name = EXCLUDED.budget_name,
        budget = EXCLUDED.budget,
        budget_type = EXCLUDED.budget_type,
        recommended_budget = EXCLUDED.recommended_budget,
        est_add_interactions_per_week = EXCLUDED.est_add_interactions_per_week,
        est_add_cost_per_week = EXCLUDED.est_add_cost_per_week,
        currency_code = EXCLUDED.currency_code,
        update_date = CURRENT_DATE`,
      [
        clientId,
        campaignId,
        record.budget_name,
        this.cleanNumericValue(record.budget),
        record.budget_type,
        this.cleanNumericValue(record.recommended_budget),
        this.cleanNumericValue(record.est_add_interactions_per_week),
        this.cleanNumericValue(record.est_add_cost_per_week),
        record.currency_code
      ]
    );
  }

  private async upsertBidStrategy(clientId: number, campaignId: string, record: CampaignPerformanceRecord) {
    await this.pool.query(
      `INSERT INTO campaign_bid_strategies (
        client_id, campaign_id, bid_strategy, bid_strategy_type,
        target_cpa, target_roas, update_date
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
      ON CONFLICT (client_id, campaign_id)
      DO UPDATE SET
        bid_strategy = EXCLUDED.bid_strategy,
        bid_strategy_type = EXCLUDED.bid_strategy_type,
        target_cpa = EXCLUDED.target_cpa,
        target_roas = EXCLUDED.target_roas,
        update_date = CURRENT_DATE`,
      [
        clientId,
        campaignId,
        record.bid_strategy,
        record.bid_strategy_type,
        this.cleanNumericValue(record.target_cpa),
        this.cleanNumericValue(record.target_roas)
      ]
    );
  }

  private async upsertOptimization(clientId: number, campaignId: string, record: CampaignPerformanceRecord) {
    await this.pool.query(
      `INSERT INTO campaign_optimization (
        client_id, campaign_id, account_optimization_headroom,
        ad_changes, bid_changes, keyword_changes,
        network_changes, targeting_changes, budget_changes,
        status_changes, update_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
      ON CONFLICT (client_id, campaign_id)
      DO UPDATE SET
        account_optimization_headroom = EXCLUDED.account_optimization_headroom,
        ad_changes = EXCLUDED.ad_changes,
        bid_changes = EXCLUDED.bid_changes,
        keyword_changes = EXCLUDED.keyword_changes,
        network_changes = EXCLUDED.network_changes,
        targeting_changes = EXCLUDED.targeting_changes,
        budget_changes = EXCLUDED.budget_changes,
        status_changes = EXCLUDED.status_changes,
        update_date = CURRENT_DATE`,
      [
        clientId,
        campaignId,
        record.account_optimization_headroom,
        record.ad_changes,
        record.bid_changes,
        record.keyword_changes,
        record.network_changes,
        record.targeting_changes,
        record.budget_changes,
        record.status_changes
      ]
    );
  }

  private async insertPerformanceDaily(clientId: number, record: CampaignPerformanceRecord) {
    await this.pool.query(
      `INSERT INTO campaign_performance_daily (
        client_id, campaign_id, date, impressions, clicks, cost,
        currency_code, conversions, conversion_value,
        search_impression_share, search_top_is, search_abs_top_is,
        search_lost_is_rank, search_lost_top_is_rank,
        search_lost_abs_top_is_rank, search_lost_is_budget,
        search_exact_match_is, display_lost_is_budget,
        display_lost_is_rank, search_lost_top_is_budget,
        search_lost_abs_top_is_budget, relative_ctr,
        optimization_score, update_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, CURRENT_DATE
      )
      ON CONFLICT (client_id, campaign_id, date)
      DO UPDATE SET
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        cost = EXCLUDED.cost,
        currency_code = EXCLUDED.currency_code,
        conversions = EXCLUDED.conversions,
        conversion_value = EXCLUDED.conversion_value,
        search_impression_share = EXCLUDED.search_impression_share,
        search_top_is = EXCLUDED.search_top_is,
        search_abs_top_is = EXCLUDED.search_abs_top_is,
        search_lost_is_rank = EXCLUDED.search_lost_is_rank,
        search_lost_top_is_rank = EXCLUDED.search_lost_top_is_rank,
        search_lost_abs_top_is_rank = EXCLUDED.search_lost_abs_top_is_rank,
        search_lost_is_budget = EXCLUDED.search_lost_is_budget,
        search_exact_match_is = EXCLUDED.search_exact_match_is,
        display_lost_is_budget = EXCLUDED.display_lost_is_budget,
        display_lost_is_rank = EXCLUDED.display_lost_is_rank,
        search_lost_top_is_budget = EXCLUDED.search_lost_top_is_budget,
        search_lost_abs_top_is_budget = EXCLUDED.search_lost_abs_top_is_budget,
        relative_ctr = EXCLUDED.relative_ctr,
        optimization_score = EXCLUDED.optimization_score,
        update_date = CURRENT_DATE`,
      [
        clientId,
        record.campaign_id,
        record.date,
        this.cleanNumericValue(record.impressions),
        this.cleanNumericValue(record.clicks),
        this.cleanNumericValue(record.cost),
        record.currency_code,
        this.cleanNumericValue(record.conversions),
        this.cleanNumericValue(record.conversion_value),
        this.cleanPercentageValue(record.search_impression_share),
        this.cleanPercentageValue(record.search_top_is),
        this.cleanPercentageValue(record.search_abs_top_is),
        this.cleanPercentageValue(record.search_lost_is_rank),
        this.cleanPercentageValue(record.search_lost_top_is_rank),
        this.cleanPercentageValue(record.search_lost_abs_top_is_rank),
        this.cleanPercentageValue(record.search_lost_is_budget),
        this.cleanPercentageValue(record.search_exact_match_is),
        this.cleanPercentageValue(record.display_lost_is_budget),
        this.cleanPercentageValue(record.display_lost_is_rank),
        this.cleanPercentageValue(record.search_lost_top_is_budget),
        this.cleanPercentageValue(record.search_lost_abs_top_is_budget),
        this.cleanPercentageValue(record.relative_ctr),
        this.cleanPercentageValue(record.optimization_score)
      ]
    );
  }

  private async getClientIdFromAccount(accountName: string): Promise<number | null> {
    const result = await this.pool.query(
      `SELECT id FROM clients WHERE LOWER(account_name) = LOWER($1)`,
      [accountName]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  private async ensureClientHasAccount(clientId: number, accountName: string): Promise<void> {
    await this.pool.query(
      `UPDATE clients 
       SET account_name = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       AND (account_name IS NULL OR account_name != $1)`,
      [accountName, clientId]
    );
  }

  async processRecord(clientId: number | 'all', record: CampaignPerformanceRecord) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // If clientId is 'all', look up the client by account name
      let effectiveClientId: number;
      if (clientId === 'all') {
        const foundClientId = await this.getClientIdFromAccount(record.account_name);
        if (!foundClientId) {
          throw new Error(`No client found for account: ${record.account_name}`);
        }
        effectiveClientId = foundClientId;
      } else {
        effectiveClientId = clientId;
        // Ensure the client's account name is set/updated
        await this.ensureClientHasAccount(effectiveClientId, record.account_name);
      }

      // Insert/update campaign first
      await this.upsertCampaign(effectiveClientId, record);

      // Insert/update related data
      await Promise.all([
        this.upsertCampaignBudget(effectiveClientId, record.campaign_id, record),
        this.upsertBidStrategy(effectiveClientId, record.campaign_id, record),
        this.upsertOptimization(effectiveClientId, record.campaign_id, record),
        this.insertPerformanceDaily(effectiveClientId, record)
      ]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}