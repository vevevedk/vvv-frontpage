interface Campaign {
  update_date: Date;
  campaign_id: number;
  campaign_name: string;
  campaign_status: string;
  status: string;
  status_reasons: string;
  bid_strategy: string;
  target_roas: number | null;
  client: string;
} 