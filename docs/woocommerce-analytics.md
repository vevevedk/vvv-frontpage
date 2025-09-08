# WooCommerce Analytics System

## Overview
This document describes the WooCommerce analytics system implemented in the VVV frontpage application.

## Features Implemented

### 1. Analytics Dashboard (`AnalyticsDashboard.tsx`)
- **Revenue Trends**: Line chart showing daily revenue over time
- **Order Trends**: Bar chart showing daily order counts
- **Order Status Breakdown**: Doughnut chart showing order status distribution
- **Payment Methods**: Breakdown of payment methods with revenue
- **Top Customers**: Table showing highest-value customers
- **Performance Insights**: Growth metrics and completion rates
- **Quick Actions**: Links to related WooCommerce pages

### 2. Advanced Analytics (`AdvancedAnalytics.tsx`)
- **Key Performance Indicators**: Conversion rate, customer LTV, completion rate, session duration
- **Customer Segments**: Doughnut chart showing customer value segments
- **Performance Radar**: Radar chart showing overall performance metrics
- **Customer Insights**: New vs returning customers, retention rates
- **Performance Metrics**: Detailed conversion and engagement metrics

### 3. Order Analytics (`OrderAnalytics.tsx`)
- **Basic Statistics**: Total orders, revenue, recent orders, average order value
- **Status Breakdown**: Visual breakdown of order statuses with progress bars
- **Quick Actions**: Links to orders, jobs, and logs

### 4. Client Management
- **Client Selection**: Dropdown to filter analytics by specific WooCommerce store
- **Configuration Management**: Add, edit, and manage WooCommerce configurations
- **Connection Testing**: Test API connections to WooCommerce stores

## API Endpoints

### Backend (Django)
- `GET /api/woocommerce/orders/analytics/` - Comprehensive analytics data
- `GET /api/woocommerce/orders/stats/` - Basic order statistics
- `GET /api/woocommerce/configs/` - WooCommerce configurations
- `GET /api/woocommerce/jobs/` - Sync job status

### Frontend (Next.js)
- `GET /api/woocommerce/orders/analytics` - Comprehensive analytics data
- `GET /api/woocommerce/orders/stats` - Order statistics

## Data Structure

### Analytics Response
```typescript
interface AnalyticsData {
  period: number;
  date_range: {
    start: string;
    end: string;
  };
  overview: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completion_rate: number;
    avg_completion_hours: number;
    unique_customers: number;
  };
  growth: {
    revenue_growth: number;
    order_growth: number;
    previous_period: {
      orders: number;
      revenue: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
    monthly: Array<{
      month: string;
      orders: number;
      revenue: number;
    }>;
  };
  breakdowns: {
    status: Array<{
      status: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    payment_methods: Array<{
      method: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
  };
  customers: {
    top_customers: Array<{
      email: string;
      name: string;
      orders: number;
      total_spent: number;
    }>;
  };
}
```

## Usage

### 1. Access Analytics
Navigate to `/woocommerce` to access the main WooCommerce dashboard with analytics tabs.

### 2. Filter by Client
Use the client selector dropdown to filter analytics data for specific WooCommerce stores.

### 3. Change Time Period
Select different time periods (7 days, 30 days, 90 days, 1 year) to analyze different time ranges.

### 4. View Different Analytics
- **Analytics Tab**: Basic performance metrics and charts
- **Advanced Tab**: Deep insights with customer segmentation and performance radar
- **Orders Tab**: Order-specific statistics and breakdowns

## Testing

### Test Page
Visit `/woocommerce/test-analytics` to test the analytics components in isolation.

### API Testing
Run the test suite:
```bash
npm test -- tests/api/woocommerce-analytics.test.ts
```

## Future Enhancements

### 1. Real-time Data
- WebSocket integration for live order updates
- Real-time dashboard refresh

### 2. Advanced Metrics
- Customer lifetime value calculations
- Cohort analysis
- A/B testing results

### 3. Export Features
- PDF reports
- CSV data export
- Scheduled report generation

### 4. Custom Dashboards
- Drag-and-drop dashboard builder
- Custom metric definitions
- Saved dashboard configurations

## Dependencies

### Frontend
- `react-chartjs-2` - Chart visualization
- `chart.js` - Chart library
- `@heroicons/react` - Icons
- `@headlessui/react` - UI components

### Backend
- Django REST Framework
- PostgreSQL database
- Celery for background tasks

## Configuration

### Environment Variables
- `DJANGO_API_URL` - Backend API URL
- `NEXT_PUBLIC_API_URL` - Frontend API URL

### Database
Ensure WooCommerce orders and configurations are properly synced to the database for analytics to work.

## Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check if WooCommerce configurations exist
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Charts Not Rendering**
   - Ensure Chart.js is properly registered
   - Check if data structure matches expected format

3. **API Errors**
   - Verify backend server is running
   - Check authentication and permissions
   - Review API endpoint URLs

### Debug Mode
Enable debug logging in the browser console to see detailed API requests and responses.
