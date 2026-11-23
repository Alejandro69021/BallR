import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';

/**
 * MenuButton component (src/components/ux/MenuButton.jsx)
 * Per docs/UX_SPEC.md:
 * - Accessible overflow menu
 * - aria-haspopup="menu", aria-expanded
 * - Escape closes and returns focus to the button
 * - Arrow Up/Down navigate items
 * - Tab closes menu
 * - Menu items >= 44px touch targets
 *
 * @param {string} [label="Lainnya"]
 * @param {Array<{ id: string, label: string, icon?: React.ReactNode, onClick: () => void, variant?: 'default' | 'danger', disabled?: boolean }>} items
 * @param {'secondary' | 'ghost'} [variant="secondary"]
 * @param {'sm' | 'md'} [size="md"]
 * @param {string} [className=""]
 */
export default function MenuButton({
  label = 'Lainnya',
  items = [],
  variant = 'secondary',
  size = 'md',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Focus management when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [isOpen, focusedIndex]);

  const updatePlacement = () => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpward(spaceBelow < 180 && spaceAbove > spaceBelow);
  };

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        updatePlacement();
        setFocusedIndex(0);
      }
      return next;
    });
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updatePlacement();
      setIsOpen(true);
      setFocusedIndex(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      updatePlacement();
      setIsOpen(true);
      setFocusedIndex(items.length - 1);
    }
  };

  const handleMenuKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      // Let Tab move focus naturally to the next page element
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(items.length - 1);
    }
  };

  const handleItemClick = (item) => {
    if (item.disabled) return;
    setIsOpen(false);
    triggerRef.current?.focus();
    item.onClick?.();
  };

  const menuId = 'overflow-menu-dropdown';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <Button
        ref={triggerRef}
        type="button"
        variant={variant}
        size={size}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className="min-h-[44px] gap-1.5 font-medium"
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className={`absolute right-0 z-50 min-w-[210px] py-1.5 bg-panel border border-line rounded-panel shadow-lg focus:outline-none ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {items.map((item, idx) => {
            const isDanger = item.variant === 'danger';
            return (
              <button
                key={item.id || idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={`w-full text-left px-3.5 py-2.5 min-h-[44px] flex items-center gap-2.5 text-sm transition-colors cursor-pointer select-none focus:outline-none ${
                  isDanger
                    ? 'text-danger hover:bg-danger/10 focus:bg-danger/10 font-medium'
                    : 'text-1 hover:bg-raised focus:bg-raised'
                } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
