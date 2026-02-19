'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/blog-data';

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags.includes(selectedTag))
    : posts;

  return (
    <section className="pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
              selectedTag === null
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-gray-800/50 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700/50 light:hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-800/50 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700/50 light:hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <article className="h-full rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6 transition-all duration-300 hover:border-indigo-500/50 light:hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/5 light:hover:shadow-indigo-400/10">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 light:bg-indigo-100 text-indigo-400 light:text-indigo-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white light:text-gray-900 mb-3 group-hover:text-indigo-400 light:group-hover:text-indigo-600 transition-colors line-clamp-2">
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
                  <span className="text-sm font-medium text-indigo-400 light:text-indigo-600 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    Read article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 light:text-gray-600 text-lg">
              No articles found for this tag.
            </p>
            <button
              onClick={() => setSelectedTag(null)}
              className="mt-4 text-indigo-400 light:text-indigo-600 hover:underline"
            >
              View all articles
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
