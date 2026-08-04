import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { formatDate } from '../lib/utils';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm('Are you sure you want to purge all test sales, payment records, products, and customers to start clean?')) return;
    try {
      setResetting(true);
      await api.resetSystemData();
      alert('System successfully reset to clean zero state for production publication.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset system data');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: (row) => <span className="font-mono text-xs text-slate-500">{formatDate(row.createdAt)}</span>
    },
    {
      header: 'User',
      accessor: (row) => <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{row.performedByName || row.userId || 'System'}</span>
    },
    {
      header: 'Action',
      accessor: (row) => (
        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
          {row.action}
        </span>
      )
    },
    {
      header: 'Target Entity',
      accessor: (row) => <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{row.entityName || '—'}</span>
    },
    {
      header: 'Audit Trail Details',
      accessor: (row) => <span className="text-xs text-slate-700 dark:text-slate-300">{row.details || '—'}</span>
    },
    {
      header: 'IP Address',
      accessor: (row) => <span className="text-xs font-mono text-slate-400">{row.ipAddress || '127.0.0.1'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">Immutable security and operational event log for regulatory compliance</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Trail</span>
          </button>
          <button
            onClick={handleResetSystem}
            disabled={resetting}
            className="px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-bold text-xs flex items-center space-x-1.5 border border-rose-500/30 transition-colors disabled:opacity-50"
            title="Reset system transactional data to clean zero state for production publication"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{resetting ? 'Resetting...' : 'Purge Test Data to Zero'}</span>
          </button>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search audit logs by action, user, details..."
      />
    </div>
  );
};
