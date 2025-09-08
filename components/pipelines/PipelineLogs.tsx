import React, { useEffect, useMemo, useState } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

type Pipeline = { id: number; name: string };
type PipelineLog = {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  level_display?: string;
  message: string;
  details: Record<string, any>;
  created_at: string;
  pipeline?: { id: number; name: string };
  job?: { id: number };
};

const LEVELS = ['ALL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'] as const;

export default function PipelineLogs() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [level, setLevel] = useState<typeof LEVELS[number]>('ALL');

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const res = await fetch('/api/pipelines/', {
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) setPipelines(data.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (e) {
        // ignore
      }
    };
    fetchPipelines();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (selectedPipeline !== 'all') params.set('pipeline', selectedPipeline);
      if (level !== 'ALL') params.set('level', level);
      const res = await fetch(`/api/pipelines/logs?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedPipeline, level]);

  const formattedLogs = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        when: new Date(l.created_at).toLocaleString(),
        lvl: l.level_display || l.level,
        pipelineName: l.pipeline?.name || '—',
      })),
    [logs]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CogIcon className="h-6 w-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Pipeline Logs</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Review pipeline logs and errors</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Pipelines</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button
                onClick={fetchLogs}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading logs…</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {formattedLogs.length === 0 ? (
              <li className="px-6 py-10 text-center text-gray-500">No logs found for current filters</li>
            ) : (
              formattedLogs.map((log) => (
                <li key={log.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border">
                          {log.lvl}
                        </span>
                        <span className="text-sm text-gray-500">{log.when}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-700">{log.pipelineName}</span>
                        {log.job?.id && (
                          <span className="text-xs text-gray-500">(job #{log.job.id})</span>
                        )}
                      </div>
                      <div className="mt-1 text-gray-900">{log.message}</div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border overflow-x-auto">
{JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}