import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Receipt, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Sale } from '../types';
import { StatCard } from '../components/shared/StatCard';
import { DataTable, Column } from '../components/shared/DataTable';
import { formatCurrency, formatDate } from '../lib/utils';

interface CashierDashboardPageProps {
  onNavigate: (view: any) => void;
}

export const CashierDashboardPage: React.FC<CashierDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<{ todayTotal: number; todayCount: number; avgOrder: number; allTimeSalesCount: number } | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, salesRes] = await Promise.all([
          api.getCashierSummary(),
          api.getSales()
        ]);
        setStats(sumRes);
        setRecentSales(salesRes.slice(0, 10));
      } catch (err) {
        console.error('Failed to load cashier dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const columns: Column<Sale>[] = [
    {
      header: 'Invoice #',
      accessor: (row) => <span className="font-mono font-bold text-orange-400">{row.invoiceNumber}</span>
    },
    {
      header: 'Customer',
      accessor: (row) => row.customerName || 'Walk-in'
    },
    {
      header: 'Payment Method',
      accessor: (row) => <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">{row.paymentMethod}</span>
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-mono font-bold text-white">{formatCurrency(row.totalAmount)}</span>
    },
    {
      header: 'Date & Time',
      accessor: (row) => <span className="text-xs text-zinc-400">{formatDate(row.createdAt)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Cashier Terminal</span>
          <h2 className="text-2xl font-black tracking-tight mt-1">Point of Sale Workspace</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Ready to process customer orders and generate instant printed receipts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('pos')}
          className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-all active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Launch POS Register</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Sales Revenue"
          value={formatCurrency(stats?.todayTotal || 0)}
          icon={DollarSign}
          gradient="emerald"
        />
        <StatCard
          title="Orders Completed Today"
          value={stats?.todayCount || 0}
          icon={Receipt}
          gradient="blue"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(stats?.avgOrder || 0)}
          icon={Clock}
          gradient="purple"
        />
      </div>

      {/* Recent Sales History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Your Recent Sales History</h3>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-semibold text-orange-400 hover:underline"
          >
            View All My Sales
          </button>
        </div>

        <DataTable
          data={recentSales}
          columns={columns}
          loading={loading}
          emptyText="No sales completed yet today"
        />
      </div>
    </div>
  );
};
