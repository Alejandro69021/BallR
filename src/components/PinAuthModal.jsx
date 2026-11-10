import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Delete,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function PinAuthModal({
  onSuccess,
  onClose,
  targetView = 'assessment'
}) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const MASTER_PIN_PRIMARY = '2026';
  const MASTER_PIN_SECONDARY = '1234';

  const playChime = (success = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(success ? 784 : 260, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const handleKeyPress = (num) => {
    if (pin.length >= 4) return;
    setIsError(false);
    setErrorMessage('');
    const nextPin = pin + num;
    setPin(nextPin);

    if (nextPin.length === 4) {
      validatePin(nextPin);
    }
  };

  const handleDelete = () => {
    setIsError(false);
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setIsError(false);
    setErrorMessage('');
    setPin('');
  };

  const validatePin = (inputPin) => {
    if (inputPin === MASTER_PIN_PRIMARY || inputPin === MASTER_PIN_SECONDARY) {
      playChime(true);
      setTimeout(() => {
        onSuccess(targetView);
      }, 250);
    } else {
      playChime(false);
      setIsError(true);
      setErrorMessage('PIN Salah. Master PIN Pelatih: 2026');
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
      if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-sm bg-[#111827] border-2 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/80 space-y-5 transition-all ${
          isError ? 'border-red-500 animate-shake' : 'border-[#1F2937]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-lime-500/10 border border-[#CCFF00]/30 text-[#CCFF00]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-athletic text-lg font-bold text-white tracking-tight">
                Coach Quick-PIN Portal
              </h3>
              <p className="text-[11px] text-slate-400">
                Akses Eksklusif Staf Kepelatihan MPFA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#090D16] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Digit Masked Indicators */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    isFilled
                      ? 'bg-[#CCFF00] border-[#CCFF00] scale-125 shadow-[0_0_10px_#CCFF00]'
                      : 'bg-transparent border-slate-600'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage ? (
            <p className="text-xs font-semibold text-red-400 flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Masukkan 4 digit PIN pelatih untuk membuka form evaluasi
            </p>
          )}
        </div>

        {/* Tactile Numeric Keypad (44px min touch target) */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="min-h-[52px] rounded-2xl bg-[#090D16] hover:bg-[#1F2937] active:bg-[#CCFF00] active:text-black border border-slate-800 hover:border-slate-700 text-white font-athletic text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[52px] rounded-2xl bg-[#090D16] hover:bg-red-500/20 active:bg-red-500 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-athletic font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            Clear
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="min-h-[52px] rounded-2xl bg-[#090D16] hover:bg-[#1F2937] active:bg-[#CCFF00] active:text-black border border-slate-800 hover:border-slate-700 text-white font-athletic text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
          >
            0
          </button>

          {/* Delete / Backspace */}
          <button
            type="button"
            onClick={handleDelete}
            className="min-h-[52px] rounded-2xl bg-[#090D16] hover:bg-[#1F2937] active:bg-slate-700 text-slate-300 border border-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Hapus digit"
          >
            <Delete className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Master PIN Hint Helper */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500">
            Demo Master PIN: <strong className="text-[#CCFF00] font-mono">2026</strong>
          </span>
        </div>

      </div>
    </div>
  );
}

