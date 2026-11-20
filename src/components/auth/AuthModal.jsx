import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { signInWithEmail, signInWithMagicLink, getCurrentUserProfile } from '../../lib/supabase';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  targetView = 'assessment',
  isDemoMode = false
}) {
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'magic-link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'password') {
        await signInWithEmail(email, password);
        const profile = await getCurrentUserProfile();
        const role = profile?.role || 'public';
        if (role === 'public') {
          setErrorMsg('Akun belum terdaftar di akademi. Hubungi admin.');
          return;
        }
        onSuccess(role, targetView);
      } else {
        await signInWithMagicLink(email);
        setMagicLinkSent(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Autentikasi gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    onSuccess(role, targetView);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-[#0C111D] border border-slate-800 rounded-lg shadow-xl p-5 text-white z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-800 text-slate-200">
              <Lock className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-semibold text-white">
                Masuk ke BallR
              </h2>
              <p className="text-xs text-slate-400">
                Akses resmi staf pelatih dan orang tua/wali
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Kata Sandi vs Magic Link */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setErrorMsg('');
            }}
            className={`py-1.5 rounded transition-colors ${
              authMode === 'password'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kata sandi
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('magic-link');
              setErrorMsg('');
            }}
            className={`py-1.5 rounded transition-colors ${
              authMode === 'magic-link'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tautan masuk (Email)
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {magicLinkSent ? (
          <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-semibold text-white">Tautan masuk terkirim</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Periksa kotak masuk email <span className="font-mono text-emerald-300">{email}</span> untuk masuk langsung tanpa kata sandi.
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="mt-2 text-[11px] text-slate-400 hover:text-white underline block mx-auto"
            >
              Kirim ulang atau gunakan cara lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1">
                Alamat email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelatih@akademi.id"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>
            </div>

            {authMode === 'password' && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300 mb-1">
                  Kata sandi
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-3 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : authMode === 'password' ? (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Kirim tautan masuk</span>
                  <Mail className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Mode / Offline quick switcher (labeled clearly as illustration) */}
        {isDemoMode && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono uppercase tracking-wider text-[10px] text-amber-400">
                Mode Demo Aktif
              </span>
              <span>Simulasi Cepat</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('coach')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 transition-colors text-center"
              >
                Masuk Pelatih
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('parent')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 transition-colors text-center"
              >
                Masuk Orang Tua
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
