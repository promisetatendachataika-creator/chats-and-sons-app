import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Opens each new page at the top (unless the link points at a section with #). */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};
