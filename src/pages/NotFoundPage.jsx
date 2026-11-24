import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none text-1">
      <BrandMark size={56} className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-1 mb-2">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-sm text-2 max-w-md mb-6 leading-relaxed">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate('/')}
        className="min-h-[44px]"
      >
        Kembali ke Beranda
      </Button>
    </div>
  );
}
