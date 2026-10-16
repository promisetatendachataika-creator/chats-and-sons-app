import { Link } from 'react-router-dom';
import { Store, Package, ClipboardList, Calculator, MessageSquare, MessageCircle, ArrowRight, Hammer } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Shell } from '../components/layout/Shell';
import { WHATSAPP_NUMBER, BUSINESS_NAME } from '../config/constants';
import { PageLoader } from '../components/ui/Loader';
import { Welcome } from './Welcome';

type Card = { label: string; sub: string; icon: typeof Store; path: string; external?: boolean; tone: string };

const adminCards: Card[] = [
  { label: 'Orders & requests', sub: 'Review new orders and update their status', icon: ClipboardList, path: '/admin/orders', tone: 'bg-brand text-white' },
  { label: 'Stock & services', sub: 'Add items, photos and prices', icon: Package, path: '/admin/catalog', tone: 'bg-walnut text-paper' },
  { label: 'Projects', sub: 'Add photos of finished jobs to show clients', icon: Hammer, path: '/projects', tone: 'bg-moss text-white' },
  { label: 'Cutting list', sub: 'Work out sheets and material for a job', icon: Calculator, path: '/calculator', tone: 'bg-sand text-ink' },
  { label: 'Client chat', sub: 'Reply to customer messages', icon: MessageSquare, path: '/chat', tone: 'bg-sand text-ink' },
  { label: 'View the shop', sub: 'See the catalogue as clients do', icon: Store, path: '/catalog', tone: 'bg-sand text-ink' },
];

const clientCards: Card[] = [
  { label: 'Browse the shop', sub: 'Boards, hardware, furniture and services', icon: Store, path: '/catalog', tone: 'bg-brand text-white' },
  { label: 'My orders', sub: 'Track your orders and quotes', icon: ClipboardList, path: '/my-orders', tone: 'bg-walnut text-paper' },
  { label: 'Our projects', sub: 'See kitchens, wardrobes and furniture we\u2019ve built', icon: Hammer, path: '/projects', tone: 'bg-moss text-white' },
  { label: 'Chat with us', sub: 'Ask a question about a product or job', icon: MessageSquare, path: '/chat', tone: 'bg-sand text-ink' },
  {
    label: 'WhatsApp us', sub: 'Quickest way to reach the workshop', icon: MessageCircle, external: true,
    path: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi ${BUSINESS_NAME}!`)}`, tone: 'bg-whatsapp text-white',
  },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <Shell><PageLoader /></Shell>;
  if (!user) return <Welcome />;
  const isAdmin = profile?.role === 'admin';
  const cards = isAdmin ? adminCards : clientCards;

  return (
    <Shell>
      <div className="page">
        <div className="animate-rise">
          <p className="eyebrow">{isAdmin ? 'Workshop admin' : 'Client portal'}</p>
          <h1 className="page-title mt-2">
            {greeting()}, {profile?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="page-sub">
            {isAdmin ? 'Here’s what you can manage today.' : 'What would you like to do today?'}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, sub, icon: Icon, path, external, tone }, i) => {
            const inner = (
              <>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{sub}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </>
            );
            const cls = 'card group flex animate-rise items-center gap-4 p-4 transition-colors hover:border-brand/40 sm:p-5';
            const style = { animationDelay: `${i * 50}ms` };
            return external ? (
              <a key={label} href={path} target="_blank" rel="noreferrer" className={cls} style={style}>{inner}</a>
            ) : (
              <Link key={label} to={path} className={cls} style={style}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};
