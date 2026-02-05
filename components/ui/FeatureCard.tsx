'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, index = 0, className }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
      className={cn(
        'relative rounded-2xl bg-gray-900/50 light:bg-white light:shadow-lg border border-gray-700 light:border-gray-200 p-6 transition-all duration-300 hover:border-gray-600 light:hover:border-gray-300 hover:bg-gray-900/70 light:hover:bg-gray-50',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-gray-700 light:border-gray-200">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 light:text-gray-600">{description}</p>
    </motion.div>
  );
}
