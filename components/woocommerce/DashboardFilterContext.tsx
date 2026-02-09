import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';

interface DashboardFilterState {
  period: number;
  setPeriod: (p: number) => void;
  selectedClient: string;
  setSelectedClient: (c: string) => void;
  clients: Array<{ id: string; name: string }>;
  isAdmin: boolean;
  showEmails: boolean;
  setShowEmails: (v: boolean) => void;
  hideClientSelector: boolean;
}

const DashboardFilterContext = createContext<DashboardFilterState | null>(null);

export function useDashboardFilter(): DashboardFilterState {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('useDashboardFilter must be used inside DashboardFilterProvider');
  return ctx;
}

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState(30);
  const [selectedClient, setSelectedClient] = useState('all');
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [showEmails, setShowEmails] = useState(false);

  const role = typeof window !== 'undefined' ? localStorage.getItem('role') || '' : '';
  const isAdmin = ['super_admin', 'agency_admin'].includes(role);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get<Array<{ id: string; name: string }>>('/woocommerce/orders/client_names/');
        if (response.data && Array.isArray(response.data)) {
          setClients(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      }
    })();
  }, []);

  const hideClientSelector = clients.length <= 1;

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      selectedClient,
      setSelectedClient,
      clients,
      isAdmin,
      showEmails,
      setShowEmails,
      hideClientSelector,
    }),
    [period, selectedClient, clients, isAdmin, showEmails, hideClientSelector],
  );

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}
