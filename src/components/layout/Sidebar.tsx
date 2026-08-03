import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users,
  Truck, Receipt, UserCheck, BarChart3, ShieldAlert, User
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
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
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

  return (
    <aside className="w-64 bg-[#0c0c0e] border-r border-zinc-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Navigation
      </div>

      <nav className="space-y-1.5 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-tight transition-all duration-150',
                isActive
                  ? 'bg-zinc-800/80 text-white rounded-xl border border-zinc-700/60 shadow-md font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-orange-500' : 'text-zinc-500')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* POS Quick Button Accent */}
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <button
          onClick={() => onSelectView('pos')}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Launch POS Register</span>
        </button>
      </div>
    </aside>
  );
};
