'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji or symbol
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'action' | 'settings';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-drafts',
      label: 'Go to Drafts',
      description: 'View and manage email drafts',
      icon: '\u2709',
      action: () => router.push('/dashboard'),
      category: 'navigation',
    },
    {
      id: 'nav-meetings',
      label: 'Go to Meetings',
      description: 'View all meetings',
      icon: '\uD83C\uDFA5',
      action: () => router.push('/dashboard/meetings'),
      category: 'navigation',
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'View analytics dashboard',
      icon: '\uD83D\uDCCA',
      action: () => router.push('/dashboard/analytics'),
      category: 'navigation',
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Manage integrations and preferences',
      icon: '\u2699',
      action: () => router.push('/dashboard/settings'),
      category: 'navigation',
    },
    {
      id: 'nav-billing',
      label: 'Go to Billing',
      description: 'Manage subscription and payments',
      icon: '\uD83D\uDCB3',
      action: () => router.push('/dashboard/billing'),
      category: 'navigation',
    },
    {
      id: 'nav-pricing',
      label: 'View Pricing',
      description: 'Compare plans and upgrade',
      icon: '\uD83D\uDCB0',
      action: () => router.push('/dashboard/pricing'),
      category: 'navigation',
    },
    // Actions
    {
      id: 'action-export',
      label: 'Export Drafts as CSV',
      description: 'Download all drafts as a spreadsheet',
      icon: '\uD83D\uDCE5',
      action: () => {
        const link = document.createElement('a');
        link.href = '/api/drafts/export';
        link.download = 'drafts.csv';
        link.click();
      },
      category: 'action',
    },
    // Settings
    {
      id: 'settings-theme',
      label: 'Toggle Theme',
      description: 'Switch between dark and light mode',
      icon: '\uD83C\uDF13',
      action: () => {
        document.documentElement.classList.toggle('light');
      },
      category: 'settings',
    },
  ];

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const runCommand = useCallback(
    (cmd: Command) => {
      setIsOpen(false);
      setQuery('');
      cmd.action();
    },
    []
  );

  // Open/close with Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle arrow keys and enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        runCommand(filteredCommands[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, runCommand]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    settings: 'Settings',
  };

  // Group by category
  const grouped = filteredCommands.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Track cumulative index for keyboard navigation
  let cumulativeIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
          >
            <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50 light:border-gray-200">
                <svg
                  className="w-5 h-5 text-gray-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white light:text-gray-900 placeholder-gray-500 light:placeholder-gray-400 outline-none text-sm"
                />
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-800 light:bg-gray-100 rounded border border-gray-700 light:border-gray-200">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No commands found for &quot;{query}&quot;
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, cmds]) => {
                    const result = (
                      <div key={category}>
                        <div className="px-4 py-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 light:text-gray-400">
                            {categoryLabels[category] || category}
                          </span>
                        </div>
                        {cmds.map((cmd) => {
                          const index = cumulativeIndex++;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => runCommand(cmd)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                selectedIndex === index
                                  ? 'bg-blue-500/10 text-white light:text-gray-900'
                                  : 'text-gray-300 light:text-gray-700 hover:bg-gray-800/50 light:hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-lg shrink-0 w-7 text-center">{cmd.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{cmd.label}</div>
                                <div className="text-xs text-gray-500 light:text-gray-400 truncate">
                                  {cmd.description}
                                </div>
                              </div>
                              {cmd.shortcut && (
                                <kbd className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-800 light:bg-gray-100 rounded border border-gray-700 light:border-gray-200">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                    return result;
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-gray-700/50 light:border-gray-200 flex items-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-800 light:bg-gray-100 rounded border border-gray-700 light:border-gray-200">&uarr;</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-800 light:bg-gray-100 rounded border border-gray-700 light:border-gray-200">&darr;</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-800 light:bg-gray-100 rounded border border-gray-700 light:border-gray-200">&crarr;</kbd>
                  to select
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
