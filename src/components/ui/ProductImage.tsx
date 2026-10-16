import { useEffect, useState } from 'react';
import { Package, Hammer, Sofa } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/db';
import { listImage, type CatalogItem } from '../../lib/catalog';

const placeholderIcon = { Shop: Package, Service: Hammer, Furniture: Sofa } as const;

const Placeholder = ({ item }: { item: CatalogItem }) => {
  const Icon = placeholderIcon[item.category] || Package;
  return (
    <div className="woodgrain grid h-full w-full place-items-center">
      <Icon className="h-10 w-10 text-paper/40" />
    </div>
  );
};

/** Small image for lists: lazy-loaded so off-screen photos don't use data. */
export const ProductThumb = ({ item, className = '' }: { item: CatalogItem; className?: string }) => {
  const src = listImage(item);
  return (
    <div className={`overflow-hidden bg-sand ${className}`}>
      {src ? (
        <img src={src} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <Placeholder item={item} />
      )}
    </div>
  );
};

/** Large image for the product sheet: shows the thumbnail straight away, swaps in the full photo when it arrives. */
export const ProductHero = ({ item, className = '' }: { item: CatalogItem; className?: string }) => {
  const [loaded, setLoaded] = useState<{ id: string; data: string } | null>(null);
  const full = loaded?.id === item.id ? loaded.data : null;

  useEffect(() => {
    if (!item.hasFullImage) return;
    let cancelled = false;
    getDoc(doc(db, 'productImages', item.id))
      .then((snap) => {
        const data = snap.exists() ? (snap.data().data as string | undefined) : undefined;
        if (!cancelled && data) setLoaded({ id: item.id, data });
      })
      .catch(() => { /* keep the thumbnail */ });
    return () => { cancelled = true; };
  }, [item.id, item.hasFullImage]);

  const src = full || listImage(item);
  return (
    <div className={`overflow-hidden bg-sand ${className}`}>
      {src ? <img src={src} alt={item.name} decoding="async" className="h-full w-full object-cover" /> : <Placeholder item={item} />}
    </div>
  );
};
