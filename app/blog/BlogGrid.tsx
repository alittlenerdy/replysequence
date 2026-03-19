'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/blog-data';

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Map the first tag to a gradient for the placeholder image area. */
function getGradient(tags: string[]): string {
  const tag = (tags[0] ?? '').toLowerCase();
  if (tag.includes('sales'))
    return 'bg-gradient-to-br from-indigo-500/30 via-indigo-600/20 to-indigo-900/10';
  if (tag.includes('ai') || tag.includes('automation'))
    return 'bg-gradient-to-br from-violet-500/30 via-purple-600/25 to-purple-900/15';
  if (tag.includes('email') || tag.includes('follow'))
    return 'bg-gradient-to-br from-amber-500/30 via-orange-600/25 to-orange-900/15';
  if (tag.includes('crm') || tag.includes('integration'))
    return 'bg-gradient-to-br from-emerald-500/30 via-teal-600/25 to-teal-900/15';
  if (tag.includes('productivity') || tag.includes('workflow'))
    return 'bg-gradient-to-br from-sky-500/30 via-cyan-600/25 to-cyan-900/15';
  if (tag.includes('meeting') || tag.includes('call'))
    return 'bg-gradient-to-br from-rose-500/30 via-pink-600/25 to-pink-900/15';
  return 'bg-gradient-to-br from-indigo-500/30 via-indigo-600/20 to-indigo-900/10';
}

const VISIBLE_TAGS = 6;

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [posts]);

  const visibleTags = showAllTags ? allTags : allTags.slice(0, VISIBLE_TAGS);
  const hiddenCount = allTags.length - VISIBLE_TAGS;

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
            className={`text-sm font-medium px-4 py-2 rounded-full transition-[color,background-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white ${
              selectedTag === null
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-800/50 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700/50 light:hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-[color,background-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white ${
                selectedTag === tag
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gray-800/50 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700/50 light:hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
          {!showAllTags && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags(true)}
              className="text-sm font-medium px-4 py-2 rounded-full bg-gray-800/50 light:bg-gray-100 text-[#6366F1] light:text-[#4F46E5] hover:bg-gray-700/50 light:hover:bg-gray-200 transition-[color,background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
            >
              +{hiddenCount} more
            </button>
          )}
          {showAllTags && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags(false)}
              className="text-sm font-medium px-4 py-2 rounded-full bg-gray-800/50 light:bg-gray-100 text-[#6366F1] light:text-[#4F46E5] hover:bg-gray-700/50 light:hover:bg-gray-200 transition-[color,background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
            >
              Show less
            </button>
          )}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => {
            const isFeatured = index === 0 && selectedTag === null;

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`group block ${isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                <article
                  className={`h-full rounded-2xl border border-gray-800/60 light:border-gray-200 bg-gray-900/50 light:bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#6366F1]/30 light:hover:border-[#6366F1]/30 hover:shadow-[#6366F1]/5 light:hover:shadow-[#6366F1]/10 ${isFeatured ? 'md:flex md:flex-row' : 'flex flex-col'}`}
                >
                  {/* Hero Image or Gradient Placeholder */}
                  {post.heroImage ? (
                    <div
                      className={`relative w-full shrink-0 ${isFeatured ? 'md:w-1/2 aspect-[16/9] md:aspect-auto' : 'aspect-[16/9]'}`}
                    >
                      <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes={
                          isFeatured
                            ? '(max-width: 768px) 100vw, 50vw'
                            : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                        }
                      />
                    </div>
                  ) : (
                    <div
                      className={`shrink-0 ${getGradient(post.tags)} ${isFeatured ? 'md:w-1/2 h-48 md:h-auto md:max-h-48 md:min-h-[12rem]' : 'h-32'}`}
                    />
                  )}

                  <div
                    className={`p-6 flex flex-col flex-1 ${isFeatured ? 'md:p-8' : ''}`}
                  >
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#6366F1]/10 light:bg-indigo-50 text-[#6366F1] light:text-[#4F46E5]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2
                      className={`font-bold text-white light:text-gray-900 mb-3 group-hover:text-[#6366F1] light:group-hover:text-[#4F46E5] transition-colors ${isFeatured ? 'text-2xl md:text-3xl line-clamp-3' : 'text-xl line-clamp-2'}`}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p
                      className={`text-gray-400 light:text-gray-600 leading-relaxed mb-6 ${isFeatured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'}`}
                    >
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
                      <span className="text-sm font-medium text-[#6366F1] light:text-[#4F46E5] flex items-center gap-1.5 group-hover:gap-2.5 transition-[gap]">
                        Read article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 light:text-gray-600 text-lg">
              No articles found for this tag.
            </p>
            <button
              onClick={() => setSelectedTag(null)}
              className="mt-4 text-[#6366F1] light:text-[#4F46E5] hover:underline rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
            >
              View all articles
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
