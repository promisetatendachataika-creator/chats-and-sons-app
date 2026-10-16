import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER, BUSINESS_EMAIL, BUSINESS_NAME } from '../../config/constants';
import { useAuth } from '../../hooks/useAuth';
import { LogoMark } from './Logo';

const DEVELOPER = { name: 'Promise Chataika', email: 'promisetatendachataika@gmail.com' };

// +263 78 257 3320 style, for display
const prettyPhone = `+${WHATSAPP_NUMBER.slice(0, 3)} ${WHATSAPP_NUMBER.slice(3, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`;

type FooterLink = { label: string; to: string } | { label: string; href: string };

const FooterColumn = ({ title, links, id }: { title: string; links: FooterLink[]; id?: string }) => (
  <div id={id} className="scroll-mt-24">
    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] !text-paper">{title}</h3>
    <ul className="mt-4 space-y-2.5">
      {links.map((l) => (
        <li key={l.label}>
          {'to' in l ? (
            <Link to={l.to} onClick={() => window.scrollTo(0, 0)} className="text-sm uppercase tracking-[0.08em] text-paper/65 transition-colors hover:text-paper">
              {l.label}
            </Link>
          ) : (
            <a href={l.href} className={`text-sm text-paper/65 transition-colors hover:text-paper ${
              l.href.startsWith('#') ? 'uppercase tracking-[0.08em]' : 'tracking-[0.04em]'}`}>
              {/* let long email addresses wrap at the @ rather than mid-word */}
              {l.label.includes('@') ? <>{l.label.split('@')[0]}<wbr />@{l.label.split('@')[1]}</> : l.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const socials = [
  { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: 'WhatsApp', icon: MessageCircle, external: true },
  { href: `tel:+${WHATSAPP_NUMBER}`, label: 'Call', icon: Phone, external: false },
  { href: `mailto:${BUSINESS_EMAIL}`, label: 'Email', icon: Mail, external: false },
];

export const Footer = () => {
  const { user, profile } = useAuth();

  const shop: FooterLink[] = [
    { label: 'Materials', to: '/catalog?cat=Shop' },
    { label: 'Furniture', to: '/catalog?cat=Furniture' },
    { label: 'Custom work', to: '/catalog?cat=Service' },
    { label: 'All products', to: '/catalog' },
  ];
  const company: FooterLink[] = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/catalog?cat=Service' },
    { label: 'Projects', to: '/projects' },
    { label: 'Contact', href: '#footer-contact' },
  ];
  const account: FooterLink[] = !user
    ? [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/login?mode=signup' },
      ]
    : profile?.role === 'admin'
      ? [
          { label: 'Orders', to: '/admin/orders' },
          { label: 'Stock', to: '/admin/catalog' },
          { label: 'Chat', to: '/chat' },
        ]
      : [
          { label: 'My orders', to: '/my-orders' },
          { label: 'Chat with us', to: '/chat' },
        ];
  const contact: FooterLink[] = [
    { label: prettyPhone, href: `tel:+${WHATSAPP_NUMBER}` },
    { label: BUSINESS_EMAIL, href: `mailto:${BUSINESS_EMAIL}` },
  ];

  return (
    <footer className="woodgrain mt-12 text-paper">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-8 md:pt-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <LogoMark className="h-11 w-11" />
              <span>
                <span className="block font-display text-2xl font-semibold uppercase tracking-wide text-paper">Chats &amp; Sons</span>
                <span className="block text-xs uppercase tracking-[0.18em] text-paper/60">Carpentry &amp; joinery works</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/60">
              Boards, fittings, furniture and custom joinery, made to measure in our workshop since 2000.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-4">
            <FooterColumn title="Shop" links={shop} />
            <FooterColumn title="Company" links={company} />
            <FooterColumn title="Account" links={account} />
            <FooterColumn title="Contact" links={contact} id="footer-contact" />
          </div>
        </div>

        <hr className="mt-12 border-paper/20" />

        <div className="mt-10 flex flex-col items-center gap-5">
          <div className="flex gap-3">
            {socials.map(({ href, label, icon: Icon, external }) => (
              <a key={label} href={href} aria-label={label} title={label}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="grid h-11 w-11 place-items-center rounded-full border border-paper/60 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-walnut">
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
          <p className="text-center text-sm text-paper/70">
            © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </p>
          <p className="text-center text-xs text-paper/45">
            Built by{' '}
            <a href={`mailto:${DEVELOPER.email}`} className="text-paper/70 hover:text-paper">{DEVELOPER.name}</a>
          </p>
        </div>
      </div>
    </footer>
  );
};
