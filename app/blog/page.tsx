import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { blogPosts } from '@/lib/blog-data';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

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

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

      {/* Blog Grid */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="h-full rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6 transition-all duration-300 hover:border-purple-500/50 light:hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/5 light:hover:shadow-purple-400/10">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 light:bg-purple-100 text-purple-400 light:text-purple-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white light:text-gray-900 mb-3 group-hover:text-purple-400 light:group-hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-400 light:text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="mt-auto flex items-center justify-between text-sm text-gray-500 light:text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(post.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime} min read
                      </span>
                    </div>
                  </div>

                  {/* Read More */}
                  <div className="mt-4 pt-4 border-t border-gray-800/50 light:border-gray-100">
                    <span className="text-sm font-medium text-purple-400 light:text-purple-600 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read article
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
