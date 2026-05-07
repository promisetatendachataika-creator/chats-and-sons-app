import { MessageCircle, Mail, Phone, Code2, ExternalLink } from 'lucide-react';
import { WHATSAPP_NUMBER, BUSINESS_EMAIL, BUSINESS_NAME } from '../../config/constants';

const DEVELOPER = {
  name: 'Promise Chataika',
  title: 'Software Engineer',
  email: 'promisetatendachataika@gmail.com',
  initials: 'PC',
};

export const Footer = () => {
  const year = new Date().getFullYear();

  const openWhatsApp = () => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  const openEmail = () => window.open(`mailto:${BUSINESS_EMAIL}`, '_blank');
  const openDevEmail = () => window.open(`mailto:${DEVELOPER.email}`, '_blank');

  return (
    <footer className="border-t border-white/5 bg-black/60 backdrop-blur-xl mt-16">

      {/* Business row */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

          {/* Left — Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs">C&S</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest leading-none">Chats and Sons</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">carpentry and joinery</p>
            </div>
          </div>

          {/* Centre — Copyright */}
          <p className="text-[11px] text-gray-600 uppercase tracking-widest text-center">
            © {year} — {BUSINESS_NAME}
          </p>

          {/* Right — Contact links */}
          <div className="flex items-center gap-5">
            <button onClick={openWhatsApp}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-widest hover:text-[#25D366] transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button onClick={openEmail}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-widest hover:text-[var(--color-neon-blue)] transition-colors">
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <a href={`tel:+${WHATSAPP_NUMBER}`}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          </div>
        </div>
      </div>

      {/* Developer credit row */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            {/* Developer identity */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[var(--color-neon-purple)]/20 border border-[var(--color-neon-purple)]/30 flex items-center justify-center shrink-0">
                <span className="text-[var(--color-neon-purple)] font-bold text-[10px]">{DEVELOPER.initials}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  {DEVELOPER.name}
                </span>
                <span className="text-gray-700 text-[11px]">|</span>
                <span className="text-[11px] text-gray-600 uppercase tracking-widest">
                  {DEVELOPER.title}
                </span>
              </div>
            </div>

            {/* Centre — built with */}
            <div className="flex items-center gap-2">
              <Code2 className="w-3 h-3 text-gray-700" />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                Built with React, Firebase & Tailwind
              </p>
            </div>

            {/* Dev contact */}
            <button
              onClick={openDevEmail}
              className="flex items-center gap-1.5 text-[11px] text-gray-600 uppercase tracking-widest hover:text-[var(--color-neon-purple)] transition-colors group"
            >
              <Mail className="w-3 h-3" />
              {DEVELOPER.email}
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

          </div>
        </div>
      </div>

    </footer>
  );
};
