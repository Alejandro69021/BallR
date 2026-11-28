import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Dialog from '../components/ui/Dialog';

function Host() {
  const [open, setOpen] = useState(true);
  const [v, setV] = useState('');
  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)} title="T">
      <textarea aria-label="desc" value={v} onChange={(e) => setV(e.target.value)} />
    </Dialog>
  );
}

describe('Dialog focus while typing', () => {
  it('keeps focus on the textarea after every keystroke', async () => {
    render(<Host />);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const ta = screen.getByLabelText('desc');
    ta.focus();
    for (const ch of 'abcdef') {
      fireEvent.change(ta, { target: { value: (ta.value || '') + ch } });
      await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      expect(document.activeElement).toBe(ta);
    }
    expect(ta.value).toBe('abcdef');
  });

  it('calls the latest onClose when Escape is pressed', async () => {
    const handleClose1 = vi.fn();
    const handleClose2 = vi.fn();

    function EscapeHost({ onClose }) {
      return (
        <Dialog isOpen={true} onClose={onClose} title="Escape Test">
          <input aria-label="field" />
        </Dialog>
      );
    }

    const { rerender } = render(<EscapeHost onClose={handleClose1} />);
    rerender(<EscapeHost onClose={handleClose2} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose1).not.toHaveBeenCalled();
    expect(handleClose2).toHaveBeenCalledTimes(1);
  });

  it('returns focus to opener after the dialog closes', async () => {
    function OpenerHost() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button id="opener-btn" onClick={() => setIsOpen(true)}>Buka Dialog</button>
          <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Restore Focus">
            <input aria-label="inside-input" />
          </Dialog>
        </div>
      );
    }

    render(<OpenerHost />);
    const opener = screen.getByRole('button', { name: 'Buka Dialog' });
    opener.focus();
    expect(document.activeElement).toBe(opener);

    fireEvent.click(opener);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    const inside = screen.getByLabelText('inside-input');
    inside.focus();
    expect(document.activeElement).toBe(inside);

    // Close the dialog using Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    expect(document.activeElement).toBe(opener);
  });

  it('wraps focus from the last focusable element to the first on Tab', async () => {
    function TabHost() {
      return (
        <Dialog isOpen={true} onClose={() => {}} title="Tab Trap">
          <input aria-label="first-input" />
          <input aria-label="last-input" />
        </Dialog>
      );
    }

    render(<TabHost />);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    const closeBtn = screen.getByRole('button', { name: /Tutup dialog/i });
    const lastInput = screen.getByLabelText('last-input');

    lastInput.focus();
    expect(document.activeElement).toBe(lastInput);

    // Press Tab from last focusable
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Press Shift+Tab from first focusable (closeBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastInput);
  });
});

describe('Dialog layout & overflow contract', () => {
  it('renders panel with max-height contract, scrollable body and shrink-0 header/footer', () => {
    render(
      <Dialog
        isOpen={true}
        onClose={() => {}}
        title="Layout Test"
        footer={<button id="test-submit">Simpan</button>}
      >
        <p>Konten uji</p>
      </Dialog>
    );

    const dialogPanel = screen.getByRole('dialog').querySelector('.relative.w-full');
    expect(dialogPanel).not.toBeNull();
    expect(dialogPanel.className).toMatch(/max-h-\[calc\(100vh-1rem\)\]/);
    expect(dialogPanel.className).toMatch(/max-h-\[calc\(100dvh-1rem\)\]/);
    expect(dialogPanel.className).toMatch(/sm:max-h-\[calc\(100dvh-2rem\)\]/);
    expect(dialogPanel.className).toMatch(/flex flex-col/);

    // Header has shrink-0
    const headerTitle = screen.getByText('Layout Test');
    const headerEl = headerTitle.closest('.shrink-0');
    expect(headerEl).not.toBeNull();

    // Body has overflow-y-auto and min-h-0
    const bodyContent = screen.getByText('Konten uji');
    const bodyEl = bodyContent.closest('.overflow-y-auto');
    expect(bodyEl).not.toBeNull();
    expect(bodyEl.className).toMatch(/min-h-0/);
    expect(bodyEl.className).toMatch(/flex-1/);

    // Footer has shrink-0 and button is accessible
    const footerBtn = screen.getByRole('button', { name: 'Simpan' });
    const footerEl = footerBtn.closest('.shrink-0');
    expect(footerEl).not.toBeNull();
  });

  it('keeps footer buttons reachable when children are tall', () => {
    const items = Array.from({ length: 50 }, (_, i) => `Item baris ke-${i + 1}`);
    render(
      <Dialog
        isOpen={true}
        onClose={() => {}}
        title="Tall Content Test"
        footer={<button id="tall-submit-btn">Aksi Bawah</button>}
      >
        <div data-testid="tall-list">
          {items.map((it) => (
            <div key={it}>{it}</div>
          ))}
        </div>
      </Dialog>
    );

    expect(screen.getByText('Item baris ke-50')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: 'Aksi Bawah' });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn.closest('.shrink-0')).not.toBeNull();
  });

  it('locks document.body scroll when open and restores it when closed/unmounted', () => {
    document.body.style.overflow = 'auto';

    function ToggleHost() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <div>
          <button onClick={() => setIsOpen(false)}>Tutup</button>
          <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Scroll Lock">
            <p>Lock test</p>
          </Dialog>
        </div>
      );
    }

    const { unmount } = render(<ToggleHost />);
    expect(document.body.style.overflow).toBe('hidden');

    // Close via button
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(document.body.style.overflow).toBe('auto');

    // Re-mount and unmount
    const res = render(
      <Dialog isOpen={true} onClose={() => {}} title="Unmount Test">
        <p>Unmount</p>
      </Dialog>
    );
    expect(document.body.style.overflow).toBe('hidden');
    res.unmount();
    expect(document.body.style.overflow).toBe('auto');

    unmount();
  });

  it('restores document.body scroll when nested dialogs unmount simultaneously', () => {
    document.body.style.overflow = 'auto';

    function NestedHost() {
      return (
        <>
          <Dialog isOpen={true} onClose={() => {}} title="Dialog Induk">
            <p>Induk</p>
          </Dialog>
          <Dialog isOpen={true} onClose={() => {}} title="Dialog Anak">
            <p>Anak</p>
          </Dialog>
        </>
      );
    }

    const { unmount } = render(<NestedHost />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('ensures role="dialog" and aria-modal="true" exist strictly in Dialog.jsx across src/', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    function scanDir(dir, fileList = []) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, fileList);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    }

    const srcDir = path.resolve(process.cwd(), 'src');
    const allFiles = scanDir(srcDir);
    const dialogFilesWithRole = [];
    const dialogFilesWithModal = [];

    for (const file of allFiles) {
      if (file.includes('test') || file.includes('__tests__')) continue;
      const content = fs.readFileSync(file, 'utf8');
      if (/role\s*=\s*["']dialog["']/.test(content)) {
        dialogFilesWithRole.push(path.relative(srcDir, file).replace(/\\/g, '/'));
      }
      if (/aria-modal\s*=\s*["']true["']/.test(content)) {
        dialogFilesWithModal.push(path.relative(srcDir, file).replace(/\\/g, '/'));
      }
    }

    expect(dialogFilesWithRole).toEqual(['components/ui/Dialog.jsx']);
    expect(dialogFilesWithModal).toEqual(['components/ui/Dialog.jsx']);
  });
});
