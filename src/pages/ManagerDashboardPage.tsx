import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, AlertTriangle, Users, ShoppingBag,
  PackagePlus, ArrowUpRight, CheckCircle, PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../lib/api';
import { DashboardSummary, RevenueTrendPoint, TopProduct } from '../types';
import { StatCard } from '../components/shared/StatCard';
import { formatCurrency } from '../lib/utils';

interface ManagerDashboardPageProps {
  onNavigate: (view: any) => void;
}

export const ManagerDashboardPage: React.FC<ManagerDashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, trRes, topRes, invRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getRevenueTrend(),
          api.getTopSellingProducts(),
          api.getInventoryStatus()
        ]);
        setSummary(sumRes);
        setTrend(trRes);
        setTopProducts(topRes);
        setInventoryStatus(invRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Manager Analytics Hub</span>
          <h2 className="text-2xl font-black tracking-tight mt-1">Retail Performance Overview</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time telemetry tracking store revenue, net profit margin, cashier throughput, and critical inventory alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 font-bold text-black text-xs shadow-lg shadow-orange-500/20 flex items-center space-x-1.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Register</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-xs text-zinc-200 border border-zinc-700 flex items-center space-x-1.5 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Manage Products</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          icon={DollarSign}
          change="12.4%"
          isPositive={true}
          subtitle={`Today: ${formatCurrency(summary?.todayRevenue || 0)}`}
          gradient="blue"
        />
        <StatCard
          title="Estimated Net Profit"
          value={formatCurrency(summary?.netProfit || 0)}
          icon={TrendingUp}
          change="8.2%"
          isPositive={true}
          subtitle="Margin calculated via item snapshots"
          gradient="emerald"
        />
        <StatCard
          title="Low Stock Alert"
          value={summary?.lowStockCount || 0}
          icon={AlertTriangle}
          subtitle={`${summary?.outOfStockCount || 0} items completely out of stock`}
          gradient={summary && summary.lowStockCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Active Cashier Staff"
          value={summary?.activeCashiersCount || 0}
          icon={Users}
          subtitle={`${summary?.todaySalesCount || 0} sales transactions today`}
          gradient="purple"
        />
      </div>

      {/* Main Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Revenue & Net Profit Trend</h3>
              <p className="text-xs text-zinc-400">Daily sales performance over the past 14 days</p>
            </div>
            <span className="text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#27272a', color: '#fff' }}
                  formatter={(value: any) => [`$${value}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution Pie */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-base">Inventory Health</h3>
              <PieIcon className="w-4 h-4 text-zinc-500" />
            </div>
            <p className="text-xs text-zinc-400">Breakdown of product stock health levels</p>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inventoryStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {inventoryStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#27272a', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            {inventoryStatus.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Bar Chart & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Top 5 Best Selling Products</h3>
              <p className="text-xs text-zinc-400">Ranked by overall generated sales revenue</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-orange-400 hover:underline flex items-center space-x-1"
            >
              <span>Full Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#27272a', color: '#fff' }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#f97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Box */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Quick Actions</h3>
            <p className="text-xs text-zinc-400 mb-4">Fast shortcuts for common management tasks</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('inventory')}
                className="w-full p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-left border border-zinc-700/60 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">Stock Purchase In</span>
                    <p className="text-[10px] text-zinc-400">Receive supplier deliveries</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigate('cashiers')}
                className="w-full p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-left border border-zinc-700/60 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">Add Cashier Account</span>
                    <p className="text-[10px] text-zinc-400">Create staff credentials</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigate('sales')}
                className="w-full p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-left border border-zinc-700/60 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">View Invoices History</span>
                    <p className="text-[10px] text-zinc-400">Search customer receipts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
