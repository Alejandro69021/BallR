/**
 * Safe localStorage wrapper for WelcomeTour and onboarding.
 * Ensures no bare localStorage access happens without try/catch.
 */

export const TOUR_STORAGE_KEY = 'ballr_tour_done_v1';

export function isTourDone() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch (err) {
    console.warn('Gagal membaca status tur dari localStorage:', err);
    return false;
  }
}

export function setTourDone() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    return true;
  } catch (err) {
    console.warn('Gagal menyimpan status tur ke localStorage:', err);
    return false;
  }
}

export function resetTourDone() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.removeItem(TOUR_STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('Gagal mereset status tur di localStorage:', err);
    return false;
  }
}
