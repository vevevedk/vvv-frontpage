import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

type QualityCheck = {
  id: number;
  check_type_display?: string;
  status_display?: string;
  score?: number | null;
  created_at: string;
  pipeline?: { id: number; name: string };
};

export default function DataQuality() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChecks = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch('/api/pipeline-quality-checks/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChecks(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data quality checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChecks(); }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Data Quality</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Recent checks and status</p>
              </div>
            </div>
            <button onClick={fetchChecks} className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">Refresh</button>
          </div>
        </div>

        {error && <div className="px-6 pb-2 text-red-600 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        ) : checks.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No data quality checks found</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {checks.map((c) => (
              <li key={c.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleString()} • {c.pipeline?.name || '—'}
                    </div>
                    <div className="text-gray-900">
                      {c.check_type_display || 'Check'} — <span className="font-medium">{c.status_display || 'Unknown'}</span>
                      {c.score != null && <span className="ml-2 text-gray-700">Score: {c.score}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}