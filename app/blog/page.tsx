import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { blogPosts } from '@/lib/blog-data';
import type { Metadata } from 'next';
import { BlogGrid } from './BlogGrid';

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
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ReplySequence
            </span>{' '}
            Blog
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            Practical advice on meeting follow-ups, sales productivity, and using AI to spend less time on email and more time closing deals.
          </p>
        </div>
      </section>

      {/* Blog Grid with Tag Filtering */}
      <BlogGrid posts={blogPosts} />

      <Footer />
    </div>
  );
}
