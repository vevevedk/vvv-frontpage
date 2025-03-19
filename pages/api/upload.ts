import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import formidable from 'formidable';
import { parse } from 'csv-parse';
import { promises as fs } from 'fs';
import { pool } from '../../lib/db';
import { DataQualityService } from '../../lib/analytics/dataQuality/service';
import { CampaignPerformanceService } from '../../lib/analytics/campaignPerformance/service';

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface DataTypeConfig {
  id: string;
  requiredColumns: string[];
  columnMappings: Record<string, string>;  // Add column mappings
  tables: string[];
}

const DATA_TYPES: Record<string, DataTypeConfig> = {
  'search_console_daily': {
    id: 'search_console_daily',
    requiredColumns: ['date', 'query', 'page', 'clicks', 'impressions', 'position', 'ctr'],
    columnMappings: {
      'Date': 'date',
      'Query': 'query',
      'Landing Page': 'page',
      'Url Clicks': 'clicks',
      'Impressions': 'impressions',
      'Average Position': 'position'
    },
    tables: ['search_console_data']
  },
  'campaign_performance_daily': {
    id: 'campaign_performance_daily',
    requiredColumns: [
      'Day',
      'Campaign',
      'Campaign ID',
      'Account',
      'Campaign status',
      'Impr.',
      'Clicks',
      'Cost',
      'Currency code',
      'Conversions',
      'Conv. value',
      'Search impr. share',
      'Search top IS',
      'Search abs. top IS',
      'Search lost IS (rank)',
      'Search lost top IS (rank)',
      'Search lost abs. top IS (rank)',
      'Search lost IS (budget)',
      'Search exact match IS',
      'Display lost IS (budget)',
      'Display lost IS (rank)',
      'Search lost top IS (budget)',
      'Search lost abs. top IS (budget)',
      'Relative CTR',
      'Optimization score',
      'Account optimization headroom',
      'Ad changes',
      'Bid changes',
      'Keyword changes',
      'Network changes',
      'Targeting changes',
      'Budget changes',
      'Status changes'
    ],
    columnMappings: {
      'Day': 'date',
      'Campaign': 'campaign_name',
      'Campaign ID': 'campaign_id',
      'Campaign status': 'campaign_status',
      'Account': 'account_name',
      'Status': 'status',
      'Status reasons': 'status_reasons',
      'Campaign type': 'campaign_type',
      'Campaign subtype': 'campaign_subtype',
      'Impr.': 'impressions',
      'Clicks': 'clicks',
      'Cost': 'cost',
      'Currency code': 'currency_code',
      'Conversions': 'conversions',
      'Conv. value': 'conversion_value',
      'Budget name': 'budget_name',
      'Budget': 'budget',
      'Budget type': 'budget_type',
      'Bid strategy': 'bid_strategy',
      'Bid strategy type': 'bid_strategy_type',
      'Search impr. share': 'search_impression_share',
      'Search top IS': 'search_top_is',
      'Search abs. top IS': 'search_abs_top_is',
      'Search lost IS (rank)': 'search_lost_is_rank',
      'Search lost top IS (rank)': 'search_lost_top_is_rank',
      'Search lost abs. top IS (rank)': 'search_lost_abs_top_is_rank',
      'Search lost IS (budget)': 'search_lost_is_budget',
      'Search exact match IS': 'search_exact_match_is',
      'Display lost IS (budget)': 'display_lost_is_budget',
      'Display lost IS (rank)': 'display_lost_is_rank',
      'Search lost top IS (budget)': 'search_lost_top_is_budget',
      'Search lost abs. top IS (budget)': 'search_lost_abs_top_is_budget',
      'Relative CTR': 'relative_ctr',
      'Optimization score': 'optimization_score',
      'Account optimization headroom': 'account_optimization_headroom',
      'Ad changes': 'ad_changes',
      'Bid changes': 'bid_changes',
      'Keyword changes': 'keyword_changes',
      'Network changes': 'network_changes',
      'Targeting changes': 'targeting_changes',
      'Budget changes': 'budget_changes',
      'Status changes': 'status_changes'
    },
    tables: ['campaign_performance_daily', 'campaigns', 'campaign_budgets']
  },
  'analytics_daily': {
    id: 'analytics_daily',
    requiredColumns: ['Date', 'Users', 'New Users', 'Sessions', 'Bounce Rate', 'Pages / Session', 'Avg. Session Duration'],
    columnMappings: {
      'Date': 'date',
      'Users': 'users',
      'New Users': 'new_users',
      'Sessions': 'sessions',
      'Bounce Rate': 'bounce_rate',
      'Pages / Session': 'pages_per_session',
      'Avg. Session Duration': 'avg_session_duration'
    },
    tables: ['analytics_data']
  }
};

