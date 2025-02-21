import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '../../styles/Analytics.module.css';

interface TableStats {
    table_name: string;
    row_count: number;
    max_date: string;
    min_date: string;
    last_update: string;
}

interface Client {
    id: number;
    name: string;
}

const calculateMissingDays = (maxDate: string): number => {
    const today = new Date();
    const lastDate = new Date(maxDate);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const DataQA: NextPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number>(0);
    const [tableStats, setTableStats] = useState<TableStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient > 0) {
            fetchTableStats();
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (!response.ok) throw new Error('Failed to fetch clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const fetchTableStats = async () => {
        try {
            const response = await fetch(`/api/dashboard?clientId=${selectedClient}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setTableStats(data);
        } catch (error) {
            console.error('Failed to fetch table stats:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch stats');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <AnalyticsLayout>
            <div className={styles.uploadContainer}>
                <h1>Data Quality Assessment</h1>
                
                <div className={styles.formGroup}>
                    <label htmlFor="client">Select Client</label>
                    <select
                        id="client"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(Number(e.target.value))}
                        className={styles.select}
                    >
                        <option value={0}>Select a client...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedClient > 0 && (
                    <div className={styles.dashboardSection}>
                        <h2 className={styles.clientName}>
                            {clients.find(c => c.id === selectedClient)?.name} - Data Overview
                        </h2>
                        {tableStats.length > 0 ? (
                            <table className={styles.statsTable}>
                                <thead>
                                    <tr>
                                        <th>Data Source</th>
                                        <th>Last Update</th>
                                        <th>Date Range</th>
                                        <th>Missing Days</th>
                                        <th>Row Count</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableStats.map(stat => (
                                        <tr key={stat.table_name}>
                                            <td>{stat.table_name}</td>
                                            <td>{new Date(stat.last_update).toLocaleString()}</td>
                                            <td>
                                                {stat.min_date && stat.max_date ? 
                                                    `${new Date(stat.min_date).toLocaleDateString()} - 
                                                     ${new Date(stat.max_date).toLocaleDateString()}` : 
                                                    'No data'
                                                }
                                            </td>
                                            <td className={styles.missingDays}>
                                                {stat.max_date ? (
                                                    <span className={
                                                        calculateMissingDays(stat.max_date) > 7 
                                                            ? styles.warning 
                                                            : styles.ok
                                                    }>
                                                        {calculateMissingDays(stat.max_date)} days
                                                    </span>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>{stat.row_count.toLocaleString()}</td>
                                            <td>
                                                <a 
                                                    href={`/analytics/upload?client=${selectedClient}&table=${stat.table_name}`}
                                                    className={styles.button}
                                                >
                                                    Update Data
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No data available for this client</p>
                        )}
                    </div>
                )}
            </div>
        </AnalyticsLayout>
    );
};

export default DataQA;