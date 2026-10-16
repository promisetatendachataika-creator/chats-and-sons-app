import { useEffect, useState, type ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const useOnline = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
};

/** Page frame: top bar, offline notice, content, footer, and room for the phone tab bar. */
export const Shell = ({ children, footer = true, landing = false }: { children: ReactNode; footer?: boolean; landing?: boolean }) => {
  const online = useOnline();
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar landing={landing} />
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          <WifiOff className="h-4 w-4 shrink-0" />
          You're offline. Showing saved data; changes will send when you reconnect.
        </div>
      )}
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
};
