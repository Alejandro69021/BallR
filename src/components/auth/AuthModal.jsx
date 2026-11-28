import React, { useState } from 'react';
import { Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { signInWithEmail, signInWithMagicLink, getCurrentUserProfile } from '../../lib/supabase';
import Dialog from '../ui/Dialog';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Masuk ke ProspekBola"
      description="Akses staf pelatih dan orang tua/wali"
      className="max-w-sm"
    >
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 p-0.5 bg-app border border-line rounded-control text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setAuthMode('password');
            setErrorMsg('');
          }}
          className={`py-1.5 px-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
            authMode === 'password'
              ? 'bg-panel text-1 shadow-sm'
              : 'text-2 hover:text-1'
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
          className={`py-1.5 px-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
            authMode === 'magic-link'
              ? 'bg-panel text-1 shadow-sm'
              : 'text-2 hover:text-1'
          }`}
        >
          Tautan masuk
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-control bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="leading-snug">{errorMsg}</p>
        </div>
      )}

      {magicLinkSent ? (
        <div className="p-4 rounded-panel bg-panel border border-line text-sm space-y-2 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto text-brand" strokeWidth={1.5} />
          <p className="font-semibold text-1 text-sm">Tautan masuk terkirim</p>
          <p className="text-2 leading-relaxed">
            Periksa kotak masuk email <span className="font-medium text-brand">{email}</span> untuk masuk langsung.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMagicLinkSent(false)}
            className="mt-2 text-sm text-2 hover:text-1"
          >
            Kirim ulang atau gunakan cara lain
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Alamat email" id="auth-email" required>
            <div className="relative">
              <Mail className="w-4 h-4 text-2 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelatih@akademi.id"
                className="w-full pl-9 pr-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </div>
          </Field>

          {authMode === 'password' && (
            <Field label="Kata sandi" id="auth-password" required>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-2 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
                />
              </div>
            </Field>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            loading={loading}
            className="w-full mt-2"
            icon={authMode === 'password' ? <ArrowRight className="w-4 h-4" strokeWidth={1.5} /> : <Mail className="w-4 h-4" strokeWidth={1.5} />}
          >
            {loading ? 'Memproses...' : authMode === 'password' ? 'Masuk' : 'Kirim tautan masuk'}
          </Button>
        </form>
      )}

      {/* Demo mode quick switcher */}
      {isDemoMode && (
        <div className="pt-3 border-t border-line space-y-2">
          <div className="flex items-center justify-between text-sm text-2">
            <Badge variant="warning" size="sm">Mode demo</Badge>
            <span>Simulasi peran</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDemoLogin('coach')}
              className="w-full text-sm"
            >
              Masuk Pelatih
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDemoLogin('parent')}
              className="w-full text-sm"
            >
              Masuk Orang Tua
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
