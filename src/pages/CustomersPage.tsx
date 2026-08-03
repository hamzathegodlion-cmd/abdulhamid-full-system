import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { Customer } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { Modal } from '../components/shared/Modal';
import { formatCurrency } from '../lib/utils';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      setCustomers(res);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await api.createCustomer({ name, phone, email, address });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.name}</div>
            <div className="text-xs text-slate-400">{row.email || 'No email registered'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: (row) => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.phone || '—'}</span>
    },
    {
      header: 'Address',
      accessor: (row) => <span className="text-xs text-slate-500">{row.address || '—'}</span>
    },
    {
      header: 'Total Orders',
      accessor: (row) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{row.totalPurchasesCount || 0}</span>
    },
    {
      header: 'Total Value Spent',
      accessor: (row) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.totalAmountSpent || 0)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage retail customer profiles and historical lifetime purchases</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search customer by name, phone, email..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        subtitle="Save customer profile for invoice generation and purchase tracking"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0199"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Physical / Delivery Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
