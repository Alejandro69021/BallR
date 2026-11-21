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
