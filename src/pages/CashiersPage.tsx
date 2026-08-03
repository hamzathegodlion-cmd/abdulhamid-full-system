import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, KeyRound, Power, Activity, Lock, User as UserIcon, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { User, CashierActivity } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { Modal } from '../components/shared/Modal';
import { formatDate } from '../lib/utils';

export const CashiersPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Cashier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Activity History Modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activities, setActivities] = useState<CashierActivity[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCashiers();
      setCashiers(res);
    } catch (err) {
      console.error('Failed to load cashiers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createCashier({ fullName, username, password, phone, address });
      setIsAddModalOpen(false);
      setFullName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setAddress('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create cashier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleCashierStatus(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteCashier = async (id: string) => {
    setCashiers(prev => prev.filter(c => c.id !== id));
    try {
      await api.deleteCashier(id);
    } catch (err: any) {
      console.error('Failed to delete cashier', err);
      await loadData();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCashier) return;
    try {
      await api.resetCashierPassword(selectedCashier.id, newPassword);
      setIsResetModalOpen(false);
      setNewPassword('');
      alert(`Password for ${selectedCashier.fullName} reset successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const handleViewActivities = async (cashier: User) => {
    setSelectedCashier(cashier);
    try {
      const res = await api.getCashierActivities(cashier.id);
      setActivities(res);
      setIsActivityModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load cashier activities');
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Cashier Name',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.fullName}</div>
            <div className="text-xs font-mono text-slate-400">@{row.username}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: (row) => <span className="text-xs text-slate-600 dark:text-slate-400">{row.phone || '—'}</span>
    },
    {
      header: 'Last Active Login',
      accessor: (row) => <span className="text-xs text-slate-500 font-mono">{row.lastLoginAt ? formatDate(row.lastLoginAt) : 'Never'}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${row.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'}`}>
          {row.isActive ? 'Active' : 'Disabled'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cashier Staff Management</h2>
          <p className="text-xs text-slate-500 mt-1">Manager portal for creating cashier accounts, resetting passwords, and status controls</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Cashier</span>
        </button>
      </div>

      <DataTable
        data={cashiers}
        columns={columns}
        loading={loading}
        actions={(row) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => handleViewActivities(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Activity Logs"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedCashier(row);
                setNewPassword('');
                setIsResetModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleStatus(row.id)}
              className={`p-1.5 rounded-lg transition-colors ${row.isActive ? 'text-emerald-600 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}`}
              title={row.isActive ? 'Deactivate Cashier' : 'Activate Cashier'}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteCashier(row.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Cashier"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Modal 1: Add Cashier */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Cashier Staff Account"
        subtitle="Only Manager can create new cashier credentials"
      >
        <form onSubmit={handleCreateCashier} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Miller"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Username *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. cashier2"
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0199"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* Modal 2: Reset Password */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${selectedCashier?.fullName}`}
        subtitle="Specify new login password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-colors"
          >
            Update Cashier Password
          </button>
        </form>
      </Modal>

      {/* Modal 3: Cashier Activity Logs */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={`Activity History - ${selectedCashier?.fullName}`}
        subtitle="Recent terminal actions & login sessions"
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No recorded activity history</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{act.action}</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{act.details}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{formatDate(act.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
