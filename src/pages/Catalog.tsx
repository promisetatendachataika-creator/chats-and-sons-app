import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MessageCircle, SlidersHorizontal, Minus, Plus, CheckCircle2, PackageSearch, LogIn } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, runTransaction, doc } from 'firebase/firestore';
import { db } from '../config/db';
import { useAuth } from '../hooks/useAuth';
import { Shell } from '../components/layout/Shell';
import { Sheet } from '../components/ui/Sheet';
import { PageLoader, Spinner } from '../components/ui/Loader';
import { ProductThumb, ProductHero } from '../components/ui/ProductImage';
import { WHATSAPP_NUMBER, BUSINESS_NAME, CURRENCY_SYMBOL } from '../config/constants';
import { categoryLabel, formatMoney, type CatalogItem } from '../lib/catalog';

const filters = ['All', 'Shop', 'Furniture', 'Service'] as const;
const waLink = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const StockBadge = ({ item }: { item: CatalogItem }) => {
  if (item.category === 'Service') return <span className="badge bg-brand-soft text-brand-dark ring-brand/20">Custom quote</span>;
  const n = Number(item.inStock);
  return n > 0
    ? <span className="badge bg-green-50 text-moss ring-green-200">{n} in stock</span>
    : <span className="badge bg-stone-100 text-stone-600 ring-stone-200">Out of stock</span>;
};

