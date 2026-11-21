import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Field from '../components/ui/Field';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import Stat from '../components/ui/Stat';
import Badge from '../components/ui/Badge';
import Dialog from '../components/ui/Dialog';
import Toast from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import SourceNote from '../components/ui/SourceNote';
import PitchSvg from '../components/ui/PitchSvg';
import { User } from 'lucide-react';

describe('UI Component Library (src/components/ui/)', () => {
  // 1. Button
  describe('Button', () => {
    it('renders label and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Simpan</Button>);
      const btn = screen.getByRole('button', { name: 'Simpan' });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled or loading', () => {
      const { rerender } = render(<Button disabled>Nonaktif</Button>);
      expect(screen.getByRole('button', { name: 'Nonaktif' })).toBeDisabled();

      rerender(<Button loading>Memuat</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies 44px min-height/min-width touch target classes below sm breakpoint', () => {
      const { rerender } = render(<Button size="sm">Aksi Sm</Button>);
      const btnSm = screen.getByRole('button', { name: 'Aksi Sm' });
      expect(btnSm.className).toContain('min-h-[44px]');
      expect(btnSm.className).toContain('min-w-[44px]');
      expect(btnSm.className).toContain('sm:min-h-0');

      rerender(<Button size="md">Aksi Md</Button>);
      const btnMd = screen.getByRole('button', { name: 'Aksi Md' });
      expect(btnMd.className).toContain('min-h-[44px]');
      expect(btnMd.className).toContain('min-w-[44px]');
      expect(btnMd.className).toContain('sm:min-h-0');
    });
  });

  // 2. IconButton
  describe('IconButton', () => {
    it('renders with accessible aria-label and handles click', () => {
      const handleClick = vi.fn();
      render(<IconButton icon={<User />} label="Profil Pengguna" onClick={handleClick} />);
      const btn = screen.getByRole('button', { name: 'Profil Pengguna' });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies 44px touch target classes below sm breakpoint and compact sizes at sm', () => {
      const { rerender } = render(<IconButton icon={<User />} label="Ikon Sm" size="sm" />);
      const btnSm = screen.getByRole('button', { name: 'Ikon Sm' });
      expect(btnSm.className).toContain('w-[44px]');
      expect(btnSm.className).toContain('h-[44px]');
      expect(btnSm.className).toContain('min-h-[44px]');
      expect(btnSm.className).toContain('min-w-[44px]');
      expect(btnSm.className).toContain('sm:w-7');
      expect(btnSm.className).toContain('sm:h-7');

      rerender(<IconButton icon={<User />} label="Ikon Md" size="md" />);
      const btnMd = screen.getByRole('button', { name: 'Ikon Md' });
      expect(btnMd.className).toContain('w-[44px]');
      expect(btnMd.className).toContain('h-[44px]');
      expect(btnMd.className).toContain('min-h-[44px]');
      expect(btnMd.className).toContain('min-w-[44px]');
      expect(btnMd.className).toContain('sm:w-[34px]');
      expect(btnMd.className).toContain('sm:h-[34px]');
    });
  });

  // 3. Field
  describe('Field', () => {
    it('renders label, input, and helper text', () => {
      render(
        <Field label="Nama Lengkap" id="full-name" helper="Masukkan nama resmi">
          <input id="full-name" />
        </Field>
      );
      expect(screen.getByLabelText('Nama Lengkap')).toBeInTheDocument();
      expect(screen.getByText('Masukkan nama resmi')).toBeInTheDocument();
    });

    it('renders error alert message when error prop is provided', () => {
      render(
        <Field label="Email" id="email" error="Format email tidak valid">
          <input id="email" />
        </Field>
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Format email tidak valid');
    });

    it('injects 44px min-height/min-width touch target classes to wrapped inputs', () => {
      render(
        <Field label="Input Sentuh" id="touch-input">
          <input id="touch-input" />
        </Field>
      );
      const input = screen.getByLabelText('Input Sentuh');
      expect(input.className).toContain('min-h-[44px]');
      expect(input.className).toContain('min-w-[44px]');
      expect(input.className).toContain('sm:min-h-0');
    });

    it('renders input with 44px min-height/min-width when called without children', () => {
      render(<Field id="standalone-input" placeholder="Cari..." />);
      const input = screen.getByPlaceholderText('Cari...');
      expect(input.className).toContain('min-h-[44px]');
      expect(input.className).toContain('min-w-[44px]');
      expect(input.className).toContain('sm:min-h-0');
    });
  });

  // 4. Select
  describe('Select', () => {
    it('renders options and fires onChange', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'u13', label: 'U-13' },
        { value: 'u15', label: 'U-15' }
      ];
      render(<Select id="age-group" value="u13" onChange={handleChange} options={options} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('u13');
      fireEvent.change(select, { target: { value: 'u15' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('applies 44px min-height/min-width touch target classes below sm breakpoint', () => {
      render(<Select id="touch-select" options={[{ value: '1', label: 'Satu' }]} />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('min-h-[44px]');
      expect(select.className).toContain('min-w-[44px]');
      expect(select.className).toContain('sm:min-h-0');
    });
  });

  // 5. Tabs
  describe('Tabs', () => {
    it('renders tabs with role tablist and handles keyboard arrow navigation', () => {
      const handleChange = vi.fn();
      const tabs = [
        { id: 'tab1', label: 'Tab Satu' },
        { id: 'tab2', label: 'Tab Dua' },
        { id: 'tab3', label: 'Tab Tiga' }
      ];

      render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleChange} />);
      const tab1 = screen.getByRole('tab', { name: 'Tab Satu' });
      expect(tab1).toHaveAttribute('aria-selected', 'true');

      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('applies 44px min-height/min-width touch target classes to tab triggers', () => {
      render(<Tabs tabs={[{ id: 't1', label: 'Tab 1' }]} activeTab="t1" />);
      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab.className).toContain('min-h-[44px]');
      expect(tab.className).toContain('min-w-[44px]');
      expect(tab.className).toContain('sm:min-h-0');
    });
  });

  // 6. Table
  describe('Table', () => {
    const columns = [
      { key: 'name', header: 'Nama Atlet', sortable: true },
      { key: 'jersey', header: 'Nomor', align: 'center', tabular: true }
    ];
    const data = [
      { id: '1', name: 'Dimas Raditya', jersey: 10 },
      { id: '2', name: 'Bagas Pratama', jersey: 7 }
    ];

    it('renders table headers and rows with sort indicator', () => {
      const handleSort = vi.fn();
      render(
        <Table
          columns={columns}
          data={data}
          sortKey="name"
          sortDirection="asc"
          onSort={handleSort}
        />
      );

      expect(screen.getByText('Dimas Raditya')).toBeInTheDocument();
      expect(screen.getByText('Bagas Pratama')).toBeInTheDocument();

      const sortBtn = screen.getByRole('button', { name: /Nama Atlet/i });
      fireEvent.click(sortBtn);
      expect(handleSort).toHaveBeenCalledWith('name');
    });

    it('applies at least 44px touch target classes to sortable header buttons', () => {
      render(
        <Table
          columns={columns}
          data={data}
          sortKey="name"
          sortDirection="asc"
          onSort={vi.fn()}
        />
      );
      const sortBtn = screen.getByRole('button', { name: /Nama Atlet/i });
      expect(sortBtn.className).toContain('min-h-[44px]');
      expect(sortBtn.className).toContain('min-w-[44px]');
      expect(sortBtn.className).toContain('sm:min-h-0');
    });

    it('renders empty message when data is empty', () => {
      render(<Table columns={columns} data={[]} emptyMessage="Daftar pemain kosong" />);
      expect(screen.getByText('Daftar pemain kosong')).toBeInTheDocument();
    });
  });

  // 7. Stat
  describe('Stat', () => {
    it('renders structured value, unit, date, and n', () => {
      render(
        <Stat
          label="Sprint 20m"
          value="3.24"
          unit="detik"
          date="2026-10-14"
          n={42}
          trend="-0.08s"
        />
      );

      expect(screen.getByText('Sprint 20m')).toBeInTheDocument();
      expect(screen.getByText('3.24')).toBeInTheDocument();
      expect(screen.getByText('detik')).toBeInTheDocument();
      expect(screen.getByText('2026-10-14')).toBeInTheDocument();
      expect(screen.getByText('n=42')).toBeInTheDocument();
      expect(screen.getByText('-0.08s')).toBeInTheDocument();
    });

    it('renders honest empty fallback when value is null', () => {
      render(<Stat label="Vertical Jump" value={null} />);
      expect(screen.getByText('Vertical Jump')).toBeInTheDocument();
      expect(screen.getByText('Belum ada data')).toBeInTheDocument();
    });
  });

  // 8. Badge
  describe('Badge', () => {
    it('renders neutral and semantic variants', () => {
      const { rerender } = render(<Badge variant="neutral">Netral</Badge>);
      expect(screen.getByText('Netral')).toBeInTheDocument();

      rerender(<Badge variant="brand">Brand</Badge>);
      expect(screen.getByText('Brand')).toBeInTheDocument();

      rerender(<Badge variant="warning">Peringatan</Badge>);
      expect(screen.getByText('Peringatan')).toBeInTheDocument();

      rerender(<Badge variant="danger">Bahaya</Badge>);
      expect(screen.getByText('Bahaya')).toBeInTheDocument();
    });
  });

  // 9. Dialog
  describe('Dialog', () => {
    it('renders content when open and triggers onClose on Esc key', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Dialog isOpen={true} onClose={handleClose} title="Dialog Judul">
          <p>Konten Dialog</p>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Dialog Judul')).toBeInTheDocument();
      expect(screen.getByText('Konten Dialog')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();

      rerender(
        <Dialog isOpen={false} onClose={handleClose} title="Dialog Judul">
          <p>Konten Dialog</p>
        </Dialog>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // 10. Toast
  describe('Toast', () => {
    it('renders status message and subtext with accessible role status', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          message="Evaluasi Tersimpan"
          subtext="Data berhasil diperbarui."
          onClose={handleClose}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Evaluasi Tersimpan')).toBeInTheDocument();
      expect(screen.getByText('Data berhasil diperbarui.')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: 'Tutup pemberitahuan' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  // 11. EmptyState
  describe('EmptyState', () => {
    it('renders calm title and optional description', () => {
      render(
        <EmptyState
          title="Belum ada rekaman pertandingan"
          description="Video cuplikan belum diunggah staf pelatih."
        />
      );

      expect(screen.getByText('Belum ada rekaman pertandingan')).toBeInTheDocument();
      expect(screen.getByText('Video cuplikan belum diunggah staf pelatih.')).toBeInTheDocument();
    });
  });

  // 12. Skeleton
  describe('Skeleton', () => {
    it('renders with aria-hidden true and pulse animation', () => {
      const { container } = render(<Skeleton variant="rect" width={100} height={20} />);
      const el = container.firstChild;
      expect(el).toHaveAttribute('aria-hidden', 'true');
      expect(el).toHaveClass('animate-pulse');
    });
  });

  // 13. SourceNote
  describe('SourceNote', () => {
    it('renders attribution line with source, date, and n', () => {
      render(
        <SourceNote
          source="Protokol VO2Max Yo-Yo IR1"
          date="2026-10-14"
          sampleSize={38}
          citationKey="Bangsbo2008"
        />
      );

      expect(
        screen.getByText('Sumber: Protokol VO2Max Yo-Yo IR1 · 2026-10-14 · n=38 · [Bangsbo2008]')
      ).toBeInTheDocument();
    });
  });

  // 14. PitchSvg
  describe('PitchSvg', () => {
    it('renders vector pitch representation with accessible role img', () => {
      render(<PitchSvg orientation="horizontal" />);
      expect(screen.getByRole('img', { name: /Representasi taktis lapangan sepak bola/i })).toBeInTheDocument();
    });

    it('renders in vertical orientation', () => {
      render(<PitchSvg orientation="vertical" />);
      expect(screen.getByRole('img', { name: /Representasi taktis lapangan sepak bola/i })).toBeInTheDocument();
    });
  });
});
