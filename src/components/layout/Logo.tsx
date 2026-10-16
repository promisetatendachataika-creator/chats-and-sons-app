/** The saw-and-hammer emblem from the Chataika & Sons logo. */
export const LogoMark = ({ className = 'h-9 w-9' }: { className?: string; light?: boolean }) => (
  <img src="/logo-mark.png" alt="" aria-hidden="true" width={128} height={128}
    className={`shrink-0 rounded-[10px] ${className}`} />
);

/** The full Chataika & Sons logo (badge with name), for the login screen. */
export const FullLogo = ({ className = 'w-48' }: { className?: string }) => (
  <img src="/logo-full.png" alt="Chataika & Sons, carpentry and joinery works" width={560} height={487}
    className={`rounded-2xl ${className}`} />
);

export const Logo = ({ light = false }: { light?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <LogoMark />
    <span className="leading-tight">
      <span className={`block font-display text-[17px] font-semibold ${light ? 'text-paper' : 'text-ink'}`}>
        Chats &amp; Sons
      </span>
      <span className={`block text-[11px] tracking-wide ${light ? 'text-paper/60' : 'text-muted'}`}>
        Carpentry &amp; Joinery
      </span>
    </span>
  </span>
);
