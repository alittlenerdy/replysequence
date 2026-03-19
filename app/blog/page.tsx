import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { blogPosts } from '@/lib/blog-data';
import type { Metadata } from 'next';
import { BlogGrid } from './BlogGrid';
import { Rss } from 'lucide-react';
import { BlogNewsletterSignup } from '@/components/blog/BlogNewsletterSignup';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Insights on meeting follow-up automation, sales productivity, and AI-powered email drafts. Tips for sales professionals, consultants, and recruiters.',
  openGraph: {
    title: 'Blog | ReplySequence',
    description:
      'Insights on meeting follow-up automation, sales productivity, and AI-powered email drafts.',
    url: 'https://www.replysequence.com/blog',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/blog',
    types: {
      'application/rss+xml': 'https://www.replysequence.com/blog/rss.xml',
    },
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white light:text-gray-900 mb-6 leading-[1.1]">
            Follow-Up Wins Deals.{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">
              Most Teams Do It Wrong.
            </span>
          </h1>
          <p className="text-xl text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto mb-3">
            Playbooks, breakdowns, and real examples of how high-performing teams turn calls into revenue — automatically.
          </p>
          <p className="text-sm text-[#8892B0] light:text-gray-500 mb-6">
            Written for teams that don&apos;t let deals go cold.
          </p>
          <a
            href="/blog/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 light:text-gray-400 hover:text-amber-400 light:hover:text-amber-500 transition-colors"
          >
            <Rss className="w-4 h-4" />
            Subscribe via RSS
          </a>
        </div>
      </section>

      {/* Blog Grid with Tag Filtering */}
      <BlogGrid posts={blogPosts} />

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-[#0A1020] light:bg-white">
        <div className="max-w-3xl mx-auto">
          <BlogNewsletterSignup />
        </div>
      </section>

      <Footer />
    </div>
  );
}
