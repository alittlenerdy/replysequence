'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border-b border-gray-700 light:border-gray-200 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white rounded-lg"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-lg font-semibold text-white light:text-gray-900 pr-4 group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gray-400 light:text-gray-500 group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 light:text-gray-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const faqData = [
  {
    question: 'How does ReplySequence work?',
    answer:
      'After your Zoom, Teams, or Meet call ends, ReplySequence reads the transcript and generates a personalized follow-up email, triggers a multi-step sequence to keep the deal warm, extracts next steps with due dates, flags deal risks, and syncs everything to your CRM — automatically. You review, edit if needed, and send.',
  },
  {
    question: 'How is this different from Gong or Fathom?',
    answer:
      'Tools like Gong and Fathom record and summarize your meetings. ReplySequence goes further — it sends the follow-up, triggers sequences, tracks next steps, and flags deal risks. Those tools tell you what happened. ReplySequence does something about it.',
  },
  {
    question: 'How is this different from Outreach or Apollo?',
    answer:
      'Outreach and Apollo send sequences to cold prospects using pre-written templates. ReplySequence sends context-aware sequences to people you\'ve already spoken to, built from the actual conversation. Cold sequencers don\'t know what happened on the call. ReplySequence references specific discussion points, tracks action items, and adapts each step based on deal context.',
  },
  {
    question: 'Will the emails sound like AI wrote them?',
    answer:
      'Not after a few uses. ReplySequence learns your writing style from every edit you make. Follow-ups, sequence steps, and meeting summaries all adapt to your tone, structure, and preferences. Most users stop editing significantly within the first week.',
  },
  {
    question: 'What if the AI gets something wrong?',
    answer:
      'Every draft is a suggestion, not a sent email. You review and approve before anything leaves your inbox. Every point in the email links back to the transcript, so you can verify exactly where the AI pulled the information.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Free tier with 5 AI follow-ups per month and next-step extraction. Pro is $19/month for unlimited follow-ups, multi-step sequences, and deal risk alerts. Team is $29/month with CRM sync, deal health scoring, and meeting intelligence. No annual contracts, no platform fees, no minimum seats.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No. ReplySequence works in your browser. Connect your meeting platform with one click, link your email, and you\'re ready. Setup takes under 2 minutes.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. AES-256 encryption at rest, TLS in transit. Transcripts are processed to generate follow-ups, sequences, and deal intelligence, and are not stored permanently. Privacy-first architecture — we never read your inbox or access existing emails.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
            Frequently Asked <GradientText>Questions</GradientText>
          </h2>
          <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about ReplySequence
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl bg-gray-900/50 light:bg-white light:shadow-lg border border-gray-700 light:border-gray-200 p-6 md:p-8"
        >
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
            />
          ))}
        </motion.div>

        {/* Additional help link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 light:text-gray-600 text-sm">
            Still have questions?{' '}
            <a
              href="mailto:jimmy@replysequence.com"
              className="text-blue-400 light:text-blue-600 hover:text-blue-300 light:hover:text-blue-700 underline underline-offset-2 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
