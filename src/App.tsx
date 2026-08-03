import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

    // Refresh Products stock level
    await loadPOSData();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
      <Navbar onNavigateToProfile={() => setCurrentView('profile')} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentView={currentView} onSelectView={setCurrentView} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#09090b]">
          {/* View Routing */}
          {currentView === 'dashboard' && (
            isManager ? <ManagerDashboardPage onNavigate={setCurrentView} /> : <CashierDashboardPage onNavigate={setCurrentView} />
          )}

          {currentView === 'pos' && (
            <div className="h-[calc(100vh-6.5rem)] grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-full">
                <ProductGrid
                  products={posProducts}
                  categories={posCategories}
                  onAddToCart={handleAddToCart}
                  loading={posLoading}
                />
              </div>

              <div className="h-full">
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
