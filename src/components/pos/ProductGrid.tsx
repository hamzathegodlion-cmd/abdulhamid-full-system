import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Plus, Sparkles, Tag } from 'lucide-react';
import { Product, Category } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  onAddToCart,
  loading = false
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      p => p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
           p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      onAddToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found matching barcode/SKU "${barcodeInput}"`);
      setBarcodeInput('');
    }
  };

  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = query.toLowerCase().trim();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Search & Barcode Scanner simulation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="relative">
          <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
          <input
            ref={barcodeRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode or press Enter..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </form>

        {/* Text Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150',
            selectedCategory === 'all'
              ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
          )}
        >
          All Items ({products.filter(p => p.isActive).length})
        </button>

        {categories.map((cat) => {
          const count = products.filter(p => p.categoryId === cat.id && p.isActive).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all duration-150',
                isSelected
                  ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
              )}
            >
              <Tag className="w-3 h-3 opacity-70" />
              <span>{cat.name} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-3 border border-zinc-800 animate-pulse h-48 flex flex-col justify-between">
                <div className="w-full h-24 bg-zinc-800 rounded-xl" />
                <div className="h-4 bg-zinc-800 rounded-md w-3/4 my-2" />
                <div className="h-5 bg-zinc-800 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-center p-6">
            <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No products match search criteria</p>
            <p className="text-xs text-zinc-500 mt-1">Try selecting another category or scanning a barcode</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.currentStock <= 0;
              const isLowStock = prod.currentStock <= prod.minStock && prod.currentStock > 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && onAddToCart(prod)}
                  className={cn(
                    'group relative bg-zinc-900 rounded-2xl p-3 border border-zinc-800 shadow-xl shadow-black/20 transition-all duration-200 flex flex-col justify-between cursor-pointer',
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed grayscale'
                      : 'hover:border-orange-500/50 hover:shadow-orange-500/10 hover:-translate-y-0.5'
                  )}
                >
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {isOutOfStock ? (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        OUT
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        LOW ({prod.currentStock})
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-300 border border-zinc-700/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {prod.currentStock} left
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="w-full h-28 rounded-xl bg-zinc-950 overflow-hidden mb-2 relative flex items-center justify-center border border-zinc-800/60">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-zinc-500 font-mono text-xs font-bold uppercase">{prod.sku}</div>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {prod.barcode}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-400 font-mono">
                      {formatCurrency(prod.sellingPrice)}
                    </span>
                    <button
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onAddToCart(prod);
                      }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isOutOfStock ? 'bg-zinc-800 text-zinc-600' : 'bg-orange-500 hover:bg-orange-400 text-black font-bold shadow-xs'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
