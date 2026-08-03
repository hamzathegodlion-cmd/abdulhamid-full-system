import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Product, Category, Unit, Supplier } from '../types';
import { DataTable, Column } from '../components/shared/DataTable';
import { Modal } from '../components/shared/Modal';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { isManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    unitId: '',
    buyingPrice: '',
    sellingPrice: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, uRes, sRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getUnits(),
        api.getSuppliers()
      ]);
      setProducts(pRes);
      setCategories(cRes);
      setUnits(uRes);
      setSuppliers(sRes);
    } catch (err) {
      console.error('Failed to load products page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      unitId: units[0]?.id || '',
      buyingPrice: '5.00',
      sellingPrice: '12.00',
      currentStock: '20',
      minStock: '5',
      maxStock: '100',
      description: '',
      imageUrl: '',
      isActive: true
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      barcode: prod.barcode,
      sku: prod.sku,
      categoryId: prod.categoryId,
      supplierId: prod.supplierId || '',
      unitId: prod.unitId,
      buyingPrice: String(prod.buyingPrice),
      sellingPrice: String(prod.sellingPrice),
      currentStock: String(prod.currentStock),
      minStock: String(prod.minStock),
      maxStock: prod.maxStock ? String(prod.maxStock) : '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      isActive: prod.isActive
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const res = await api.uploadProductImage(file);
      setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          barcode: formData.barcode,
          sku: formData.sku,
          categoryId: formData.categoryId,
          supplierId: formData.supplierId || undefined,
          unitId: formData.unitId,
          buyingPrice: Number(formData.buyingPrice),
          sellingPrice: Number(formData.sellingPrice),
          currentStock: Number(formData.currentStock),
          minStock: Number(formData.minStock),
          maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isActive: formData.isActive
        });
      } else {
        await api.createProduct({
          name: formData.name,
          barcode: formData.barcode,
          sku: formData.sku,
          categoryId: formData.categoryId,
          supplierId: formData.supplierId || undefined,
          unitId: formData.unitId,
          buyingPrice: Number(formData.buyingPrice),
          sellingPrice: Number(formData.sellingPrice),
          currentStock: Number(formData.currentStock),
          minStock: Number(formData.minStock),
          maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isActive: formData.isActive
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Automatically update UI state instantly
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await api.deleteProduct(id);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      // Rollback on failure
      await loadData();
    }
  };

  // Filtered List
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCategory = !selectedCategory || p.categoryId === selectedCategory;
    let matchStatus = true;
    if (selectedStatus === 'active') matchStatus = p.isActive;
    if (selectedStatus === 'low') matchStatus = p.currentStock <= p.minStock && p.currentStock > 0;
    if (selectedStatus === 'out') matchStatus = p.currentStock <= 0;

    return matchSearch && matchCategory && matchStatus;
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.name}</div>
            <div className="text-[11px] font-mono text-slate-400">SKU: {row.sku}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Barcode',
      accessor: (row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.barcode}</span>
    },
    {
      header: 'Category',
      accessor: (row) => {
        const cat = categories.find(c => c.id === row.categoryId);
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{cat?.name || 'General'}</span>;
      }
    },
    {
      header: 'Buying Price',
      accessor: (row) => <span className="font-mono text-xs text-slate-500">{formatCurrency(row.buyingPrice)}</span>
    },
    {
      header: 'Selling Price',
      accessor: (row) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.sellingPrice)}</span>
    },
    {
      header: 'Stock Level',
      accessor: (row) => {
        const isOut = row.currentStock <= 0;
        const isLow = row.currentStock <= row.minStock && row.currentStock > 0;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-mono font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
              {row.currentStock}
            </span>
            {isOut && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">OUT</span>}
            {isLow && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">LOW</span>}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Products Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">Manage master inventory prices, barcodes, SKUs and stock limits</p>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
        >
          <option value="">All Stock Status</option>
          <option value="active">Active Products</option>
          <option value="low">Low Stock Alert</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search product by name, barcode, SKU..."
        actions={isManager ? (row) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id, row.name)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : undefined}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product'}
        subtitle="Specify pricing, barcodes, stock limits, and imagery"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Organic Espresso Beans 1kg"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Barcode (Unique) *
              </label>
              <input
                type="text"
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                SKU Code (Unique) *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Unit of Measure *
              </label>
              <select
                required
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Buying Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.buyingPrice}
                onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Selling Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Stock *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Min Stock Alert Level *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Image Preview & Upload */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Product Image (URL or Upload)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
                />
                <label className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold cursor-pointer flex items-center space-x-1 text-slate-800 dark:text-slate-200 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mt-2"
          >
            {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
