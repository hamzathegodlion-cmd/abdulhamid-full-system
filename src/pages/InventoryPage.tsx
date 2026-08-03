import React, { useState, useEffect } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, AlertOctagon, History, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Product, StockMovement, StockMovementType } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { Modal } from '../components/shared/Modal';
import { formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [inventory, setInventory] = useState<any[]>([]);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Movement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<StockMovementType>(StockMovementType.STOCK_IN);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [isAddition, setIsAddition] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, histRes, prodRes] = await Promise.all([
        api.getInventorySummary(),
        api.getStockHistory(),
        api.getProducts()
      ]);
      setInventory(invRes);
      setHistory(histRes);
      setProducts(prodRes);
      if (prodRes.length > 0) setSelectedProductId(prodRes[0].id);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenMovementModal = (type: StockMovementType, prodId?: string) => {
    setMovementType(type);
    if (prodId) setSelectedProductId(prodId);
    setQuantityInput('10');
    setReasonInput('');
    setRefInput('');
    setIsAddition(true);
    setIsModalOpen(true);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantityInput);
    if (isNaN(qty) || qty <= 0) return alert('Enter a valid positive quantity');

    try {
      setSubmitting(true);
      if (movementType === StockMovementType.STOCK_IN) {
        await api.stockIn({ productId: selectedProductId, quantity: qty, reason: reasonInput, reference: refInput });
      } else if (movementType === StockMovementType.ADJUSTMENT) {
        await api.stockAdjustment({ productId: selectedProductId, quantity: qty, isAddition, reason: reasonInput, reference: refInput });
      } else if (movementType === StockMovementType.DAMAGED) {
        await api.damagedStock({ productId: selectedProductId, quantity: qty, reason: reasonInput, reference: refInput });
      } else if (movementType === StockMovementType.EXPIRED) {
        await api.expiredStock({ productId: selectedProductId, quantity: qty, reason: reasonInput, reference: refInput });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStockColumns: Column<any>[] = [
    {
      header: 'Product Name',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{row.name}</div>
          <div className="text-[11px] font-mono text-slate-400">SKU: {row.sku}</div>
        </div>
      )
    },
    {
      header: 'Barcode',
      accessor: (row) => <span className="font-mono text-xs">{row.barcode}</span>
    },
    {
      header: 'Current Stock',
      accessor: (row) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
          {row.currentStock}
        </span>
      )
    },
    {
      header: 'Stock Status',
      accessor: (row) => {
        if (row.status === 'out_of_stock') {
          return <span className="text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full">Out of Stock</span>;
        }
        if (row.status === 'low_stock') {
          return <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">Low Stock ({row.minStock} min)</span>;
        }
        return <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">Healthy Stock</span>;
      }
    }
  ];

  const historyColumns: Column<StockMovement>[] = [
    {
      header: 'Date & Time',
      accessor: (row) => <span className="text-xs text-slate-500 font-mono">{formatDate(row.createdAt)}</span>
    },
    {
      header: 'Product',
      accessor: (row) => {
        const prod = products.find(p => p.id === row.productId);
        return <span className="font-medium text-slate-900 dark:text-slate-100">{prod?.name || row.productId}</span>;
      }
    },
    {
      header: 'Movement Type',
      accessor: (row) => {
        const typeStyles: Record<string, string> = {
          StockIn: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
          StockOut: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
          Adjustment: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
          Damaged: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
          Expired: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
        };
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${typeStyles[row.type] || ''}`}>{row.type}</span>;
      }
    },
    {
      header: 'Quantity Change',
      accessor: (row) => (
        <span className={`font-mono font-bold ${row.quantityChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.quantityChange >= 0 ? `+${row.quantityChange}` : row.quantityChange}
        </span>
      )
    },
    {
      header: 'Reason / Ref',
      accessor: (row) => <span className="text-xs text-slate-500">{row.reason || row.reference || '—'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Inventory & Stock Movements</h2>
          <p className="text-xs text-slate-500 mt-1">Audit stock movements, log supplier purchase ins, damage & adjustments</p>
        </div>

        {isManager && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenMovementModal(StockMovementType.STOCK_IN)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Stock Purchase In</span>
            </button>
            <button
              onClick={() => handleOpenMovementModal(StockMovementType.ADJUSTMENT)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>Adjust Stock</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('current')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'current'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Current Stock Levels ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log History ({history.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'current' ? (
        <DataTable
          data={inventory}
          columns={currentStockColumns}
          loading={loading}
          actions={isManager ? (row) => (
            <button
              onClick={() => handleOpenMovementModal(StockMovementType.STOCK_IN, row.id)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Add Stock
            </button>
          ) : undefined}
        />
      ) : (
        <DataTable
          data={history}
          columns={historyColumns}
          loading={loading}
        />
      )}

      {/* Stock Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Record Stock Movement (${movementType})`}
        subtitle="Update inventory levels with structured audit logs"
      >
        <form onSubmit={handleMovementSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select Product *
            </label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.currentStock})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          {movementType === StockMovementType.ADJUSTMENT && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Adjustment Direction
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center space-x-2 text-xs font-medium">
                  <input
                    type="radio"
                    name="adjType"
                    checked={isAddition}
                    onChange={() => setIsAddition(true)}
                  />
                  <span>Add (+) Stock</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-medium">
                  <input
                    type="radio"
                    name="adjType"
                    checked={!isAddition}
                    onChange={() => setIsAddition(false)}
                  />
                  <span>Deduct (-) Stock</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Reason / Explanation
            </label>
            <input
              type="text"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="e.g. Supplier PO #9012 delivery"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Reference Document # (Optional)
            </label>
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. PO-2026-88"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mt-2"
          >
            {submitting ? 'Saving...' : 'Confirm Stock Movement'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
