import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, History, Ruler } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/db';
import { useAuth } from '../hooks/useAuth';
import { Shell } from '../components/layout/Shell';
import { Spinner } from '../components/ui/Loader';

interface CutPart { id: string; name: string; length: number; width: number; quantity: number; material: string }
interface SavedList { id: string; name: string; parts: CutPart[]; wastePercentage: number; createdAt: unknown }

const materials = ['Melamine 16mm', 'Oak Veneer 18mm', 'MDF 16mm', 'Plywood 18mm'];
// Standard board: 2750mm × 1830mm
const SHEET_M2 = 2.75 * 1.83;
const area = (p: CutPart) => (p.length / 1000) * (p.width / 1000) * p.quantity;

export const CuttingList = () => {
  const { user } = useAuth();
  const [parts, setParts] = useState<CutPart[]>([]);
  const [wastePercentage, setWastePercentage] = useState(10);
  const [listName, setListName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [currentPart, setCurrentPart] = useState<Omit<CutPart, 'id'>>({
    name: '', length: 0, width: 0, quantity: 1, material: materials[0],
  });

  useEffect(() => {
    const q = query(collection(db, 'cuttingLists'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setSavedLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SavedList[]);
      setLoadingLists(false);
    }, () => setLoadingLists(false));
  }, []);

  const canAdd = currentPart.name.trim() && currentPart.length > 0 && currentPart.width > 0 && currentPart.quantity > 0;

  const addPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setParts([...parts, { ...currentPart, name: currentPart.name.trim(), id: Date.now().toString() }]);
    setCurrentPart({ ...currentPart, name: '', length: 0, width: 0, quantity: 1 });
  };

  const net = parts.reduce((s, p) => s + area(p), 0);
  const gross = net * (1 + wastePercentage / 100);
  const sheets = Math.ceil(gross / SHEET_M2);

  // Sheets per material, so you know what to buy of each board
  const byMaterial = Object.entries(
    parts.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.material]: (acc[p.material] || 0) + area(p) }), {}),
  ).map(([m, a]) => ({ material: m, sheets: Math.ceil((a * (1 + wastePercentage / 100)) / SHEET_M2) }));

  const handleSave = async () => {
    if (!parts.length) return;
    const name = prompt('Name this cutting list:', listName || `Job ${new Date().toLocaleDateString('en-GB')}`);
    if (!name) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'cuttingLists'), { name, parts, wastePercentage, createdBy: user?.uid, createdAt: serverTimestamp() });
      setListName(name);
    } catch {
      alert('Couldn’t save the list.');
    } finally {
      setSaving(false);
    }
  };

  const loadList = (list: SavedList) => {
    if (parts.length > 0 && !window.confirm('Replace the current list?')) return;
    setParts(list.parts);
    setWastePercentage(list.wastePercentage);
    setListName(list.name);
  };

  const deleteSavedList = async (list: SavedList) => {
    if (!window.confirm(`Delete “${list.name}”?`)) return;
    try { await deleteDoc(doc(db, 'cuttingLists', list.id)); } catch { alert('Couldn’t delete.'); }
  };

  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <Shell>
      <div className="page">
        <p className="eyebrow">Workshop tool</p>
        <h1 className="page-title mt-2">Cutting list</h1>
        <p className="page-sub">
          Add parts in millimetres to see how many sheets to buy.
          {listName && <> Editing <strong className="text-ink">{listName}</strong>.</>}
        </p>

        {/* Totals */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="card p-3 sm:p-4">
            <p className="text-xs text-muted">Net area</p>
            <p className="font-display text-xl font-semibold sm:text-2xl">{net.toFixed(2)}<span className="text-sm text-faint"> m²</span></p>
          </div>
          <div className="card p-3 sm:p-4">
            <p className="text-xs text-muted">With {wastePercentage}% waste</p>
            <p className="font-display text-xl font-semibold sm:text-2xl">{gross.toFixed(2)}<span className="text-sm text-faint"> m²</span></p>
          </div>
          <div className="rounded-2xl bg-brand p-3 text-white sm:p-4">
            <p className="text-xs text-white/80">Sheets to buy</p>
            <p className="font-display text-2xl font-semibold sm:text-3xl">{sheets}</p>
          </div>
        </div>
        {byMaterial.length > 1 && (
          <p className="mt-2 text-sm text-muted">
            {byMaterial.map((m) => `${m.material}: ${m.sheets}`).join(' · ')}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="space-y-6">
            <form onSubmit={addPart} className="card space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Ruler className="h-5 w-5 text-brand" /> Add a part</h2>
              <div>
                <label htmlFor="pname" className="label">Part name</label>
                <input id="pname" value={currentPart.name} onChange={(e) => setCurrentPart({ ...currentPart, name: e.target.value })}
                  className="field" placeholder="e.g. Base cabinet side" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plen" className="label">Length (mm)</label>
                  <input id="plen" type="number" inputMode="numeric" min="1" value={currentPart.length || ''}
                    onChange={(e) => setCurrentPart({ ...currentPart, length: num(e.target.value) })} className="field" placeholder="2400" />
                </div>
                <div>
                  <label htmlFor="pwid" className="label">Width (mm)</label>
                  <input id="pwid" type="number" inputMode="numeric" min="1" value={currentPart.width || ''}
                    onChange={(e) => setCurrentPart({ ...currentPart, width: num(e.target.value) })} className="field" placeholder="600" />
                </div>
                <div>
                  <label htmlFor="pqty" className="label">Quantity</label>
                  <input id="pqty" type="number" inputMode="numeric" min="1" value={currentPart.quantity || ''}
                    onChange={(e) => setCurrentPart({ ...currentPart, quantity: num(e.target.value) })} className="field" />
                </div>
                <div>
                  <label htmlFor="pwaste" className="label">Waste %</label>
                  <input id="pwaste" type="number" inputMode="numeric" min="0" value={wastePercentage}
                    onChange={(e) => setWastePercentage(num(e.target.value))} className="field" />
                </div>
              </div>
              <div>
                <label htmlFor="pmat" className="label">Material</label>
                <select id="pmat" value={currentPart.material} onChange={(e) => setCurrentPart({ ...currentPart, material: e.target.value })} className="field">
                  {materials.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button type="submit" disabled={!canAdd} className="btn-primary w-full"><Plus className="h-5 w-5" /> Add to list</button>
            </form>

            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-brand" /> Saved lists</h3>
              {loadingLists ? (
                <div className="grid place-items-center py-6"><Spinner /></div>
              ) : savedLists.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nothing saved yet.</p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {savedLists.map((list) => (
                    <li key={list.id} className="flex items-center gap-2 rounded-xl border border-line p-2 pl-3">
                      <button onClick={() => loadList(list)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-semibold hover:text-brand">{list.name}</span>
                        <span className="block text-xs text-faint">{list.parts.length} parts · {list.wastePercentage}% waste</span>
                      </button>
                      <button onClick={() => deleteSavedList(list)} className="icon-btn h-9 w-9 hover:!bg-red-50 hover:!text-red-700" aria-label={`Delete ${list.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Parts <span className="font-normal text-faint">({parts.length})</span></h2>
              <button onClick={handleSave} disabled={!parts.length || saving} className="btn-outline min-h-10">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save list'}
              </button>
            </div>

            {parts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-line p-10 text-center text-sm text-muted">
                No parts yet. Add parts to work out the material.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {parts.map((part) => (
                  <li key={part.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{part.name}</p>
                      <p className="text-xs text-muted">
                        {part.material} · <span className="tabular-nums">{part.length} × {part.width}</span> · qty {part.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{area(part).toFixed(2)} m²</p>
                    <button onClick={() => setParts(parts.filter((p) => p.id !== part.id))} className="icon-btn h-9 w-9 hover:!bg-red-50 hover:!text-red-700" aria-label={`Remove ${part.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
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
