import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centred dialog on larger screens. */
export const Sheet = ({ open, onClose, children, label }: {
  open: boolean; onClose: () => void; children: ReactNode; label: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full animate-sheet overflow-y-auto rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl sm:max-w-lg sm:rounded-3xl">
        <button onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-ink shadow-sm hover:bg-sand">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
};
