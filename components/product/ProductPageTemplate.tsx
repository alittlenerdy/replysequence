// components/product/ProductPageTemplate.tsx
'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const productPages = [
  { href: '/product/follow-ups', title: 'Follow-Ups', color: '#6366F1' },
  { href: '/product/sequences', title: 'Sequences', color: '#7C3AED' },
  { href: '/product/meeting-intelligence', title: 'Meeting Intelligence', color: '#06B6D4' },
  { href: '/product/pipeline-automation', title: 'Pipeline Automation', color: '#F59E0B' },
];

const WaitlistForm = dynamic(
  () => import('@/components/landing/WaitlistForm').then(m => ({ default: m.WaitlistForm })),
  { ssr: false }
);

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface UseCaseItem {
  title: string;
  description: string;
  audience: string;
}

interface ProductPageProps {
  accent: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bullets: string[];
  demo: React.ReactNode;
  features: FeatureItem[];
  useCases: UseCaseItem[];
}

export function ProductPageTemplate({
  accent,
  icon: Icon,
  title,
  subtitle,
  bullets,
  demo,
  features,
  useCases,
}: ProductPageProps) {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-[#F8FAFC] text-white light:text-gray-900">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${accent}15 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${accent}15`, boxShadow: `0 0 40px ${accent}20` }}
            >
              <Icon className="w-8 h-8" style={{ color: accent }} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[#E8ECF4] light:text-gray-900 text-pretty">
              {title}
            </h1>
            <p className="text-xl text-[#C0C8E0] light:text-gray-600 mb-8 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-sm text-[#8892B0] light:text-gray-500 font-medium">{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-12 px-4" style={{ background: '#0C1425' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-8 md:p-12 light:shadow-lg"
            style={{ boxShadow: `0 0 60px ${accent}08` }}
          >
            {demo}
          </motion.div>
          <p className="text-center mt-4">
            <Link href="/demo" className="text-sm text-gray-400 hover:text-white light:text-gray-500 light:hover:text-gray-900 transition-colors">
              Try it yourself with the interactive demo →
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, rgba(10,16,32,0.5) 0%, transparent 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#E8ECF4] light:text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="rounded-xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 light:shadow-sm shadow-lg shadow-black/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <FeatureIcon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#8892B0] light:text-gray-500">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4" style={{ background: '#0C1425' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#E8ECF4] light:text-gray-900">
            Built For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 text-center light:shadow-sm shadow-lg shadow-black/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                style={{ borderTop: `3px solid ${accent}` }}
              >
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {uc.audience}
                </span>
                <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-[#8892B0] light:text-gray-500">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross Navigation */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Watch Demo
            </Link>
            <div className="flex flex-wrap justify-center gap-3">
              {productPages
                .filter((p) => !title.toLowerCase().includes(p.title.toLowerCase()))
                .map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-[#2A3558] light:border-gray-200 bg-[#0F1629]/80 light:bg-gray-50 text-[#C0C8E0] light:text-gray-600 hover:text-white light:hover:text-gray-900 hover:bg-[#1A2340] transition-all duration-200"
                    style={{ ['--hover-color' as string]: p.color, borderColor: `${p.color}30` }}
                  >
                    {p.title} →
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4" style={{ background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 55%)` }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900">
            Ready to See It In Action?
          </h2>
          <p className="text-[#C0C8E0] light:text-gray-600 mb-8">
            Start with 5 free AI drafts. No credit card required.
          </p>
          <div className="glass-border-accent rounded-2xl p-6 sm:p-10">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </div>
  );
}