export const Catalog = () => {
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  // Coming back from sign-in (?item=…): reopen the product they were looking at, once
  const reopenId = useRef(params.get('item'));
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // The category lives in the address (?cat=…) so footer and home-page links always switch it
  const catParam = params.get('cat') as (typeof filters)[number] | null;
  const filter: (typeof filters)[number] = catParam && filters.includes(catParam) ? catParam : 'All';
  const setFilter = (f: (typeof filters)[number]) => {
    const next = new URLSearchParams(params);
    if (f === 'All') next.delete('cat'); else next.set('cat', f);
    next.delete('item');
    setParams(next, { replace: true });
  };
  const [search, setSearch] = useState('');
  const [showPrice, setShowPrice] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [doneLink, setDoneLink] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CatalogItem[];
      setItems(next);
      const wanted = reopenId.current && next.find((i) => i.id === reopenId.current);
      if (wanted) {
        reopenId.current = null;
        setSelected(wanted);
      }
      setLoading(false);
      setLoadError(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
      setLoadError(true);
    });
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((item) =>
      (filter === 'All' || item.category === filter) &&
      (!s || item.name?.toLowerCase().includes(s) || item.description?.toLowerCase().includes(s)) &&
      (minPrice === '' || item.price >= Number(minPrice)) &&
      (maxPrice === '' || item.price <= Number(maxPrice)));
  }, [items, filter, search, minPrice, maxPrice]);

  const open = (item: CatalogItem) => {
    setSelected(item);
    setQuantity(1);
    setOrderNotes('');
    setOrderError('');
    setDoneLink(null);
  };
  const close = useCallback(() => setSelected(null), []);


  const isService = selected?.category === 'Service';
  const maxQty = Number(selected?.inStock) || 0;
  const total = selected ? selected.price * (isService ? 1 : quantity) : 0;

  const handleSubmitOrder = async () => {
    if (!selected || !user || !profile) return;
    setOrderError('');
    if (!isService && maxQty < quantity) {
      setOrderError('Sorry, there isn’t enough stock for that quantity.');
      return;
    }
    setSubmitting(true);
    try {
      await runTransaction(db, async (tx) => {
        const productRef = doc(db, 'products', selected.id);
        const snap = await tx.get(productRef);
        if (!snap.exists()) throw new Error('This item is no longer available.');
        if (!isService) {
          const stock = snap.data().inStock || 0;
          if (stock < quantity) throw new Error('Not enough stock left for that quantity.');
          tx.update(productRef, { inStock: stock - quantity });
        }
        tx.set(doc(collection(db, 'orders')), {
          clientId: user.uid,
          clientName: profile.displayName,
          clientEmail: user.email,
          productId: selected.id,
          productName: selected.name,
          category: selected.category,
          quantity: isService ? 1 : quantity,
          notes: orderNotes,
          status: 'pending',
          totalAmount: total,
          createdAt: new Date(),
        });
      });

      const msg =
        `Hi ${BUSINESS_NAME}!\n\n` +
        `I'd like to ${isService ? 'request a quote' : 'place an order'} for:\n` +
        `• *${selected.name}* (${categoryLabel[selected.category] || selected.category})\n` +
        (!isService ? `• Quantity: ${quantity}\n` : '') +
        `• Total: ${formatMoney(total, CURRENCY_SYMBOL)}\n` +
        (orderNotes ? `• Notes: ${orderNotes}\n` : '') +
        `\nName: ${profile.displayName}\nEmail: ${user.email}`;
      setDoneLink(waLink(msg));
    } catch (err) {
      const m = (err as Error)?.message || '';
      setOrderError(/offline|unavailable|network/i.test(m)
        ? 'You seem to be offline. Orders need a connection; please try again.'
        : m || 'Couldn’t place the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The shop</p>
            <h1 className="page-title mt-2">Catalogue</h1>
            <p className="page-sub">Materials, furniture and custom work from {BUSINESS_NAME}.</p>
          </div>
          <a href={waLink(`Hi ${BUSINESS_NAME}! I'd like to ask about your products and services.`)}
            target="_blank" rel="noreferrer" className="btn-whatsapp self-start sm:self-auto">
            <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
          </a>
        </div>

        {/* Search + filters */}
        <div className="sticky top-14 z-20 -mx-4 mt-6 border-b border-line bg-paper/95 px-4 pb-3 pt-3 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search boards, hinges, wardrobes…" className="field pl-10" aria-label="Search the catalogue" />
            </div>
            <button onClick={() => setShowPrice((v) => !v)} aria-expanded={showPrice}
              className={`icon-btn h-11 w-11 border ${showPrice || minPrice || maxPrice ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface'}`}
              aria-label="Price filter">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          {showPrice && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted">Price</span>
              <input type="number" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min" className="field w-28" aria-label="Minimum price" />
              <span className="text-faint">–</span>
              <input type="number" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max" className="field w-28" aria-label="Maximum price" />
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-sm font-medium text-brand">Clear</button>
              )}
            </div>
          )}

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-active' : ''}`}>
                {categoryLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <PageLoader label="Loading the catalogue…" />
        ) : loadError && items.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-semibold">Couldn't load the catalogue</p>
            <p className="mt-1 text-sm text-muted">Check your connection, then reload the page.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-6 flex flex-col items-center p-12 text-center">
            <PackageSearch className="h-10 w-10 text-faint" />
            <p className="mt-3 font-semibold">Nothing matches that</p>
            <p className="mt-1 text-sm text-muted">Try another word or category.</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">{filtered.length} item{filtered.length === 1 ? '' : 's'}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => open(item)}
                  className="card group flex flex-col overflow-hidden text-left transition-shadow hover:shadow-md">
                  <ProductThumb item={item} className="aspect-[4/3] w-full" />
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                      {categoryLabel[item.category] || item.category}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand">
                      {item.name}
                    </h3>
                    <p className="mt-1 hidden text-sm text-muted sm:line-clamp-2">{item.description}</p>
                    <div className="mt-auto pt-3">
                      <p className="font-display text-xl font-semibold text-ink">{formatMoney(item.price, CURRENCY_SYMBOL)}</p>
                      <p className="text-xs text-faint">{item.unit}</p>
                      <div className="mt-2"><StockBadge item={item} /></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product sheet */}
      <Sheet open={!!selected} onClose={close} label={selected?.name || 'Product'}>
        {selected && (
          <>
            <ProductHero item={selected} className="aspect-[16/10] w-full" />
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="eyebrow">{categoryLabel[selected.category] || selected.category}</p>
                <StockBadge item={selected} />
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold">{selected.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{selected.description}</p>

              {!user ? (
                <div className="mt-5 rounded-2xl bg-sand p-4">
                  <p className="font-display text-2xl font-semibold">{formatMoney(selected.price, CURRENCY_SYMBOL)}</p>
                  <p className="text-xs text-muted">{selected.unit}</p>
                  <p className="mt-4 text-sm text-ink">
                    {isService ? 'Create a free account to request a quote.' : 'Create a free account to order this.'}{' '}
                    We'll bring you straight back here.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Link to="/login?mode=signup" state={{ from: { pathname: '/catalog', search: `?item=${selected.id}` } }} className="btn-primary">
                      Create account
                    </Link>
                    <Link to="/login" state={{ from: { pathname: '/catalog', search: `?item=${selected.id}` } }} className="btn-outline">
                      <LogIn className="h-4 w-4" /> Sign in
                    </Link>
                  </div>
                </div>
              ) : doneLink ? (
                <div className="mt-6 rounded-2xl bg-green-50 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-moss" />
                  <p className="mt-2 font-semibold text-ink">{isService ? 'Quote request saved' : 'Order saved'}</p>
                  <p className="mt-1 text-sm text-muted">Send it to us on WhatsApp so we can confirm the details.</p>
                  <a href={doneLink} target="_blank" rel="noreferrer" onClick={close} className="btn-whatsapp mt-4 w-full">
                    <MessageCircle className="h-5 w-5" /> Send on WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-sand p-4">
                    <div>
                      <p className="font-display text-2xl font-semibold">{formatMoney(selected.price, CURRENCY_SYMBOL)}</p>
                      <p className="text-xs text-muted">{selected.unit}</p>
                    </div>
                    {!isService && maxQty > 0 && (
                      <div className="flex items-center rounded-xl border border-line bg-surface" aria-label="Quantity">
                        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="icon-btn h-11 w-11" aria-label="Fewer">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                        <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} className="icon-btn h-11 w-11" aria-label="More">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {!isService && quantity > 1 && (
                    <p className="mt-2 text-right text-sm text-muted">
                      Total <span className="font-semibold text-ink">{formatMoney(total, CURRENCY_SYMBOL)}</span>
                    </p>
                  )}

                  <label htmlFor="notes" className="label mt-5">
                    {isService ? 'Tell us about the job' : 'Notes (optional)'}
                  </label>
                  <textarea id="notes" rows={3} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                    className="field resize-none"
                    placeholder={isService ? 'Room size, finish you like, when you need it…' : 'Delivery address, colour, anything else…'} />

                  {orderError && <p role="alert" className="mt-3 text-sm text-red-700">{orderError}</p>}

                  <button onClick={handleSubmitOrder}
                    disabled={submitting || (isService && !orderNotes.trim()) || (!isService && maxQty < 1)}
                    className="btn-primary mt-5 w-full">
                    {submitting && <Spinner className="!h-5 !w-5 !border-2 !border-white/40 !border-t-white" />}
                    {!isService && maxQty < 1 ? 'Out of stock' : isService ? 'Request a quote' : 'Place order'}
                  </button>
                  <p className="mt-2 text-center text-xs text-faint">You'll confirm the details with us on WhatsApp.</p>
                </>
              )}
            </div>
          </>
        )}
      </Sheet>
    </Shell>
  );
};
