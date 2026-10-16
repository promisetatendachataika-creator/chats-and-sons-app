import { useEffect, useState } from 'react';

export const Spinner = ({ className = '' }: { className?: string }) => (
  <span className={`spinner ${className}`} role="status" aria-label="Loading" />
);

/** Full-area loader that explains itself if the connection is slow. */
export const PageLoader = ({ label = 'Loading…' }: { label?: string }) => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Spinner />
      <p className="text-sm text-muted">{label}</p>
      {slow && (
        <p className="max-w-xs text-xs text-faint">
          Your connection looks slow. Hang on, it's still loading.
        </p>
      )}
    </div>
  );
};
