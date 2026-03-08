'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ToolbarThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center">
        <Sun className="w-[18px] h-[18px] text-yellow-400" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 light:hover:bg-gray-900/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileTap={{ scale: 1.25 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <Sun className="w-[18px] h-[18px] text-yellow-400" strokeWidth={1.5} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <Moon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
