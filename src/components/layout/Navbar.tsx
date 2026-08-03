import React, { useState, useEffect } from 'react';
import {
  Store, Moon, Sun, LogOut, User as UserIcon, Shield, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigateToProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToProfile }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#09090b]/90 border-b border-zinc-800 sticky top-0 z-30 flex items-center justify-between px-6 backdrop-blur-md">
      {/* Brand & Store Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black text-xl shadow-md shadow-orange-500/20">
          S
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">SmartPOS</h1>
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Retail Engine</p>
        </div>
      </div>

      {/* Center Clock & Quick Status */}
      <div className="hidden md:flex items-center space-x-2 bg-zinc-900 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-zinc-300 border border-zinc-800">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span>{timeStr}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-zinc-300" /> : <Sun className="w-4 h-4 text-orange-400" />}
        </button>

        {/* User Info Badge */}
        <div className="flex items-center space-x-3 border-l border-zinc-800 pl-3">
          <button
            onClick={onNavigateToProfile}
            title="View & Edit Profile"
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-zinc-800/60 transition-colors text-left group"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors">{user?.fullName}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center justify-end space-x-1">
                <Shield className="w-3 h-3" />
                <span>{user?.role}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs group-hover:border-orange-500 transition-all">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
