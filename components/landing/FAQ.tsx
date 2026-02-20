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
        className="w-full flex items-center justify-between py-5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 light:focus-visible:ring-offset-white rounded-lg"
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
      'ReplySequence connects to your Zoom, Microsoft Teams, or Google Meet account. When your meeting ends and a transcript is available, our AI automatically analyzes the conversation, extracts key points, action items, and commitments, then generates a professional follow-up email draft. The entire process takes about 8 seconds from meeting end to draft ready.',
  },
  {
    question: 'Which meeting platforms are supported?',
    answer:
      'We currently support Zoom, Microsoft Teams, and Google Meet. All three platforms are fully integrated with automatic transcript retrieval. We are actively working on additional platform integrations based on user feedback.',
  },
  {
    question: 'How fast are the email drafts generated?',
    answer:
      'Our AI generates follow-up email drafts in approximately 8 seconds after receiving the meeting transcript. This is roughly 10x faster than writing the email yourself, giving you back hours each week to focus on what matters most - closing deals.',
  },
  {
    question: 'Is my meeting data secure?',
    answer:
      'Absolutely. Security is our top priority. We use AES-256 encryption for sensitive data and TLS for all data in transit. Our infrastructure runs on SOC 2 Type II certified providers (Vercel and Supabase). Meeting transcripts are processed securely and are never shared with third parties or used for AI training.',
  },
  {
    question: 'Can I edit the AI-generated drafts?',
    answer:
      'Yes! Every draft is fully editable before sending. While our AI produces high-quality drafts that capture the key points from your meetings, you have complete control to adjust the tone, add personal touches, or modify any content before hitting send.',
  },
  {
    question: 'What CRMs does ReplySequence integrate with?',
    answer:
      'We integrate with HubSpot, Salesforce, Airtable, and Google Sheets for CRM logging. When you send a follow-up email, the activity is automatically logged to your CRM, keeping your records up to date without manual entry.',
  },
  {
    question: 'How much does ReplySequence cost?',
    answer:
      'ReplySequence offers a free plan with 5 AI drafts per month. Our Pro plan is $19/month (or $15/month billed annually) for unlimited AI drafts and custom templates. For teams, the Team plan is $29/month with CRM sync, collaboration features, and API access. You can upgrade or downgrade at any time.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No installation required. ReplySequence is a cloud-based web application. Simply sign up, connect your meeting platform through our secure OAuth integration, and you are ready to go. Your email drafts will be accessible from any device with a web browser.',
  },
  {
    question: 'How do I connect my meeting platform?',
    answer:
      'Connecting your meeting platform takes just one click. During setup, you will authorize ReplySequence to access your meeting transcripts through a secure OAuth connection. This grants read-only access to transcripts - we never have access to your meeting recordings or other account data.',
  },
  {
    question: 'What happens if I miss a meeting or the transcript is unavailable?',
    answer:
      'ReplySequence only processes meetings where transcripts are available. If your meeting platform did not generate a transcript (for example, if transcription was disabled), we cannot generate a follow-up draft. We recommend ensuring transcription is enabled in your meeting platform settings for all meetings you want ReplySequence to process.',
  },
  {
    question: 'What if the AI gets something wrong in a draft?',
    answer:
      'Every draft is a suggestion, not a sent email. You always review and approve before anything goes out. The AI pulls directly from your meeting transcript, so the content is grounded in what was actually said. If something needs adjusting, you can edit inline or regenerate with different parameters. Nothing sends without your explicit approval.',
  },
  {
    question: 'Can I customize the emails to match my team\'s tone and templates?',
    answer:
      'Yes. ReplySequence supports custom email templates that reflect your brand voice, formatting preferences, and standard follow-up structure. The AI uses these templates as a foundation while adding call-specific details from the transcript. Your prospects will not be able to tell the difference between an AI-assisted draft and one your best rep wrote manually.',
  },
  {
    question: 'Will this mess up our CRM data?',
    answer:
      'ReplySequence only writes to agreed-upon fields in your CRM. All activity logs are visible and auditable. We log the follow-up email, key action items, and meeting outcome — nothing more. If you use HubSpot or Salesforce, the integration maps to your existing properties. For Google Sheets, you choose exactly which columns to sync. You can review exactly what gets synced before enabling CRM logging.',
  },
  {
    question: 'How accurate is the AI at capturing what happened in a meeting?',
    answer:
      'The AI works directly from your meeting transcript, not from summaries or notes. It identifies speakers, extracts commitments and action items, and references specific discussion points. Accuracy depends on transcript quality (clear audio helps), but most users find the drafts capture 90%+ of what they would have written manually — in a fraction of the time.',
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
              className="text-blue-400 light:text-blue-600 hover:text-blue-300 light:hover:text-blue-700 underline underline-offset-2 transition-colors"
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
