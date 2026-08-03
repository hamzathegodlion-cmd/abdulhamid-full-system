import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShoppingCart, Package } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageView } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { CashierDashboardPage } from './pages/CashierDashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CashiersPage } from './pages/CashiersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserProfilePage } from './pages/UserProfilePage';

import { ProductGrid } from './components/pos/ProductGrid';
import { POSCart } from './components/pos/POSCart';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { api } from './lib/api';
import { Product, Category, Customer, CartItem, Sale, SaleItem, PaymentMethod } from './types';
import { formatCurrency } from './lib/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const MainLayout: React.FC = () => {
  const { user, isManager } = useAuth();
  const [currentView, setCurrentView] = useState<PageView>(isManager ? 'dashboard' : 'pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // POS Mobile Tab State ('catalog' | 'cart')
  const [posMobileTab, setPosMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // POS State
  const [posProducts, setPosProducts] = useState<Product[]>([]);
  const [posCategories, setPosCategories] = useState<Category[]>([]);
  const [posCustomers, setPosCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [posLoading, setPosLoading] = useState(false);

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [completedSaleItems, setCompletedSaleItems] = useState<SaleItem[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Load POS Catalog Data when view switches to POS
  const loadPOSData = async () => {
    try {
      setPosLoading(true);
      const [pRes, cRes, custRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers()
      ]);
      setPosProducts(pRes);
      setPosCategories(cRes);
      setPosCustomers(custRes);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setPosLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'pos') {
      loadPOSData();
    }
  }, [currentView]);

  // Cart Functions
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Cannot add more "${product.name}". Max available stock is ${product.currentStock}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.currentStock) {
              alert(`Max available stock for "${item.product.name}" is ${item.product.currentStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdateDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, discount } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleAddCustomer = async (data: { name: string; phone?: string; email?: string }) => {
    try {
      const newCust = await api.createCustomer(data);
      setPosCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomer(newCust);
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    }
  };

  const handleCheckout = async (paymentDetails: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    orderDiscount: number;
    taxRate: number;
    notes?: string;
  }) => {
    const salePayload = {
      customerId: selectedCustomer?.id,
      items: cartItems.map((ci) => ({
        productId: ci.product.id,
        quantity: ci.quantity,
        discount: ci.discount
      })),
      orderDiscount: paymentDetails.orderDiscount,
      taxRate: paymentDetails.taxRate,
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      notes: paymentDetails.notes
    };

    const res = await api.processSale(salePayload);

    // Set Receipt Modal state
    setCompletedSale(res.sale);
    setCompletedSaleItems(res.items);
    setIsReceiptOpen(true);

    // Reset Cart
    setCartItems([]);
    setSelectedCustomer(null);
    setPosMobileTab('catalog');

    // Refresh Products stock level
    await loadPOSData();
  };

  const totalCartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = cartItems.reduce((sum, item) => {
    return sum + Math.max(0, (item.product.sellingPrice * item.quantity) - item.discount);
  }, 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        onNavigateToProfile={() => {
          setCurrentView('profile');
          setIsMobileMenuOpen(false);
        }}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-[#09090b]">
          {/* View Routing */}
          {currentView === 'dashboard' && (
            isManager ? <ManagerDashboardPage onNavigate={setCurrentView} /> : <CashierDashboardPage onNavigate={setCurrentView} />
          )}

          {currentView === 'pos' && (
            <div className="space-y-3 lg:space-y-0 h-auto lg:h-[calc(100vh-6.5rem)]">
              {/* Mobile Tab Switcher */}
              <div className="flex lg:hidden bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-3">
                <button
                  onClick={() => setPosMobileTab('catalog')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    posMobileTab === 'catalog'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Product Catalog</span>
                </button>
                <button
                  onClick={() => setPosMobileTab('cart')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all relative ${
                    posMobileTab === 'cart'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart ({totalCartQty})</span>
                  {totalCartQty > 0 && (
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping absolute top-2 right-4" />
                  )}
                </button>
              </div>

              {/* Grid Layout for Desktop & Tabbed view for Mobile */}
              <div className="lg:grid lg:grid-cols-3 lg:gap-4 h-full">
                {/* Catalog Container */}
                <div className={`lg:col-span-2 h-full ${posMobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
                  <ProductGrid
                    products={posProducts}
                    categories={posCategories}
                    onAddToCart={handleAddToCart}
                    loading={posLoading}
                  />
                </div>

                {/* Cart Container */}
                <div className={`h-full mt-4 lg:mt-0 ${posMobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
                  <POSCart
                    items={cartItems}
                    customers={posCustomers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                    onAddCustomer={handleAddCustomer}
                    onUpdateQty={handleUpdateQty}
                    onUpdateDiscount={handleUpdateDiscount}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                    onCheckout={handleCheckout}
                  />
                </div>
              </div>

              {/* Floating Mobile Sticky View Cart Bar (when viewing catalog on phone) */}
              {posMobileTab === 'catalog' && totalCartQty > 0 && (
                <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-200">
                  <button
                    onClick={() => setPosMobileTab('cart')}
                    className="w-full py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm shadow-2xl shadow-orange-500/40 flex items-center justify-between transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center font-bold text-xs">
                        {totalCartQty}
                      </div>
                      <span>View Cart Items</span>
                    </div>
                    <span className="font-mono text-base font-extrabold">{formatCurrency(totalCartValue)} →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {currentView === 'products' && <ProductsPage />}
          {currentView === 'inventory' && <InventoryPage />}
          {currentView === 'cashiers' && <CashiersPage />}
          {currentView === 'suppliers' && <SuppliersPage />}
          {currentView === 'sales' && <SalesPage />}
          {currentView === 'customers' && <CustomersPage />}
          {currentView === 'reports' && <ReportsPage />}
          {currentView === 'audit' && <AuditLogsPage />}
          {currentView === 'profile' && <UserProfilePage />}
        </main>
      </div>

      {/* POS Receipt Modal on completed checkout */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        items={completedSaleItems}
      />
    </div>
  );
};

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">Loading SmartPOS Engine...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
