import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Hammer, ImagePlus, MapPin, Plus, Trash2, X, CalendarDays, MessageCircle } from 'lucide-react';
import { collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/db';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { Shell } from '../components/layout/Shell';
import { Sheet } from '../components/ui/Sheet';
import { PageLoader, Spinner } from '../components/ui/Loader';
import { compressToDataUrl, FULL, THUMB } from '../lib/images';
import { MAX_PROJECT_PHOTOS, projectCategories, projectImageId, type Project } from '../lib/projects';
import { WHATSAPP_NUMBER, BUSINESS_NAME } from '../config/constants';

/* ─── Viewing a project ─────────────────────────────────────────────── */

const ProjectViewer = ({ project }: { project: Project }) => {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState<Record<number, string>>({});
  const count = project.thumbs.length;

  // Load the full-size photo for the one being shown (the small preview shows meanwhile)
  useEffect(() => {
    if (full[index] || !count) return;
    let cancelled = false;
    getDoc(doc(db, 'projectImages', projectImageId(project.id, index)))
      .then((snap) => {
        const data = snap.exists() ? (snap.data().data as string | undefined) : undefined;
        if (!cancelled && data) setFull((f) => ({ ...f, [index]: data }));
      })
      .catch(() => { /* keep the preview */ });
    return () => { cancelled = true; };
  }, [index, project.id, count, full]);

  const src = full[index] || project.thumbs[index];
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  return (
    <>
      <div className="relative aspect-[4/3] w-full bg-walnut">
        {src ? <img src={src} alt={`${project.title}, photo ${index + 1}`} className="h-full w-full object-cover" /> : null}
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-surface">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-surface">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs text-paper">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4 sm:px-6">
          {project.thumbs.map((t, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ${i === index ? 'ring-brand' : 'ring-transparent opacity-70'}`}>
              <img src={t} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="p-5 sm:p-6">
        <p className="eyebrow">{project.category}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">{project.title}</h2>
        {(project.location || project.completed) && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {project.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{project.location}</span>}
            {project.completed && <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{project.completed}</span>}
          </p>
        )}
        {project.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{project.description}</p>}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi ${BUSINESS_NAME}! I saw the "${project.title}" project and I'd like something similar.`)}`}
          target="_blank" rel="noreferrer" className="btn-whatsapp mt-6 w-full">
          <MessageCircle className="h-5 w-5" /> I want something like this
        </a>
      </div>
    </>
  );
};

/* ─── Adding a project (admin) ──────────────────────────────────────── */

const emptyForm = { title: '', category: projectCategories[0], location: '', completed: '', description: '' };

const AddProjectForm = ({ onDone }: { onDone: () => void }) => {
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<{ thumb: string; full: string }[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PROJECT_PHOTOS - photos.length);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setPreparing(true);
    setError('');
    try {
      const prepared = await Promise.all(files.map(async (f) => ({
        thumb: await compressToDataUrl(f, THUMB),
        full: await compressToDataUrl(f, FULL),
      })));
      setPhotos((p) => [...p, ...prepared].slice(0, MAX_PROJECT_PHOTOS));
    } catch {
      setError('Couldn’t read one of those photos. Try JPG or PNG files.');
    } finally {
      setPreparing(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photos.length) {
      setError('Add at least one photo of the finished work.');
      return;
    }
    setSaving(true);
    setError('');
    const ref = doc(collection(db, 'projects'));
    try {
      // Full-size photos first, so the project never appears with missing pictures
      await Promise.all(photos.map((p, i) => setDoc(doc(db, 'projectImages', projectImageId(ref.id, i)), { data: p.full })));
      await setDoc(ref, {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        completed: form.completed.trim(),
        description: form.description.trim(),
        thumbs: photos.map((p) => p.thumb),
        createdAt: new Date(),
      });
      onDone();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(code === 'permission-denied'
        ? 'Firebase blocked this save. Publish the latest firestore.rules (it now includes projects), then try again.'
        : 'Couldn’t save the project. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 p-5 pt-14 sm:p-6 sm:pt-14">
      <h2 className="font-display text-2xl font-semibold">Add a project</h2>

      <div>
        <span className="label">Photos ({photos.length}/{MAX_PROJECT_PHOTOS})</span>
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <img src={p.thumb} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-ink shadow">
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 text-[10px] text-paper">Cover</span>}
            </div>
          ))}
          {photos.length < MAX_PROJECT_PHOTOS && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={preparing}
              className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-line bg-paper text-muted hover:border-brand/50 hover:text-ink">
              {preparing ? <Spinner className="!h-6 !w-6" /> : <ImagePlus className="h-6 w-6" />}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-faint">The first photo is the cover. Photos are resized automatically.</p>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
      </div>

      <div>
        <label htmlFor="ptitle" className="label">Title</label>
        <input id="ptitle" name="title" required value={form.title} onChange={set} className="field" placeholder="e.g. White gloss kitchen" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pcat" className="label">Type</label>
          <select id="pcat" name="category" value={form.category} onChange={set} className="field">
            {projectCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pwhen" className="label">Finished <span className="font-normal text-faint">(optional)</span></label>
          <input id="pwhen" name="completed" value={form.completed} onChange={set} className="field" placeholder="e.g. March 2026" />
        </div>
      </div>
      <div>
        <label htmlFor="ploc" className="label">Location <span className="font-normal text-faint">(optional)</span></label>
        <input id="ploc" name="location" value={form.location} onChange={set} className="field" placeholder="e.g. Borrowdale, Harare" />
      </div>
      <div>
        <label htmlFor="pdesc" className="label">Description <span className="font-normal text-faint">(optional)</span></label>
        <textarea id="pdesc" name="description" rows={3} value={form.description} onChange={set} className="field resize-none"
          placeholder="What you built, materials and finish used…" />
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <button type="submit" disabled={saving || preparing} className="btn-primary w-full">
        {saving && <Spinner className="!h-5 !w-5 !border-2 !border-white/40 !border-t-white" />}
        {saving ? 'Saving…' : 'Publish project'}
      </button>
    </form>
  );
};

/* ─── Page ──────────────────────────────────────────────────────────── */

export const Projects = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { projects, loading, error } = useProjects();
  const [filter, setFilter] = useState('All');
  const [params] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(() => params.get('open'));
  const [adding, setAdding] = useState(false);
  const close = useCallback(() => setOpenId(null), []);
  const closeAdd = useCallback(() => setAdding(false), []);

  const categories = ['All', ...projectCategories.filter((c) => projects.some((p) => p.category === c))];
  const shown = filter === 'All' ? projects : projects.filter((p) => p.category === filter);
  const open = projects.find((p) => p.id === openId) || null;

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete the project “${p.title}” and its photos?`)) return;
    try {
      await deleteDoc(doc(db, 'projects', p.id));
      await Promise.all(p.thumbs.map((_, i) => deleteDoc(doc(db, 'projectImages', projectImageId(p.id, i))).catch(() => {})));
    } catch {
      alert('Couldn’t delete that project.');
    }
  };

  return (
    <Shell>
      <div className="page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Our work</p>
            <h1 className="page-title mt-2">Projects</h1>
            <p className="page-sub">Kitchens, wardrobes, furniture and more, built by our workshop.</p>
          </div>
          {isAdmin && (
            <button onClick={() => setAdding(true)} className="btn-primary self-start">
              <Plus className="h-4 w-4" /> Add project
            </button>
          )}
        </div>

        {categories.length > 2 && (
          <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`chip ${filter === c ? 'chip-active' : ''}`}>{c}</button>
            ))}
          </div>
        )}

        {loading ? (
          <PageLoader label="Loading projects…" />
        ) : error && projects.length === 0 ? (
          <div className="card mt-8 p-10 text-center">
            <p className="font-semibold">Couldn't load projects</p>
            <p className="mt-1 text-sm text-muted">Check your connection and reload the page.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center p-12 text-center">
            <Hammer className="h-10 w-10 text-faint" />
            <p className="mt-3 font-semibold">No projects yet</p>
            <p className="mt-1 text-sm text-muted">
              {isAdmin ? 'Add your first finished job so clients can see your work.' : 'Photos of our finished work will appear here soon.'}
            </p>
            {isAdmin && (
              <button onClick={() => setAdding(true)} className="btn-primary mt-5"><Plus className="h-4 w-4" /> Add project</button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <div key={p.id} className="card group relative overflow-hidden">
                <button onClick={() => setOpenId(p.id)} className="block w-full text-left">
                  <div className="woodgrain aspect-[4/3] overflow-hidden">
                    {p.thumbs[0] && (
                      <img src={p.thumbs[0]} alt={p.title} loading="lazy" decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{p.category}</p>
                    <h3 className="mt-1 font-semibold leading-snug group-hover:text-brand">{p.title}</h3>
                    {p.location && <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" />{p.location}</p>}
                  </div>
                </button>
                {p.thumbs.length > 1 && (
                  <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] text-paper">{p.thumbs.length} photos</span>
                )}
                {isAdmin && (
                  <button onClick={() => remove(p)} aria-label={`Delete ${p.title}`}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!open} onClose={close} label={open?.title || 'Project'}>
        {open && <ProjectViewer key={open.id} project={open} />}
      </Sheet>

      <Sheet open={adding} onClose={closeAdd} label="Add a project">
        {adding && <AddProjectForm onDone={closeAdd} />}
      </Sheet>
    </Shell>
  );
};
