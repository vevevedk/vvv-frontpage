import React, { useEffect, useMemo, useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

type Analytics = {
  id: number;
  date: string;
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  total_items_processed: number;
  data_quality_score?: number | null;
};

export default function PipelineAnalytics() {
  const [rows, setRows] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch('/api/pipeline-analytics/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const successRate = useMemo(() => {
    const totals = rows.reduce((a, r) => ({ s: a.s + r.successful_jobs, t: a.t + r.total_jobs }), { s: 0, t: 0 });
    return totals.t ? Math.round((totals.s / totals.t) * 100) : 0;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Pipeline Analytics</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Daily performance summary</p>
              </div>
            </div>
            <button onClick={fetchAnalytics} className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">Refresh</button>
          </div>
        </div>

        {error && <div className="px-6 pb-2 text-red-600 text-sm">{error}</div>}

        <div className="px-6 pb-4 text-sm text-gray-700">Success rate: {successRate}%</div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No analytics data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DQ Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.total_jobs}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.successful_jobs}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.failed_jobs}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.total_items_processed}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{r.data_quality_score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}