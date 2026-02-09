/** Brand palette from veveve-io-tokens.css */
export const CHART_COLORS = {
  primary: '#0066CC',
  primaryLight: '#3385D6',
  secondary: '#00CC99',
  secondaryLight: '#33D6B3',
  accent: '#FF6B6B',
  accentLight: '#FF8888',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316',
} as const;

/** Consistent series colors for multi-dataset charts */
export const CHART_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.info,
  CHART_COLORS.error,
];

/** Map order status → color for bar charts and doughnuts */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  completed: CHART_COLORS.success,
  processing: CHART_COLORS.primary,
  'on-hold': CHART_COLORS.warning,
  pending: CHART_COLORS.warning,
  cancelled: CHART_COLORS.error,
  refunded: CHART_COLORS.accent,
  failed: CHART_COLORS.error,
};

/** Return a hex colour for a given order status (with fallback) */
export function statusColor(status: string): string {
  return ORDER_STATUS_COLORS[status.toLowerCase()] || CHART_COLORS.info;
}
