import { Pool } from 'pg';
import { dataQualityConfigs } from './config';

export class DataQualityService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async calculateQualityMetrics(clientId: number, tableName: string) {
    try {
      // First check if table exists
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `;
      const tableExists = await this.pool.query(tableExistsQuery, [tableName]);
      
      if (!tableExists.rows[0].exists) {
        return {
          rowCount: 0,
          dateRange: null,
          lastUpdate: null,
          qualityScore: 0,
          message: 'Table does not exist yet'
        };
      }

      // If table exists, proceed with metrics calculation
      const countQuery = `SELECT COUNT(*) FROM ${tableName} WHERE client_id = $1`;
      const countResult = await this.pool.query(countQuery, [clientId]);
      const rowCount = parseInt(countResult.rows[0].count);

      // Get date range
      const dateQuery = `
        SELECT 
          MIN(date) as min_date,
          MAX(date) as max_date,
          MAX(updated_at) as last_update
        FROM ${tableName}
        WHERE client_id = $1
      `;
      const dateResult = await this.pool.query(dateQuery, [clientId]);
      const { min_date, max_date, last_update } = dateResult.rows[0];

      return {
        rowCount,
        dateRange: {
          start: min_date,
          end: max_date
        },
        lastUpdate: last_update,
        qualityMetrics: {
          stabilityScore: 98,  // Mock values for now
          recentChanges: 5,
          confidenceScore: 95,
          completenessScore: 97,
          consistencyScore: 96
        }
      };
    } catch (error) {
      console.error('Error calculating quality metrics:', error);
      return {
        rowCount: 0,
        dateRange: null,
        lastUpdate: null,
        qualityScore: 0,
        message: 'Error calculating metrics'
      };
    }
  }

  async validateData(data: any[], tableName: string) {
    // Add validation logic here
    return {
      isValid: true,
      errors: []
    };
  }

  async evaluateRecord(
    sourceTable: string,
    recordId: number,
    newData: any,
    oldData?: any
  ) {
    const config = dataQualityConfigs[sourceTable];
    if (!config) {
      throw new Error(`No configuration found for ${sourceTable}`);
    }

    // Calculate completeness
    const completenessScore = this.calculateCompleteness(newData, config);

    // Calculate consistency if we have old data
    const consistencyScore = oldData 
      ? this.calculateConsistency(newData, oldData, config)
      : 100;

    // Calculate state
    const state = this.determineState(newData, config);

    // Calculate change percentage for numeric fields
    const changePercentage = oldData 
      ? this.calculateChange(newData, oldData)
      : 0;

    // Overall confidence score
    const confidenceScore = (completenessScore + consistencyScore) / 2;

    // Store the evaluation
    await this.storeQualityMetrics({
      sourceTable,
      recordId,
      state,
      confidenceScore,
      completenessScore,
      consistencyScore,
      previousValue: oldData,
      currentValue: newData,
      changePercentage,
      isSignificantChange: Math.abs(changePercentage) > config.varianceThreshold
    });

    return {
      state,
      confidenceScore,
      completenessScore,
      consistencyScore,
      changePercentage,
      isSignificantChange: Math.abs(changePercentage) > config.varianceThreshold
    };
  }

  private calculateCompleteness(data: any, config: DataQualityConfig): number {
    const requiredFields = config.requiredFields;
    const presentFields = requiredFields.filter(field => 
      data[field] !== undefined && data[field] !== null
    );
    return (presentFields.length / requiredFields.length) * 100;
  }

  private calculateConsistency(newData: any, oldData: any, config: DataQualityConfig): number {
    // Implement consistency checks based on your rules
    // For now, returning 100 if no significant changes
    return Math.abs(this.calculateChange(newData, oldData)) <= config.varianceThreshold ? 100 : 50;
  }

  private calculateChange(newData: any, oldData: any): number {
    // Calculate percentage change for numeric fields
    const changes: number[] = [];
    
    for (const [key, newValue] of Object.entries(newData)) {
      const oldValue = oldData[key];
      if (typeof newValue === 'number' && typeof oldValue === 'number' && oldValue !== 0) {
        changes.push(((newValue - oldValue) / oldValue) * 100);
      }
    }
    
    return changes.length ? changes.reduce((a, b) => a + b) / changes.length : 0;
  }

  private determineState(data: any, config: DataQualityConfig): data_state {
    const recordDate = new Date(data.date);
    const daysSinceRecord = Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceRecord < config.maturityPeriod) {
      return 'preliminary';
    } else if (daysSinceRecord < config.maturityPeriod * 2) {
      return 'maturing';
    } else {
      return 'stable';
    }
  }

  private async storeQualityMetrics(metrics: any) {
    await this.pool.query(
      `INSERT INTO data_quality_metrics (
        source_table, record_id, state, confidence_score, 
        completeness_score, consistency_score, previous_value,
        current_value, change_percentage, is_significant_change
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        metrics.sourceTable,
        metrics.recordId,
        metrics.state,
        metrics.confidenceScore,
        metrics.completenessScore,
        metrics.consistencyScore,
        metrics.previousValue,
        metrics.currentValue,
        metrics.changePercentage,
        metrics.isSignificantChange
      ]
    );
  }
}

export default DataQualityService; 