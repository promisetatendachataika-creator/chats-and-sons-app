export type Category = 'Shop' | 'Service' | 'Furniture';

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  unit: string;
  inStock: number | null;
  /** Small photo shown in lists (data URL). */
  thumb?: string;
  /** True when a larger photo exists in productImages/{id}. */
  hasFullImage?: boolean;
  /** Legacy: full-size photo stored on the product itself, or an external URL. */
  imageUrl?: string;
  createdAt?: unknown;
}

export const categoryLabel: Record<string, string> = {
  All: 'Everything',
  Shop: 'Materials',
  Service: 'Services',
  Furniture: 'Furniture',
};

/** Best small image to show in a list. */
export const listImage = (item: CatalogItem) => item.thumb || item.imageUrl || '';

export const formatMoney = (n: number, symbol: string) =>
  `${symbol}${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(n) % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (ts: unknown, withTime = false) => {
  const d =
    ts && typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : ts instanceof Date
        ? ts
        : null;
  if (!d) return 'Just now';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export const statusStyle: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending review', cls: 'bg-amber-100 text-amber-900 ring-amber-300' },
  'in-progress': { label: 'In progress', cls: 'bg-sky-100 text-sky-900 ring-sky-300' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-900 ring-green-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-stone-200 text-stone-700 ring-stone-300' },
};
