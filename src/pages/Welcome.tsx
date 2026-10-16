import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Ruler, Package, Sofa, MessageCircle, ArrowRight, Hammer, Store, ClipboardList, MessageSquare, Phone, Mail,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/db';
import { Shell } from '../components/layout/Shell';
import { useProjects } from '../hooks/useProjects';
import { WHATSAPP_NUMBER, BUSINESS_NAME, BUSINESS_EMAIL } from '../config/constants';
import { listImage, type CatalogItem } from '../lib/catalog';

const features = [
  { icon: Ruler, title: 'Made to measure', text: 'Kitchens, wardrobes and units built to fit your space.' },
  { icon: Package, title: 'Quality materials', text: 'Boards, hinges, slides and fittings for your project.' },
  { icon: Sofa, title: 'Custom furniture', text: 'Wall units, desks and shelving in the finish you want.' },
  { icon: MessageCircle, title: 'Easy ordering', text: 'See prices here, then confirm your order on WhatsApp.' },
];

const offers = [
  { cat: 'Shop', icon: Package, title: 'Boards & fittings', text: 'Melamine, MDF, plywood and veneer sheets, plus the hinges, runners and glue to go with them.' },
  { cat: 'Furniture', icon: Sofa, title: 'Ready-made furniture', text: 'TV wall units, office desks, bookshelves and more, finished in our workshop.' },
  { cat: 'Service', icon: Hammer, title: 'Custom joinery', text: 'Fitted kitchens, built-in wardrobes and ceilings, measured and installed by our team.' },
];

const perks = [
  { icon: Store, text: 'Order materials and furniture in a few taps' },
  { icon: ClipboardList, text: 'Track every order and quote in one place' },
  { icon: MessageSquare, text: 'Chat with the workshop about your job' },
];

// +263 78 257 3320 style, for display
const prettyPhone = `+${WHATSAPP_NUMBER.slice(0, 3)} ${WHATSAPP_NUMBER.slice(3, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`;

/** Live catalogue items that have a photo (small previews only). */
const usePhotoItems = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as CatalogItem)
          .filter((item) => !!listImage(item)),
      );
    }, () => { /* keep the placeholders */ });
  }, []);
  return items;
};

/** Home page for visitors who haven't signed in yet. */
export const Welcome = () => {
  const photoItems = usePhotoItems();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  const categoryPhoto = (cat: string) => {
    const item = photoItems.find((i) => i.category === cat);
    return item ? listImage(item) : '';
  };
  const { projects: allProjects } = useProjects();
  const projects = allProjects.slice(0, 6);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi ${BUSINESS_NAME}! I'd like a quote.`)}`;

  return (
    <Shell landing>
      {/* Hero */}
      <section id="top" className="hero-wood relative overflow-hidden rounded-b-[32px] text-paper sm:rounded-b-[56px]">
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-32 sm:px-8 sm:pt-40 md:pb-16">
          <div className="mx-auto max-w-3xl animate-rise text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/80">
              Since 2000 · Carpentry &amp; joinery works
            </p>
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight !text-paper sm:text-6xl md:text-7xl">
              Crafted to measure,<br className="hidden sm:block" /> built to last.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-paper/80 sm:text-lg">
              Browse our boards, fittings and furniture, see prices and stock, and ask for a quote on custom work.
              No account needed to look around.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/catalog" className="btn-primary px-6 uppercase tracking-wide">
                Browse the shop <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={waLink} target="_blank" rel="noreferrer"
                className="btn border border-paper/40 px-6 uppercase tracking-wide text-paper hover:bg-paper/10">
                Get a quote
              </a>
            </div>
          </div>

          <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 md:mt-24 md:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="h-8 w-8 text-paper" strokeWidth={1.5} />
                <h2 className="mt-3 font-display text-lg font-semibold !text-paper sm:text-xl">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-paper/75">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">Our services</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Handcrafted work for your home and business.
            </h2>
          </div>
          <p className="text-muted md:pb-1">
            From a single board to a fitted kitchen, everything we make and supply is in the shop with prices
            and stock shown up front. Pick a section to start.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {offers.map(({ cat, icon: Icon, title, text }) => {
            const photo = categoryPhoto(cat);
            return (
              <Link key={cat} to={`/catalog?cat=${cat}`}
                className="group flex flex-col rounded-2xl border-t-2 border-brand bg-surface p-5 shadow-[0_10px_30px_rgba(42,32,23,0.08)] transition-shadow hover:shadow-[0_14px_40px_rgba(42,32,23,0.14)] sm:p-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-xl font-semibold leading-tight">{title}</h3>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{text}</p>
                <div className="relative mt-5">
                  <span className="absolute -top-4 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-brand text-white shadow transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <div className="woodgrain aspect-[16/10] overflow-hidden rounded-xl">
                    {photo ? (
                      <img src={photo} alt={title} loading="lazy" decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <Icon className="h-10 w-10 text-paper/30" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="bg-sand/60 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">Projects</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">From our workshop</h2>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              See all projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {projects.map((p) => (
                <Link key={p.id} to={`/projects?open=${p.id}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-walnut">
                  {p.thumbs[0] && (
                    <img src={p.thumbs[0]} alt={p.title} loading="lazy" decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-10 text-paper">
                    <span className="block text-[11px] uppercase tracking-wider text-paper/70">{p.category}</span>
                    <span className="block text-sm font-semibold leading-snug sm:text-base">{p.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-line p-10 text-center">
              <p className="font-semibold">Photos of our work are on their way</p>
              <p className="mt-1 text-sm text-muted">Ask us on WhatsApp and we'll send you pictures of past jobs.</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-whatsapp mt-4">
                <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">Contact</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">Talk to the workshop</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">Questions, quotes or a site visit, get in touch whichever way suits you.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: MessageCircle, title: 'WhatsApp', value: prettyPhone, tone: 'bg-whatsapp', external: true },
            { href: `tel:+${WHATSAPP_NUMBER}`, icon: Phone, title: 'Call us', value: prettyPhone, tone: 'bg-brand', external: false },
            { href: `mailto:${BUSINESS_EMAIL}`, icon: Mail, title: 'Email', value: BUSINESS_EMAIL, tone: 'bg-walnut', external: false },
          ].map(({ href, icon: Icon, title, value, tone, external }) => (
            <a key={title} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="card flex flex-col items-center gap-3 p-6 text-center transition-colors hover:border-brand/40">
              <span className={`grid h-12 w-12 place-items-center rounded-full text-white ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold">{title}</span>
              <span className="break-all text-sm text-muted">{value}</span>
            </a>
          ))}
        </div>

        {/* Account pitch */}
        <div className="woodgrain mt-14 rounded-3xl p-6 text-paper sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold !text-paper sm:text-3xl">Ready to order?</h2>
              <p className="mt-1 text-paper/70">Create a free account when you're ready to buy. It takes less than a minute.</p>
              <ul className="mt-5 space-y-2.5">
                {perks.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-paper/90">
                    <Icon className="h-4 w-4 shrink-0 text-[#e9b48c]" /> {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link to="/login?mode=signup" className="btn bg-brand text-white hover:bg-brand-dark">Create a free account</Link>
              <Link to="/login" className="btn border border-paper/30 text-paper hover:bg-paper/10">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
};
