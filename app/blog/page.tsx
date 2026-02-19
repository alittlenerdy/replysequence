import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { blogPosts } from '@/lib/blog-data';
import type { Metadata } from 'next';
import { BlogGrid } from './BlogGrid';
import { Rss } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white light:text-gray-900 mb-6">
            The{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              ReplySequence
            </span>{' '}
            Blog
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-6">
            Practical advice on meeting follow-ups, sales productivity, and using AI to spend less time on email and more time closing deals.
          </p>
          <a
            href="/blog/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 light:text-gray-400 hover:text-orange-400 light:hover:text-orange-500 transition-colors"
          >
            <Rss className="w-4 h-4" />
            Subscribe via RSS
          </a>
        </div>
      </section>

      {/* Blog Grid with Tag Filtering */}
      <BlogGrid posts={blogPosts} />

      <Footer />
    </div>
  );
}
