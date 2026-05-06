import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Book, Package, ClipboardList, Calculator, LogOut, ChevronRight } from 'lucide-react';

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const clientLinks = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/catalog', label: 'Catalog', icon: <Book className="w-4 h-4" /> },
    { path: '/my-orders', label: 'My Orders', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/catalog', label: 'Browse', icon: <Book className="w-4 h-4" /> },
    { path: '/admin/catalog', label: 'Stock', icon: <Package className="w-4 h-4" /> },
    { path: '/admin/orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
    { path: '/calculator', label: 'Calculator', icon: <Calculator className="w-4 h-4" /> },
  ];

  const links = profile?.role === 'admin' ? adminLinks : clientLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center">
            <span className="text-white font-black text-xs">C&S</span>
          </div>
          <span className="font-bold text-white hidden sm:block">Chats & Sons</span>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {links.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span className="hidden md:block">{link.label}</span>
            </button>
          ))}
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-white leading-none">{profile?.displayName?.split(' ')[0]}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
