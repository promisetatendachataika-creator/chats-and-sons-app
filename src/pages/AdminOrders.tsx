import { useState, useEffect } from 'react';
import { ClipboardList, Mail, MessageCircle } from 'lucide-react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/db';
import { Shell } from '../components/layout/Shell';
import { PageLoader } from '../components/ui/Loader';
import { CURRENCY_SYMBOL } from '../config/constants';
import { categoryLabel, formatDate, formatMoney, statusStyle, type OrderStatus } from '../lib/catalog';

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  category: string;
  quantity?: number;
  notes: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: unknown;
}

const statusOptions: OrderStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[]);
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch {
      alert('Couldn’t update the status. Check your connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const tabs: { key: 'all' | OrderStatus; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: orders.length },
    { key: 'pending', label: 'Pending', n: count('pending') },
    { key: 'in-progress', label: 'In progress', n: count('in-progress') },
    { key: 'completed', label: 'Done', n: count('completed') },
  ];
  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <Shell>
      <div className="page max-w-4xl">
        <p className="eyebrow">Admin</p>
        <h1 className="page-title mt-2">Orders &amp; requests</h1>
        <p className="page-sub">New orders appear here as soon as clients place them.</p>

        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setFilterStatus(t.key)} className={`chip ${filterStatus === t.key ? 'chip-active' : ''}`}>
              {t.label} <span className="opacity-60">{t.n}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <PageLoader label="Loading orders…" />
        ) : filtered.length === 0 ? (
          <div className="card mt-6 flex flex-col items-center p-12 text-center">
            <ClipboardList className="h-10 w-10 text-faint" />
            <p className="mt-3 font-semibold">No orders here</p>
            <p className="mt-1 text-sm text-muted">Orders from clients will show up in real time.</p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {filtered.map((order) => {
              const s = statusStyle[order.status] || statusStyle.pending;
              return (
                <li key={order.id} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {order.productName}
                        {order.quantity && order.quantity > 1 ? <span className="font-normal text-muted"> × {order.quantity}</span> : null}
                      </h3>
                      <p className="text-xs text-faint">{categoryLabel[order.category] || order.category} · {formatDate(order.createdAt, true)}</p>
                    </div>
                    {order.totalAmount > 0 && (
                      <p className="font-display text-lg font-semibold">{formatMoney(order.totalAmount, CURRENCY_SYMBOL)}</p>
                    )}
                  </div>

                  {order.notes && <p className="mt-3 rounded-lg bg-sand px-3 py-2 text-sm text-muted">“{order.notes}”</p>}

                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{order.clientName || 'Client'}</p>
                      {order.clientEmail && (
                        <a href={`mailto:${order.clientEmail}`} className="inline-flex items-center gap-1 text-muted hover:text-brand">
                          <Mail className="h-3.5 w-3.5" /> <span className="truncate">{order.clientEmail}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${s.cls} hidden sm:inline-flex`}>{s.label}</span>
                      <label className="sr-only" htmlFor={`status-${order.id}`}>Status</label>
                      <select id={`status-${order.id}`} value={order.status} disabled={updatingId === order.id}
                        onChange={(e) => updateStatus(order.id, e.target.value)} className="field w-full sm:w-44">
                        {statusOptions.map((opt) => <option key={opt} value={opt}>{statusStyle[opt].label}</option>)}
                      </select>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 flex items-center gap-2 text-xs text-faint">
          <MessageCircle className="h-4 w-4" /> Clients also send each order to you on WhatsApp.
        </p>
      </div>
    </Shell>
  );
};
