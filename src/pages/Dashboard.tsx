import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { Book, Package, ClipboardList, Calculator } from 'lucide-react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const adminCards = [
    { label: 'Manage Stock', sub: 'Add shop items, services & furniture', icon: <Package className="w-6 h-6" />, path: '/admin/catalog', color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-500/60' },
    { label: 'Orders & Requests', sub: 'View and update client orders', icon: <ClipboardList className="w-6 h-6" />, path: '/admin/orders', color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60' },
    { label: 'Browse Catalog', sub: 'View items as a client would', icon: <Book className="w-6 h-6" />, path: '/catalog', color: 'from-white/10 to-white/5 border-white/20 hover:border-white/40' },
    { label: 'Cutting List Calculator', sub: 'Calculate sheets & material', icon: <Calculator className="w-6 h-6" />, path: '/calculator', color: 'from-[var(--color-neon-blue)]/20 to-[var(--color-neon-blue)]/5 border-[var(--color-neon-blue)]/30 hover:border-[var(--color-neon-blue)]/60' },
  ];

  const clientCards = [
    { label: 'Browse Catalog', sub: 'Shop items, services & furniture', icon: <Book className="w-6 h-6" />, path: '/catalog', color: 'from-[var(--color-neon-blue)]/20 to-[var(--color-neon-blue)]/5 border-[var(--color-neon-blue)]/30 hover:border-[var(--color-neon-blue)]/60' },
    { label: 'My Orders', sub: 'Track your orders and quotes', icon: <ClipboardList className="w-6 h-6" />, path: '/my-orders', color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60' },
  ];

  const cards = profile?.role === 'admin' ? adminCards : clientCards;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Background blobs */}
      <div className="fixed top-1/3 left-1/4 w-96 h-96 bg-[var(--color-neon-blue)] rounded-full mix-blend-screen filter blur-[140px] opacity-10 pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-neon-purple)] rounded-full mix-blend-screen filter blur-[140px] opacity-10 pointer-events-none" />

      <div className="pt-28 pb-16 px-6 max-w-4xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Welcome back</p>
          <h1 className="text-5xl font-bold neon-text mb-3">
            {profile?.displayName?.split(' ')[0] || 'Hello'}
          </h1>
          <p className="text-gray-400 capitalize">
            {profile?.role === 'admin' ? '🛠 Admin Portal' : '👋 Client Portal'} · Chats & Sons Carpentry
          </p>
        </motion.div>

        {/* Quick action cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {cards.map((card) => (
            <motion.button
              key={card.path}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              onClick={() => navigate(card.path)}
              className={`text-left p-6 rounded-2xl bg-gradient-to-br border transition-all duration-300 group active:scale-95 ${card.color}`}
            >
              <div className="mb-4 text-white/70 group-hover:text-white transition-colors">{card.icon}</div>
              <p className="text-lg font-bold text-white mb-1">{card.label}</p>
              <p className="text-sm text-gray-400">{card.sub}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};