const router = createRouter<NextApiRequest, NextApiResponse>();

// Initialize the service with the pool
const dataQualityService = new DataQualityService(pool);

router.post(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('[Upload] Starting validation...');

  try {
    const form = formidable({});
    
    const [fields, files] = await form.parse(req);
    console.log('[Upload] Parsed fields:', fields);
    console.log('[Upload] Parsed files:', files);

    const clientId = fields.clientId?.[0];
    const dataType = fields.dataType?.[0];
    const file = files.file?.[0];

    if (!clientId) {
      console.log('[Upload] Missing clientId');
      return res.status(400).json({ message: 'Client ID is required' });
    }

    if (!dataType) {
      console.log('[Upload] Missing data type');
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!file) {
      console.log('[Upload] Missing file');
      return res.status(400).json({ message: 'File is required' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Helper function to send progress
    const sendProgress = (processed: number, total: number, status: string, completed = false, result?: any) => {
      res.write(`data: ${JSON.stringify({ processed, total, status, completed, result })}\n\n`);
    };

    // Add timestamp to all console logs
    const log = (message: string) => {
      console.log(`[${new Date().toISOString()}] ${message}`);
    };

    log('Starting upload process');
    
    if (!file || !file.filepath) {
      throw new Error('No file uploaded');
    }

    // Read and process the CSV file
    const fileContent = await fs.readFile(file.filepath, 'utf-8');

    // First parse just the headers
    const headerParser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      from: 1,
      to: 1
    });

    const headers = Object.keys(await new Promise((resolve) => {
      headerParser.on('data', resolve);
    }));

    // Validate data type
    const dataTypeConfig = DATA_TYPES[dataType as string];
    if (!dataTypeConfig) {
      throw new Error(`Invalid data type: ${dataType}`);
    }

    // Check for required columns using mappings
    const missingColumns = dataTypeConfig.requiredColumns.filter(requiredCol => {
      const hasMapping = Object.entries(dataTypeConfig.columnMappings)
        .some(([csvCol, mappedCol]) => {
          return mappedCol === requiredCol && headers.includes(csvCol);
        });
      
      // Special case for ctr as it's calculated
      if (requiredCol === 'ctr') return false;
      
      return !hasMapping;
    });

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Parse data and map columns
    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Initialize services based on data type
    let service;
    if (dataType === 'campaign_performance_daily') {
      service = new CampaignPerformanceService(pool);
    }

    let processed = 0;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // If clientId is 'all', we'll need to look up clients by account name
    const isAllClients = clientId === 'all';
    
    // Cache account to client mappings if processing all clients
    let accountClientMap: Record<string, number> = {};
    if (isAllClients) {
      const accountMappings = await pool.query(
        `SELECT id, account_name FROM clients WHERE account_name IS NOT NULL`
      );
      accountClientMap = accountMappings.rows.reduce((acc, row) => {
        acc[row.account_name.toLowerCase()] = row.id;
        return acc;
      }, {});
    }

    for await (const row of parser) {
      try {
        if (dataType === 'campaign_performance_daily') {
          // Determine client ID based on account name if processing all clients
          let effectiveClientId = Number(clientId);
          if (isAllClients) {
            const accountName = row['Account']?.toLowerCase();
            effectiveClientId = accountClientMap[accountName];
            
            if (!effectiveClientId) {
              log(`Skipping record - no matching client for account: ${row['Account']}`);
              skipped++;
              continue;
            }
          }

          const mappedRecord = {
            date: row['Day'],
            campaign_name: row['Campaign'],
            campaign_id: row['Campaign ID'],
            campaign_status: row['Campaign status'],
            account_name: row['Account'],
            status: row['Status'],
            status_reasons: row['Status reasons'],
            campaign_type: row['Campaign type'],
            campaign_subtype: row['Campaign subtype'],
            impressions: Number(row['Impr.']),
            clicks: Number(row['Clicks']),
            cost: Number(row['Cost']),
            currency_code: row['Currency code'],
            conversions: Number(row['Conversions']),
            conversion_value: Number(row['Conv. value']),
            budget_name: row['Budget name'],
            budget: row['Budget'] ? Number(row['Budget']) : undefined,
            budget_type: row['Budget type'],
            bid_strategy: row['Bid strategy'],
            bid_strategy_type: row['Bid strategy type'],
            search_impression_share: row['Search impr. share'],
            search_top_is: row['Search top IS'],
            search_abs_top_is: row['Search abs. top IS'],
            search_lost_is_rank: row['Search lost IS (rank)'],
            search_lost_top_is_rank: row['Search lost top IS (rank)'],
            search_lost_abs_top_is_rank: row['Search lost abs. top IS (rank)'],
            search_lost_is_budget: row['Search lost IS (budget)'],
            search_exact_match_is: row['Search exact match IS'],
            display_lost_is_budget: row['Display lost IS (budget)'],
            display_lost_is_rank: row['Display lost IS (rank)'],
            search_lost_top_is_budget: row['Search lost top IS (budget)'],
            search_lost_abs_top_is_budget: row['Search lost abs. top IS (budget)'],
            relative_ctr: row['Relative CTR'],
            optimization_score: row['Optimization score'],
            account_optimization_headroom: row['Account optimization headroom'],
            ad_changes: row['Ad changes'],
            bid_changes: row['Bid changes'],
            keyword_changes: row['Keyword changes'],
            network_changes: row['Network changes'],
            targeting_changes: row['Targeting changes'],
            budget_changes: row['Budget changes'],
            status_changes: row['Status changes']
          };

          try {
            await service?.processRecord(effectiveClientId, mappedRecord);
            added++;
          } catch (error) {
            console.error('Error processing campaign record:', error);
            errors++;
          }
        } else {
          const mappedRecord = {
            client_id: Number(clientId),
            date: row['Date'],  // Match exact column name
            query: row['Query'],
            page: row['Landing Page'],
            clicks: Number(row['Url Clicks']),
            impressions: Number(row['Impressions']),
            position: Number(row['Average Position']),
            country: row['Country']
          };

          // Debug logging for first few records
          if (processed < 5) {
            console.log('CSV Column Names:', Object.keys(row));  // Log column names
            console.log('Raw CSV row:', row);
            console.log('Mapped record:', mappedRecord);
          }

          // Validate required fields
          if (!mappedRecord.country || mappedRecord.country.trim() === '') {
            log(`Skipping record - missing country value for query: ${mappedRecord.query}`);
            skipped++;
            continue;
          }

          // Calculate CTR if needed
          if (mappedRecord.clicks && mappedRecord.impressions) {
            mappedRecord.ctr = Number(mappedRecord.clicks) / Number(mappedRecord.impressions);
          }

          // Format date correctly
          mappedRecord.date = new Date(mappedRecord.date).toISOString().split('T')[0];

          // Log sample records for debugging
          if (processed < 5) {
            log(`Sample record ${processed + 1}:`);
            log(JSON.stringify(mappedRecord, null, 2));
            log('Attempting database operation...');
          }

          // Database operations using pg pool
          try {
            // Check if record exists
            const existingResult = await pool.query(
              `SELECT id, url_clicks, impressions, average_position 
               FROM search_console_data 
               WHERE client_id = $1 
               AND date = $2::date 
               AND query = $3 
               AND landing_page = $4`,
              [
                mappedRecord.client_id,
                mappedRecord.date,
                mappedRecord.query,
                mappedRecord.page
              ]
            );

            if (existingResult.rows.length > 0) {
              const existing = existingResult.rows[0];
              
              // Add debug logging
              if (processed < 5) {
                console.log('Processing record:', {
                  id: existing.id,
                  oldData: existing,
                  newData: mappedRecord
                });
              }
              
              // Evaluate data quality
              const qualityMetrics = await dataQualityService.evaluateRecord(
                'search_console_data',
                existing.id,
                mappedRecord,
                existing
              );

              // Log quality metrics for first few records
              if (processed < 5) {
                console.log('Quality metrics:', qualityMetrics);
              }

              // Send quality metrics to client
              res.write(`data: ${JSON.stringify({
                type: 'quality',
                metrics: qualityMetrics
              })}\n\n`);

              if (qualityMetrics.isSignificantChange) {
                log(`Significant change detected: ${qualityMetrics.changePercentage.toFixed(2)}%`);
              }

              // Debug log for first few records
              if (processed < 5) {
                log('Comparing values:');
                log(`Existing: clicks=${existing.url_clicks}, impressions=${existing.impressions}, position=${existing.average_position}`);
                log(`New: clicks=${mappedRecord.clicks}, impressions=${mappedRecord.impressions}, position=${mappedRecord.position}`);
                log(`Types - Existing: ${typeof existing.url_clicks}, New: ${typeof mappedRecord.clicks}`);
              }

              // Ensure we're comparing numbers of the same type
              const existingClicks = Number(existing.url_clicks);
              const existingImpressions = Number(existing.impressions);
              const existingPosition = Number(existing.average_position);
              
              const newClicks = Number(mappedRecord.clicks);
              const newImpressions = Number(mappedRecord.impressions);
              const newPosition = Number(mappedRecord.position);

              if (
                existingClicks !== newClicks ||
                existingImpressions !== newImpressions ||
                existingPosition !== newPosition
              ) {
                // Only update if data is different
                await pool.query(
                  `UPDATE search_console_data 
                   SET url_clicks = $1, 
                       impressions = $2, 
                       average_position = $3, 
                       imported_at = NOW()
                   WHERE id = $4`,
                  [
                    newClicks,
                    newImpressions,
                    newPosition,
                    existing.id
                  ]
                );
                updated++;
                
                if (processed < 5) {
                  log('Record updated due to value changes');
                }
              } else {
                // Skip if data is the same
                skipped++;
                
                if (processed < 5) {
                  log('Record skipped - no changes');
                }
              }
            } else {
              // Insert new record
              await pool.query(
                `INSERT INTO search_console_data 
                 (client_id, date, query, landing_page, url_clicks, impressions, average_position, country, imported_at)
                 VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, NOW())`,
                [
                  mappedRecord.client_id,
                  mappedRecord.date,
                  mappedRecord.query,
                  mappedRecord.page,
                  mappedRecord.clicks,
                  mappedRecord.impressions,
                  mappedRecord.position,
                  mappedRecord.country,
                ]
              );
              added++;
              
              if (processed < 5) {
                log('New record added');
              }
            }

          } catch (dbError) {
            console.error('Database error:', dbError);
            log(`Failed to process record: ${JSON.stringify(mappedRecord, null, 2)}`);
            errors++;
          }
        }

        processed++;
        
        if (processed % 100 === 0) {
          sendProgress(processed, processed, `Processed ${processed.toLocaleString()} records`);
        }

        // Add to data quality checks
        const dataValidation = {
          requiredFields: ['country', 'query', 'landing_page', 'url_clicks', 'impressions', 'average_position'],
          fieldValidations: {
            country: (value: string) => value && value.trim().length > 0,
          }
        };

        // Log sample records for debugging
        if (processed < 5) {
          log('Sample record:');
          log(JSON.stringify(mappedRecord, null, 2));
        }

      } catch (e) {
        errors++;
        console.error(`Error processing record ${processed}:`, e);
        continue;
      }
    }

    log(`Processing complete:`);
    log(`- Total processed: ${processed.toLocaleString()}`);
    log(`- Added: ${added.toLocaleString()}`);
    log(`- Updated: ${updated.toLocaleString()}`);
    log(`- Skipped: ${skipped}`);
    log(`- Errors: ${errors}`);

    // Send final progress
    const result = {
      totalProcessed: processed,
      added: added,
      updated: updated,
      skipped: skipped,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    sendProgress(
      processed, 
      processed, 
      `Complete. ${added.toLocaleString()} added, ${updated.toLocaleString()} updated`, 
      true,
      result  // Add result object to the progress message
    );

    res.write(`data: ${JSON.stringify(result)}\n\n`);
    res.write(`Processing complete: ${processed} records\n`);
    
    // Clean up
    await fs.unlink(file.filepath);
    res.end();

    // After successful upload
    const metrics = await dataQualityService.calculateQualityMetrics(
        parseInt(clientId as string),
        dataTypeConfig.id as string
    );

    return res.status(200).json({
        message: 'Upload successful',
        metrics,
        timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Upload] Error:', error);
    res.write(`data: ${JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);
    res.end();

    return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Upload failed',
        error: error
    });
  }
});

export default router.handler();