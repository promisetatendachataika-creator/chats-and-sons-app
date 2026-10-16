import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ImagePlus, X, Sparkles, Zap } from 'lucide-react';
import {
  collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, updateDoc, deleteField, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/db';
import { Shell } from '../components/layout/Shell';
import { PageLoader, Spinner } from '../components/ui/Loader';
import { ProductThumb } from '../components/ui/ProductImage';
import { CURRENCY_SYMBOL, CURRENCY_CODE } from '../config/constants';
import { categoryLabel, formatMoney, type CatalogItem } from '../lib/catalog';
import { compressToDataUrl, isLegacyImage, dataUrlKb, THUMB, FULL } from '../lib/images';

const SEED_ITEMS = [
  { name: 'Melamine Board 16mm', category: 'Shop', description: 'High-quality white melamine-faced chipboard. Smooth finish, ideal for cabinets and shelving.', price: 580, unit: 'per sheet', inStock: 42 },
  { name: 'Plywood 18mm', category: 'Shop', description: 'Structural pine plywood. Strong and versatile for framing, floors and furniture carcasses.', price: 650, unit: 'per sheet', inStock: 30 },
  { name: 'MDF Board 16mm', category: 'Shop', description: 'Medium-density fibreboard. Ideal for painted finishes and routed decorative profiles.', price: 490, unit: 'per sheet', inStock: 25 },
  { name: 'Oak Veneer 18mm', category: 'Shop', description: 'Premium oak-veneered board. Natural grain, perfect for exposed furniture surfaces.', price: 890, unit: 'per sheet', inStock: 15 },
  { name: 'Soft-Close Hinges (Pair)', category: 'Shop', description: 'Blum 110° clip-top soft-close hinges. Fits standard cabinet doors, easy snap-on installation.', price: 85, unit: 'per pair', inStock: 200 },
  { name: 'Full-Extension Drawer Slides', category: 'Shop', description: '450mm heavy-duty drawer runners with soft close. 40kg load capacity.', price: 120, unit: 'per pair', inStock: 80 },
  { name: 'Wood Glue (500ml)', category: 'Shop', description: 'PVA-based woodworking adhesive. Fast setting, waterproof, sands easily.', price: 65, unit: 'per bottle', inStock: 60 },
  { name: 'Custom Kitchen Units', category: 'Service', description: 'Full kitchen design and installation. Includes base units, wall units, countertop and hardware. Measured and fitted by our team.', price: 4500, unit: 'custom project', inStock: null },
  { name: 'Ceiling Installation', category: 'Service', description: 'Supply and installation of PVC or gypsum ceilings. Includes cornice and finishing. Price per square metre.', price: 169, unit: 'per square meter', inStock: null },
  { name: 'Custom Wardrobe', category: 'Service', description: 'Built-in wardrobes designed to your space. Sliding or hinged doors, internal fittings included. Full installation.', price: 3200, unit: 'custom project', inStock: null },
  { name: 'TV Wall Unit', category: 'Furniture', description: 'Modern floating TV wall unit with shelving and cabinets. Custom sizes and finishes available.', price: 2800, unit: 'per item', inStock: 3 },
  { name: 'Executive Office Desk', category: 'Furniture', description: 'L-shaped executive desk with cable management and lockable drawers. Melamine or veneer finish.', price: 3500, unit: 'per item', inStock: 2 },
  { name: 'Bookshelf Unit', category: 'Furniture', description: 'Adjustable 5-shelf bookcase. Available in oak, white or wenge finish. H:1800 W:900 D:300mm.', price: 1200, unit: 'per item', inStock: 5 },
];

const categories = ['Shop', 'Service', 'Furniture'];
const units = ['per sheet', 'per square meter', 'per item', 'per hour', 'custom project', 'per pair', 'per bottle'];
const emptyForm = { name: '', category: 'Shop', description: '', price: '', unit: 'per sheet', inStock: '' };

const RULES_HINT =
  'Photos are saved in a "productImages" collection. Add a Firestore rule that lets the admin write it and signed-in users read it (see the README).';

export const AdminCatalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ thumb: string; full: string } | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [optimising, setOptimising] = useState<{ done: number; total: number } | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CatalogItem[]);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching catalog items:', err);
      setLoading(false);
    });
  }, []);

  const legacy = items.filter((i) => isLegacyImage(i.imageUrl));
  const legacyKb = legacy.reduce((sum, i) => sum + dataUrlKb(i.imageUrl || ''), 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreparingPhoto(true);
    setError(null);
    try {
      const [thumb, full] = await Promise.all([compressToDataUrl(file, THUMB), compressToDataUrl(file, FULL)]);
      setPhoto({ thumb, full });
    } catch {
      setError('Couldn’t read that image. Try a JPG or PNG photo.');
    } finally {
      setPreparingPhoto(false);
    }
  };

  const clearImage = () => {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const productRef = doc(collection(db, 'products'));
    let hasFullImage = false;
    let photoWarning = '';
    if (photo) {
      try {
        await setDoc(doc(db, 'productImages', productRef.id), { data: photo.full });
        hasFullImage = true;
      } catch (err) {
        console.warn('Full photo not saved:', err);
        photoWarning = `Saved with a small photo only. ${RULES_HINT}`;
      }
    }

    try {
      await setDoc(productRef, {
        ...formData,
        price: Number(formData.price),
        inStock: formData.category === 'Service' ? null : Number(formData.inStock),
        ...(photo ? { thumb: photo.thumb, hasFullImage } : {}),
        createdAt: new Date(),
      });
      setFormData(emptyForm);
      clearImage();
      setNotice(photoWarning || `“${formData.name}” added to the catalogue.`);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(code === 'permission-denied'
        ? 'Firebase blocked this save. Publish the rules from firestore.rules in Firebase Console → Firestore Database → Rules, then try again.'
        : 'Couldn’t save: ' + ((err as Error).message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!window.confirm(`Delete “${item.name}” from the catalogue?`)) return;
    try {
      await deleteDoc(doc(db, 'products', item.id));
      if (item.hasFullImage) await deleteDoc(doc(db, 'productImages', item.id)).catch(() => {});
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Couldn’t delete that item.');
    }
  };

  const seedCatalog = async () => {
    if (!window.confirm(`Add ${SEED_ITEMS.length} sample items to your catalogue?`)) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      SEED_ITEMS.forEach((item) => batch.set(doc(collection(db, 'products')), { ...item, createdAt: new Date() }));
      await batch.commit();
    } catch {
      alert('Error adding sample items');
    } finally {
      setSeeding(false);
    }
  };

  /**
   * One-off fix for products saved by the old version: their full-size photo sits on the
   * product itself, so every catalogue visit downloads all of them. This moves each full photo
   * to productImages/{id} and leaves a small thumbnail on the product.
   */
  const optimiseImages = async () => {
    if (!legacy.length) return;
    setError(null);
    setNotice(null);
    setOptimising({ done: 0, total: legacy.length });
    let done = 0;
    for (const item of legacy) {
      try {
        const source = item.imageUrl!;
        const thumb = await compressToDataUrl(source, THUMB);
        await setDoc(doc(db, 'productImages', item.id), { data: source });
        await updateDoc(doc(db, 'products', item.id), { thumb, hasFullImage: true, imageUrl: deleteField() });
        done += 1;
        setOptimising({ done, total: legacy.length });
      } catch (err) {
        console.error('Optimise failed for', item.id, err);
        setError(`Stopped after ${done} of ${legacy.length}. ${RULES_HINT}`);
        break;
      }
    }
    setOptimising(null);
    if (done === legacy.length) setNotice(`Done. ${done} photo${done === 1 ? '' : 's'} optimised; the catalogue now loads much faster.`);
  };

  const isService = formData.category === 'Service';

  return (
    <Shell>
      <div className="page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="page-title mt-2">Stock &amp; services</h1>
            <p className="page-sub">Add materials, furniture and services to the catalogue.</p>
          </div>
          {!loading && items.length === 0 && (
            <button onClick={seedCatalog} disabled={seeding} className="btn-outline self-start">
              <Sparkles className="h-4 w-4 text-brand" />
              {seeding ? 'Adding…' : 'Add sample items'}
            </button>
          )}
        </div>

        {legacy.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">
                  {legacy.length} photo{legacy.length === 1 ? ' is' : 's are'} slowing the catalogue down (~{Math.round(legacyKb / 102.4) / 10} MB)
                </p>
                <p className="text-sm text-amber-900/80">Optimise them once so clients only download small previews.</p>
              </div>
            </div>
            <button onClick={optimiseImages} disabled={!!optimising} className="btn-dark shrink-0">
              {optimising ? <><Spinner className="!h-4 !w-4 !border-2 !border-paper/30 !border-t-paper" /> {optimising.done}/{optimising.total}</> : 'Optimise photos'}
            </button>
          </div>
        )}

        {notice && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div>}
        {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Add item */}
          <form onSubmit={handleAddItem} className="card h-fit space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5 text-brand" /> New item
            </h2>

            <div>
              <label htmlFor="name" className="label">Name</label>
              <input id="name" name="name" required value={formData.name} onChange={handleInputChange}
                className="field" placeholder="e.g. Oak Veneer 18mm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="category" className="label">Category</label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="field">
                  {categories.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="price" className="label">Price ({CURRENCY_CODE})</label>
                <input id="price" type="number" inputMode="decimal" step="0.01" min="0" name="price" required
                  value={formData.price} onChange={handleInputChange} className="field" placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={isService ? 'col-span-2' : ''}>
                <label htmlFor="unit" className="label">Unit</label>
                <select id="unit" name="unit" value={formData.unit} onChange={handleInputChange} className="field">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {!isService && (
                <div>
                  <label htmlFor="inStock" className="label">In stock</label>
                  <input id="inStock" type="number" inputMode="numeric" min="0" name="inStock" required
                    value={formData.inStock} onChange={handleInputChange} className="field" placeholder="0" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea id="description" name="description" required rows={3} value={formData.description}
                onChange={handleInputChange} className="field resize-none" placeholder="Size, finish, what it's good for…" />
            </div>

            <div>
              <span className="label">Photo</span>
              {photo ? (
                <div className="relative overflow-hidden rounded-xl border border-line">
                  <img src={photo.thumb} alt="Preview" className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={clearImage} aria-label="Remove photo"
                    className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-red-50 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                  <p className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2.5 py-0.5 text-[11px] text-paper">
                    Preview {dataUrlKb(photo.thumb)} KB · full {dataUrlKb(photo.full)} KB
                  </p>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={preparingPhoto}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-paper py-6 text-muted transition-colors hover:border-brand/50 hover:text-ink">
                  {preparingPhoto ? <Spinner /> : <ImagePlus className="h-7 w-7" />}
                  <span className="text-sm font-medium">{preparingPhoto ? 'Preparing photo…' : 'Add a photo'}</span>
                  <span className="text-xs text-faint">Resized automatically to keep the app fast</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <button type="submit" disabled={saving || preparingPhoto} className="btn-primary w-full">
              {saving && <Spinner className="!h-5 !w-5 !border-2 !border-white/40 !border-t-white" />}
              {saving ? 'Saving…' : 'Save to catalogue'}
            </button>
          </form>

          {/* Current catalogue */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">In the catalogue <span className="font-normal text-faint">({items.length})</span></h2>
            {loading ? (
              <PageLoader />
            ) : items.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="font-semibold">Your catalogue is empty</p>
                <p className="mt-1 text-sm text-muted">Add your first item with the form.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="card flex gap-3 overflow-hidden p-3">
                    <ProductThumb item={item} className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{item.name}</h3>
                          <p className="text-xs text-faint">{categoryLabel[item.category] || item.category} · {item.unit}</p>
                        </div>
                        <p className="shrink-0 font-display text-lg font-semibold">{formatMoney(item.price, CURRENCY_SYMBOL)}</p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">{item.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-sm font-medium ${item.category === 'Service' ? 'text-brand' : Number(item.inStock) > 0 ? 'text-moss' : 'text-red-700'}`}>
                          {item.category === 'Service' ? 'Service' : Number(item.inStock) > 0 ? `${item.inStock} in stock` : 'Out of stock'}
                        </span>
                        <button onClick={() => handleDelete(item)} className="icon-btn h-9 w-9 hover:!bg-red-50 hover:!text-red-700" aria-label={`Delete ${item.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
};
