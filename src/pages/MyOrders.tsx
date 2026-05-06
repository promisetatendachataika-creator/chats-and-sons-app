import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface Order {
  id: string;
  productName: string;
  category: string;
  notes: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any;
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Clock className="w-4 h-4" /> },
  'in-progress': { label: 'In Progress', color: 'text-[var(--color-neon-blue)]', bg: 'bg-[var(--color-neon-blue)]/10 border-[var(--color-neon-blue)]/20', icon: <AlertCircle className="w-4 h-4" /> },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle className="w-4 h-4" /> },
};

export const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-text mb-2">My Orders</h1>
          <p className="text-gray-400">Track the status of your orders and quote requests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-[var(--color-neon-blue)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">Browse our catalog and place your first order or request a quote!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center gap-4 glass-panel-hover"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{order.productName}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{order.category}</p>
                      </div>
                      {order.totalAmount > 0 && (
                        <p className="text-lg font-bold text-[var(--color-neon-blue)] shrink-0">R {order.totalAmount.toLocaleString()}</p>
                      )}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-gray-400 mt-3 line-clamp-2 bg-white/5 rounded-lg px-3 py-2">{order.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recent'}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shrink-0 ${status.color} ${status.bg}`}>
                    {status.icon}
                    {status.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
