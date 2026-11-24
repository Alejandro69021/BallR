/**
 * Application Routes Table (BallR)
 * Ground-truth route registry for routing and validation
 */

export const LAYOUT_OPT_OUT_ROUTES = [
  '/laga/:matchId/laporan',
  '/verifikasi/:hash'
];

export const APP_ROUTES = [
  { path: '/', label: 'Beranda' },
  { path: '/pemain/:publicId', label: 'Paspor' },
  { path: '/pemain/:publicId/laga', label: 'Laga Pemain' },
  { path: '/pemain/:publicId/laga/:matchId', label: 'Laga Detail Pemain' },
  { path: '/pemain/:publicId/pertumbuhan', label: 'Pertumbuhan' },
  { path: '/skuad', label: 'Skuad' },
  { path: '/penilaian/:playerId', label: 'Evaluasi' },
  { path: '/pencatatan', label: 'Pencatatan' },
  { path: '/pencatatan/:matchId', label: 'Logger Laga' },
  { path: '/laga', label: 'Laga' },
  { path: '/laga/:matchId', label: 'Detail Laga' },
  { path: '/laga/:matchId/laporan', label: 'Laporan Laga', optOutLayout: true },
  { path: '/taktik', label: 'Taktik' },
  { path: '/taktik/:id', label: 'Detail Taktik' },
  { path: '/verifikasi/:hash', label: 'Verifikasi', optOutLayout: true },
  { path: '/rujukan', label: 'Rujukan' },
  { path: '/bantuan', label: 'Panduan Singkat' }
];

/**
 * Validates if a target URL path matches any registered route pattern in APP_ROUTES.
 * @param {string} targetPath
 * @returns {boolean}
 */
export function resolveRoute(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const clean = targetPath.split('?')[0].split('#')[0];
  return APP_ROUTES.some((route) => {
    if (route.path === clean) return true;
    const regexPattern = '^' + route.path.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
    return new RegExp(regexPattern).test(clean);
  });
}
