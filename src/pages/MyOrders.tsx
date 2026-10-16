import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/db';
import { useAuth } from '../hooks/useAuth';
import { Shell } from '../components/layout/Shell';
import { PageLoader } from '../components/ui/Loader';
import { CURRENCY_SYMBOL } from '../config/constants';
import { categoryLabel, formatDate, formatMoney, statusStyle, type OrderStatus } from '../lib/catalog';

interface Order {
  id: string;
  productName: string;
  category: string;
  quantity?: number;
  notes: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: unknown;
}

const toMillis = (ts: unknown) => {
  const t = ts as { toMillis?: () => number } | Date | null;
  if (t && typeof (t as { toMillis?: () => number }).toMillis === 'function') return (t as { toMillis: () => number }).toMillis();
  if (t instanceof Date) return t.getTime();
  return Date.now(); // just placed, timestamp still on its way
};

export const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Filter by client only and sort here: combining where() with orderBy() on another field
    // needs a composite index in Firestore, and without it the query fails silently.
    const q = query(collection(db, 'orders'), where('clientId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setOrders(list);
      setLoadError('');
      setLoading(false);
    }, (err) => {
      console.error('My orders failed to load:', err);
      setLoadError((err as { code?: string }).code === 'permission-denied'
        ? 'Firebase blocked loading your orders. The Firestore rules may need publishing.'
        : 'Couldn\u2019t load your orders. Check your connection and refresh the page.');
      setLoading(false);
    });
  }, [user]);

  return (
    <Shell>
      <div className="page max-w-3xl">
        <p className="eyebrow">Your account</p>
        <h1 className="page-title mt-2">My orders</h1>
        <p className="page-sub">Follow your orders and quote requests.</p>

        {loading ? (
          <PageLoader label="Loading your orders…" />
        ) : loadError ? (
          <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
        ) : orders.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center p-12 text-center">
            <ClipboardList className="h-10 w-10 text-faint" />
            <p className="mt-3 font-semibold">No orders yet</p>
            <p className="mt-1 text-sm text-muted">When you order or request a quote, it'll show up here.</p>
            <Link to="/catalog" className="btn-primary mt-5">Browse the shop</Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {orders.map((order) => {
              const s = statusStyle[order.status] || statusStyle.pending;
              return (
                <li key={order.id} className="card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {order.productName}
                        {order.quantity && order.quantity > 1 ? <span className="font-normal text-muted"> × {order.quantity}</span> : null}
                      </h3>
                      <p className="text-xs text-faint">{categoryLabel[order.category] || order.category} · {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`badge shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>
                  {order.notes && <p className="mt-3 rounded-lg bg-sand px-3 py-2 text-sm text-muted">{order.notes}</p>}
                  {order.totalAmount > 0 && (
                    <p className="mt-3 text-right font-display text-lg font-semibold">{formatMoney(order.totalAmount, CURRENCY_SYMBOL)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Shell>
  );
};
