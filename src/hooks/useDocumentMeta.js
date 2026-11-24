import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Mengelola metadata dokumen (robots, title) secara dinamis per rute.
 * Rute publik ("/" dan "/privasi") diizinkan untuk diindeks mesin pencari.
 * Seluruh rute aplikasi (/beranda, /skuad, /laga, dll.) diberi tanda "noindex, nofollow"
 * sesuai LANDING_SPEC bagian 7.
 */
export function useDocumentMeta() {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const isIndexable = location.pathname === '/' || location.pathname === '/privasi';

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }

    metaRobots.setAttribute('content', isIndexable ? 'index, follow' : 'noindex, nofollow');
  }, [location.pathname]);
}

export default useDocumentMeta;
