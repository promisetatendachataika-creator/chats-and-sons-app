import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, Store, Package, ClipboardList, Calculator, LogOut, LogIn, MessageSquare, Hammer } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from './Logo';

type NavItem = { path: string; label: string; icon: typeof Home; phone?: boolean };

const clientLinks: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/catalog', label: 'Shop', icon: Store },
  { path: '/projects', label: 'Projects', icon: Hammer },
  { path: '/my-orders', label: 'Orders', icon: ClipboardList },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
];

// Visitors who haven't signed in can look around first
const guestLinks: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/catalog', label: 'Shop', icon: Store },
  { path: '/projects', label: 'Projects', icon: Hammer },
  { path: '/login', label: 'Sign in', icon: LogIn },
];

// Admin has more pages than fit in the phone tab bar; `phone: false` keeps those on the desktop bar
// (and on the admin home page) only.
const adminLinks: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { path: '/admin/catalog', label: 'Stock', icon: Package },
  { path: '/projects', label: 'Projects', icon: Hammer },
  { path: '/catalog', label: 'Shop', icon: Store, phone: false },
  { path: '/calculator', label: 'Calc', icon: Calculator },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
];

// Sections of the landing page, linked from its menu
const landingSections = [
  { id: 'top', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];

/** Which landing-page section is on screen, so the menu can underline it. */
const useActiveSection = (enabled: boolean) => {
  const [active, setActive] = useState('top');
  useEffect(() => {
    if (!enabled) return;
    const els = landingSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[visible.length - 1].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
};

/** True once the page has been scrolled a little. */
const useScrolled = (enabled: boolean) => {
  const [scrolled, setScrolled] = useState(() => enabled && window.scrollY > 24);
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);
  return scrolled;
};

/**
 * Top bar. On inner pages it's a solid wood bar with the app's links.
 * On the landing page (`landing`) it sits transparent over the hero with the
 * Home / Services / Projects / Contact menu, and turns solid once you scroll.
 */
export const Navbar = ({ landing = false }: { landing?: boolean }) => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const links = !user ? guestLinks : profile?.role === 'admin' ? adminLinks : clientLinks;
  const phoneLinks = links.filter((l) => l.phone !== false);
  // After signing in, bring people back to the page they were on
  const loginState = { from: { pathname: location.pathname, search: location.search } };
  const firstName = profile?.displayName?.split(' ')[0];
  const active = useActiveSection(landing);
  const scrolled = useScrolled(landing);

  const headerClass = landing
    ? `fixed inset-x-0 top-0 z-30 text-paper transition-colors duration-300 ${scrolled ? 'woodgrain shadow-lg' : 'bg-transparent'}`
    : 'woodgrain sticky top-0 z-30 text-paper';

  return (
    <>
      <header className={headerClass}>
        <div className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 ${landing ? 'h-16 md:h-20' : 'h-14 md:h-16'}`}>
          <Link to="/" aria-label="Chats & Sons home">
            <Logo light />
          </Link>

          {landing ? (
            <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
              {landingSections.map(({ id, label }) => (
                <a key={id} href={`#${id}`}
                  className={`relative py-2 text-[15px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#e07a3a] after:transition-transform ${
                    active === id ? 'text-paper after:scale-x-100' : 'text-paper/80 after:scale-x-0 hover:text-paper'
                  }`}>
                  {label}
                </a>
              ))}
            </nav>
          ) : (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {links.filter((l) => l.path !== '/login').map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-paper/15 text-paper' : 'text-paper/70 hover:bg-paper/10 hover:text-paper'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label === 'Calc' ? 'Calculator' : label}
                </NavLink>
              ))}
            </nav>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-right text-xs leading-tight sm:block">
                <span className="block font-semibold">{firstName}</span>
                <span className="block capitalize text-paper/60">{profile?.role}</span>
              </span>
              <button
                onClick={logout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-paper/80 hover:bg-paper/10 hover:text-paper"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" state={loginState}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-paper/85 hover:bg-paper/10 hover:text-paper sm:inline-flex">
                Sign in
              </Link>
              <Link to="/login?mode=signup" state={loginState}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold ${
                  landing ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-paper text-walnut hover:bg-sand'
                }`}>
                Create account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Bottom tabs on phones: easy to reach with a thumb */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${phoneLinks.length}, minmax(0, 1fr))` }}>
          {phoneLinks.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              state={path === '/login' ? loginState : undefined}
              end={path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  isActive ? 'text-brand' : 'text-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-full px-3 py-0.5 ${isActive ? 'bg-brand-soft' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
