import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users,
  Truck, Receipt, UserCheck, BarChart3, ShieldAlert, User, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export type PageView =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'cashiers'
  | 'suppliers'
  | 'sales'
  | 'customers'
  | 'reports'
  | 'audit'
  | 'profile';

interface SidebarProps {
  currentView: PageView;
  onSelectView: (view: PageView) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { isManager } = useAuth();

  const managerNavItems: Array<{ id: PageView; label: string; icon: any }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'products', label: 'Products Catalog', icon: Package },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'cashiers', label: 'Cashier Staff', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'sales', label: 'Sales & Invoices', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const cashierNavItems: Array<{ id: PageView; label: string; icon: any }> = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'sales', label: 'My Sales History', icon: Receipt },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const items = isManager ? managerNavItems : cashierNavItems;

  const handleNavClick = (view: PageView) => {
    onSelectView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Main Navigation
        </div>
        {/* Mobile close drawer button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-zinc-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all duration-150',
                isActive
                  ? 'bg-zinc-800/80 text-white rounded-xl border border-zinc-700/60 shadow-md font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-orange-500' : 'text-zinc-500')} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* POS Quick Launch Accent */}
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <button
          onClick={() => handleNavClick('pos')}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>Launch POS Register</span>
        </button>
      </div>
    </div>
  );

  // Bottom Navigation items for mobile
  const mobileBottomItems: Array<{ id: PageView; label: string; icon: any }> = isManager
    ? [
        { id: 'pos', label: 'POS', icon: ShoppingCart },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'sales', label: 'Sales', icon: Receipt },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    : [
        { id: 'pos', label: 'POS', icon: ShoppingCart },
        { id: 'sales', label: 'Sales', icon: Receipt },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0c0c0e] border-r border-zinc-800 flex-col shrink-0 min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Sliding Panel */}
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0c0c0e] border-r border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around py-1.5 px-2">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-orange-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'text-orange-400' : 'text-zinc-400')} />
              <span className="text-[10px] tracking-tight truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
