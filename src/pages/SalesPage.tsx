import React, { useState, useEffect } from 'react';
import { Eye, Printer, Search, Calendar, Filter, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Sale, SaleItem } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { formatCurrency, formatDate } from '../lib/utils';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Sale Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getSales();
      setSales(res);
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSale = async (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteSale(id);
    } catch (err) {
      console.error('Failed to delete sale record', err);
      await loadData();
    }
  };

  const handleInspectInvoice = async (sale: Sale) => {
    try {
      const res = await api.getSaleByInvoice(sale.invoiceNumber);
      setSelectedSale(res.sale);
      setSelectedItems(res.items);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch invoice details');
    }
  };

  const columns: Column<Sale>[] = [
    {
      header: 'Invoice Number',
      accessor: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Cashier Staff',
      accessor: (row) => row.cashierName || 'Staff'
    },
    {
      header: 'Customer',
      accessor: (row) => row.customerName || 'Walk-in Customer'
    },
    {
      header: 'Payment Method',
      accessor: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.paymentMethod}
        </span>
      )
    },
    {
      header: 'Total Paid',
      accessor: (row) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      header: 'Date & Time',
      accessor: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(row.createdAt)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Sales & Invoices History</h2>
          <p className="text-xs text-slate-500 mt-1">Audit customer transaction records and reprint thermal receipts</p>
        </div>
      </div>

      <DataTable
        data={sales}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search invoice #, customer name, cashier..."
        actions={(row) => (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleInspectInvoice(row)}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center space-x-1 text-xs font-semibold"
            >
              <Eye className="w-4 h-4" />
              <span>Receipt</span>
            </button>
            <button
              onClick={() => handleDeleteSale(row.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Sale Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={selectedSale}
        items={selectedItems}
      />
    </div>
  );
};
