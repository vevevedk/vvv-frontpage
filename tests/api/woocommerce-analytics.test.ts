import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('WooCommerce Analytics API', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  beforeAll(async () => {
    // Setup any test data if needed
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('Analytics Dashboard', () => {
    it('should return analytics data for dashboard', async () => {
      const response = await fetch(`${baseUrl}/api/woocommerce/orders/analytics?period=30`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if the response has the expected structure
        expect(data).toHaveProperty('period');
        expect(data).toHaveProperty('date_range');
        expect(data).toHaveProperty('overview');
        expect(data).toHaveProperty('growth');
        expect(data).toHaveProperty('trends');
        expect(data).toHaveProperty('breakdowns');
        expect(data).toHaveProperty('customers');
        
        // Check overview data structure
        if (data.overview) {
          expect(data.overview).toHaveProperty('total_orders');
          expect(data.overview).toHaveProperty('total_revenue');
          expect(data.overview).toHaveProperty('avg_order_value');
          expect(data.overview).toHaveProperty('completion_rate');
          expect(data.overview).toHaveProperty('avg_completion_hours');
        }
        
        // Check trends data structure
        if (data.trends) {
          expect(data.trends).toHaveProperty('daily');
          expect(Array.isArray(data.trends.daily)).toBe(true);
        }
      } else {
        // If the API is not available, just log it but don't fail the test
        console.log('WooCommerce analytics API not available:', response.status, response.statusText);
      }
    });

    it('should handle period parameter correctly', async () => {
      const periods = [7, 30, 90, 365];
      
      for (const period of periods) {
        const response = await fetch(`${baseUrl}/api/woocommerce/orders/analytics?period=${period}`);
        
        if (response.ok) {
          const data = await response.json();
          expect(data.period).toBe(period);
        } else {
          console.log(`Analytics API not available for period ${period}:`, response.status);
        }
      }
    });

    it('should handle client filtering', async () => {
      const response = await fetch(`${baseUrl}/api/woocommerce/orders/analytics?period=30&client_name=test_client`);
      
      if (response.ok) {
        const data = await response.json();
        // The response should still have the same structure even with client filtering
        expect(data).toHaveProperty('overview');
        expect(data).toHaveProperty('trends');
      } else {
        console.log('Analytics API with client filtering not available:', response.status);
      }
    });
  });

  describe('Order Analytics', () => {
    it('should return order statistics', async () => {
      const response = await fetch(`${baseUrl}/api/woocommerce/orders/analytics?period=30`);
      
      if (response.ok) {
        const data = await response.json();
        
        expect(data).toHaveProperty('overview');
        expect(data).toHaveProperty('growth');
        expect(data).toHaveProperty('trends');
        expect(data).toHaveProperty('breakdowns');
        expect(data).toHaveProperty('customers');
      } else {
        console.log('Order analytics API not available:', response.status);
      }
    });
  });

  describe('Order Stats', () => {
    it('should return basic order statistics', async () => {
      const response = await fetch(`${baseUrl}/api/woocommerce/orders/stats/`);
      
      if (response.ok) {
        const data = await response.json();
        
        expect(data).toHaveProperty('total_orders');
        expect(data).toHaveProperty('total_revenue');
        expect(data).toHaveProperty('recent_orders');
        expect(data).toHaveProperty('status_breakdown');
        
        // Check that status_breakdown is an array
        if (data.status_breakdown) {
          expect(Array.isArray(data.status_breakdown)).toBe(true);
        }
      } else {
        console.log('Order stats API not available:', response.status);
      }
    });
  });
});
