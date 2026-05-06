import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, User } from 'lucide-react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  category: string;
  notes: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any;
}

const statusOptions = ['pending', 'in-progress', 'completed', 'cancelled'] as const;

const statusConfig = {
  pending: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  'in-progress': { label: 'In Progress', color: 'text-[var(--color-neon-blue)]', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-[var(--color-neon-blue)]' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    'in-progress': orders.filter(o => o.status === 'in-progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Orders & Requests</h1>
            <p className="text-gray-400">Manage client orders and quote requests</p>
          </div>
          {/* Summary Pills */}
          <div className="flex gap-3 flex-wrap">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'in-progress', label: 'Active', count: counts['in-progress'] },
              { key: 'completed', label: 'Done', count: counts.completed },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  filterStatus === f.key
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.label} <span className="ml-1 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-[var(--color-neon-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No orders here</h2>
            <p className="text-gray-400">Orders placed by clients will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((order, i) => {
                const s = statusConfig[order.status] || statusConfig.pending;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-panel p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Client info */}
                      <div className="flex items-center gap-3 lg:w-48 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-none">{order.clientName || 'Client'}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{order.clientEmail}</p>
                        </div>
                      </div>

                      {/* Order details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-white">{order.productName}</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">{order.category}</p>
                          </div>
                          {order.totalAmount > 0 && (
                            <p className="text-lg font-bold text-[var(--color-neon-blue)]">R {order.totalAmount.toLocaleString()}</p>
                          )}
                        </div>
                        {order.notes && (
                          <p className="text-sm text-gray-400 mt-3 bg-white/5 rounded-lg px-3 py-2 italic">"{order.notes}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
                          {order.createdAt?.toDate
                            ? order.createdAt.toDate().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Recent'}
                        </p>
                      </div>

                      {/* Status updater */}
                      <div className="shrink-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer bg-black/40 ${s.color} ${s.bg} disabled:opacity-50`}
                          >
                            {statusOptions.map(opt => (
                              <option key={opt} value={opt}>{statusConfig[opt].label}</option>
                            ))}
                          </select>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${s.color}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
