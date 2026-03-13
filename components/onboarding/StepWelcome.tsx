'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Clock, Mail } from 'lucide-react';

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const features = [
    {
      icon: Zap,
      title: 'Follow-ups from the transcript',
      description: 'AI generates drafts in seconds',
    },
    {
      icon: Clock,
      title: 'Sequences that keep deals warm',
      description: 'Never write follow-ups manually',
    },
    {
      icon: Mail,
      title: 'CRM updates itself',
      description: 'Review and send with ease',
    },
  ];

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5B6CFF]/10 to-[#3A4BDD]/10 border border-[#5B6CFF]/20 mb-6">
          <Zap className="w-4 h-4 text-[#5B6CFF]" />
          <span className="text-[#5B6CFF] text-sm font-medium">Setup takes 2 minutes</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold mb-4"
      >
        <span className="bg-gradient-to-r from-[#7A8BFF] via-[#5B6CFF] to-[#4A5BEE] bg-clip-text text-transparent">
          Every meeting gets a follow-up.
        </span>
        <br />
        <span className="text-white">Automatically.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
      >
        Connect your meeting platform and let ReplySequence handle the rest. Setup takes 2 minutes.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B6CFF]/20 to-[#3A4BDD]/20 flex items-center justify-center mb-4 mx-auto">
              <feature.icon className="w-6 h-6 text-[#5B6CFF]" />
            </div>
            <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5B6CFF] to-[#3A4BDD] text-white font-semibold rounded-xl hover:from-[#4A5BEE] hover:to-[#2A3ACC] transition-[color,background-color,box-shadow] duration-200 shadow-lg shadow-[#5B6CFF]/25"
      >
        Start Setup
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
