import React, { useRef } from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) {
  const tabListRef = useRef(null);

  const handleKeyDown = (e, index) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[newIndex];
    if (nextTab && onChange) {
      onChange(nextTab.id);
      const buttons = tabListRef.current?.querySelectorAll('button[role="tab"]');
      buttons?.[newIndex]?.focus();
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center gap-1 border-b border-[#DAD6CC] dark:border-[#2C3643] overflow-x-auto scrollbar-none ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange?.(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative py-2.5 px-3 text-xs md:text-sm font-medium transition-colors duration-150 ease-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FB286] rounded-t-[4px] cursor-pointer ${
              isActive
                ? 'text-[#14181F] dark:text-[#E8ECF1] font-semibold'
                : 'text-[#4A5360] dark:text-[#9AA6B5] hover:text-[#14181F] dark:hover:text-[#E8ECF1]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-[#4A5360] dark:text-[#9AA6B5]">
                  {tab.count}
                </span>
              )}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E7D5B] dark:bg-[#4FB286] rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
