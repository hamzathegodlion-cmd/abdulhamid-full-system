import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, Package } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { StatCard } from '../components/shared/StatCard';

export const ReportsPage: React.FC = () => {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
  const [cashierPerformance, setCashierPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, iRes, cRes] = await Promise.all([
        api.getSalesReport(startDate, endDate),
        api.getInventoryValuationReport(),
        api.getCashierPerformanceReport(startDate, endDate)
      ]);
      setSalesReport(sRes);
      setInventoryValuation(iRes);
      setCashierPerformance(cRes);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    if (!salesReport) return;
    const headers = ['Invoice Number', 'Total Amount', 'Discount', 'Tax', 'Payment Method', 'Date'];
    const rows = salesReport.sales.map((s: any) => [
      s.invoiceNumber,
      s.totalAmount,
      s.discountAmount,
      s.taxAmount,
      s.paymentMethod,
      new Date(s.createdAt).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPOS_Sales_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Pickers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Reports & Business Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">Financial analytics, inventory asset valuation, and staff performance metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Sales Revenue"
          value={formatCurrency(salesReport?.totalRevenue || 0)}
          icon={DollarSign}
          subtitle={`${salesReport?.totalSalesCount || 0} completed orders`}
          gradient="blue"
        />
        <StatCard
          title="Gross Estimated Profit"
          value={formatCurrency(salesReport?.estimatedProfit || 0)}
          icon={TrendingUp}
          subtitle="Net revenue minus wholesale cost"
          gradient="emerald"
        />
        <StatCard
          title="Asset Wholesale Value"
          value={formatCurrency(inventoryValuation?.totalWholesaleValue || 0)}
          icon={Package}
          subtitle="Current cost of in-stock items"
          gradient="purple"
        />
        <StatCard
          title="Asset Retail Valuation"
          value={formatCurrency(inventoryValuation?.totalRetailValue || 0)}
          icon={BarChart3}
          subtitle={`Potential Margin: ${formatCurrency(inventoryValuation?.potentialProfit || 0)}`}
          gradient="teal"
        />
      </div>

      {/* Daily Sales Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Daily Revenue Breakdown</h3>
        <p className="text-xs text-slate-500 mb-4">Aggregated daily transaction volume over selected period</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesReport?.dailyBreakdown || []}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cashier Performance Leaderboard */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Cashier Staff Performance Leaderboard</h3>
        <p className="text-xs text-slate-500 mb-4">Individual sales throughput during selected date range</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-xs">
                <th className="py-2.5 px-3">Cashier Name</th>
                <th className="py-2.5 px-3 text-center">Orders Handled</th>
                <th className="py-2.5 px-3 text-right">Total Revenue Generated</th>
                <th className="py-2.5 px-3 text-right">Avg Order Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cashierPerformance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-400">No cashier sales recorded during this range</td>
                </tr>
              ) : (
                cashierPerformance.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{c.fullName} (@{c.username})</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">{c.totalSalesCount}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.totalRevenue)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">{formatCurrency(c.totalSalesCount > 0 ? c.totalRevenue / c.totalSalesCount : 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
