'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  avatarUrl?: string;
}

// Replace these with real testimonials from beta users
const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    title: 'VP of Sales',
    company: 'TechCorp',
    quote: 'I used to spend 30 minutes after every call writing follow-ups and updating the CRM. Now the follow-up, the sequence, and the CRM update are all done before my next meeting starts. My team closes faster because nothing falls through the cracks.',
  },
  {
    name: 'Marcus Rivera',
    title: 'Account Executive',
    company: 'CloudScale',
    quote: 'The meeting intelligence is what sold me. It pulls out action items, tracks next steps with due dates, and flags deal risks I would have missed. I can ask it questions across all my calls and get instant answers.',
  },
  {
    name: 'Priya Patel',
    title: 'Sales Manager',
    company: 'DataFlow',
    quote: 'My reps went from inconsistent follow-ups to automated sequences on every deal. The AI learns their writing style, the CRM stays accurate, and I can see deal risks across the whole pipeline. Response rates jumped 40% in the first month.',
  },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
            Trusted by <GradientText variant="amber">Sales Teams</GradientText> Who Follow Up Fast
          </h2>
          <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            Hear from teams who stopped losing deals to slow follow-ups
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative rounded-2xl border border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white p-6 flex flex-col"
            >
              {/* Quote icon */}
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Quote className="w-5 h-5 text-amber-400 light:text-amber-600" aria-hidden="true" />
              </div>

              {/* Quote text */}
              <p className="text-sm text-gray-300 light:text-gray-700 leading-relaxed flex-1 mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50 light:border-gray-200">
                {testimonial.avatarUrl ? (
                  <img
                    src={testimonial.avatarUrl}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#3A4BDD] flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(testimonial.name)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white light:text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-400 light:text-gray-600">
                    {testimonial.title}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
