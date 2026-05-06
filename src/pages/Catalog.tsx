import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Hammer, ShoppingBag, Search, X, Send, MessageCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { WHATSAPP_NUMBER, BUSINESS_NAME } from '../config/constants';

interface CatalogItem {
  id: string;
  name: string;
  category: 'Shop' | 'Service' | 'Furniture';
  description: string;
  price: number;
  unit: string;
  inStock: number | null;
  imageUrl?: string;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  All:       { icon: <ShoppingBag className="w-4 h-4" />, color: 'text-white',       label: 'All' },
  Shop:      { icon: <Package className="w-4 h-4" />,     color: 'text-emerald-400', label: 'Shop' },
  Service:   { icon: <Hammer className="w-4 h-4" />,      color: 'text-amber-400',   label: 'Services' },
  Furniture: { icon: <ShoppingBag className="w-4 h-4" />, color: 'text-purple-400',  label: 'Furniture' },
};

export const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CatalogItem[]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const filtered = items.filter(item => {
    const matchCat = filter === 'All' || item.category === filter;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openWhatsApp = (message: string) => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  };

  const handleSubmitOrder = async () => {
    if (!selected || !user || !profile) return;
    setSubmitting(true);
    try {
      // 1. Save order to Firestore
      await addDoc(collection(db, 'orders'), {
        clientId: user.uid,
        clientName: profile.displayName,
        clientEmail: user.email,
        productId: selected.id,
        productName: selected.name,
        category: selected.category,
        notes: orderNotes,
        status: 'pending',
        totalAmount: selected.price,
        createdAt: new Date(),
      });

      // 2. Open WhatsApp with the order pre-filled
      const msg =
        `Hi ${BUSINESS_NAME}! 👋\n\n` +
        `I'd like to ${selected.category === 'Service' ? 'request a quote' : 'place an order'} for:\n` +
        `• *${selected.name}* (${selected.category})\n` +
        `• Price: R ${selected.price.toLocaleString()} ${selected.unit}\n` +
        (orderNotes ? `• Notes: ${orderNotes}\n` : '') +
        `\nMy name: ${profile.displayName}\nEmail: ${user.email}`;

      setSubmitted(true);
      setTimeout(() => {
        openWhatsApp(msg);
        setSelected(null);
        setSubmitted(false);
        setOrderNotes('');
      }, 1200);
    } catch (err) {
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8">
        {/* Ambient blobs */}
        <div className="fixed top-1/3 left-1/4 w-72 h-72 bg-[var(--color-neon-blue)] rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-72 h-72 bg-[var(--color-neon-purple)] rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold neon-text">Our Catalog</h1>
            <p className="text-gray-400 mt-1">Browse shop items, services and furniture from {BUSINESS_NAME}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* WhatsApp contact button */}
            <button
              onClick={() => openWhatsApp(`Hi ${BUSINESS_NAME}! I'd like to enquire about your products and services.`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search catalog..." className="input-field pl-11 w-full"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                filter === key
                  ? 'bg-white/15 border-white/30 text-white shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className={cfg.color}>{cfg.icon}</span>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-[var(--color-neon-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-2xl">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-300 text-lg font-semibold">No items found</p>
            <p className="text-gray-500 mt-1 text-sm">Try a different search or category</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(item => {
              const cfg = categoryConfig[item.category] || categoryConfig.Shop;
              return (
                <motion.div key={item.id} variants={itemVariants}
                  onClick={() => { setSelected(item); setSubmitted(false); setOrderNotes(''); }}
                  className="glass-panel overflow-hidden cursor-pointer glass-panel-hover group flex flex-col"
                >
                  {/* Image */}
                  <div className="w-full h-44 bg-black/40 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className={`w-full h-full flex items-center justify-center ${cfg.color}`}>
                          {React.cloneElement(cfg.icon as any, { className: 'w-12 h-12 opacity-30' })}
                        </div>
                    }
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs uppercase tracking-widest font-semibold ${cfg.color}`}>{item.category}</span>
                        {item.category !== 'Service' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            Number(item.inStock) > 0
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                              : 'text-red-400 border-red-500/20 bg-red-500/10'
                          }`}>
                            {Number(item.inStock) > 0 ? `${item.inStock} in stock` : 'Out of stock'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-neon-blue)] transition-colors">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[var(--color-neon-blue)]">R {item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{item.unit}</p>
                      </div>
                      {item.category === 'Service' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Custom Quote</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Order / Quote Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="glass-panel max-w-lg w-full relative overflow-hidden neon-border">
                {selected.imageUrl && (
                  <div className="w-full h-48 overflow-hidden">
                    <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-8">
                  <button onClick={() => setSelected(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>

                  <span className={`text-xs uppercase tracking-widest font-semibold ${categoryConfig[selected.category]?.color || 'text-white'}`}>
                    {selected.category}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1 mb-2">{selected.name}</h2>
                  <p className="text-gray-400 text-sm mb-5">{selected.description}</p>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-5 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Price</p>
                      <p className="text-2xl font-bold text-[var(--color-neon-blue)]">R {selected.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{selected.unit}</p>
                    </div>
                    {selected.category !== 'Service' && (
                      <span className={`text-sm font-semibold ${Number(selected.inStock) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(selected.inStock) > 0 ? `${selected.inStock} available` : 'Out of stock'}
                      </span>
                    )}
                  </div>

                  {!submitted ? (
                    <>
                      <div className="mb-4">
                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                          {selected.category === 'Service' ? 'Describe your project requirements' : 'Additional notes (optional)'}
                        </label>
                        <textarea rows={3} value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                          className="input-field resize-none w-full"
                          placeholder={selected.category === 'Service'
                            ? 'e.g. Room size, preferred finish, timeline...'
                            : 'e.g. Quantity needed, delivery address...'}
                        />
                      </div>
                      <button
                        onClick={handleSubmitOrder}
                        disabled={submitting || (selected.category === 'Service' && !orderNotes)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white bg-[#25D366]/20 border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-all disabled:opacity-50 active:scale-95"
                      >
                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                        {submitting ? 'Processing...' : selected.category === 'Service' ? 'Request Quote via WhatsApp' : 'Order via WhatsApp'}
                      </button>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center mx-auto">
                        <MessageCircle className="w-8 h-8 text-[#25D366]" />
                      </div>
                      <p className="text-[#25D366] font-bold text-lg mt-3">Opening WhatsApp...</p>
                      <p className="text-gray-400 text-sm mt-1">Your order has been saved. Continue on WhatsApp!</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};
