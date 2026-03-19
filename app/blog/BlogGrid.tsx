'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { BlogPost } from '@/lib/blog-data';

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Category color based on tag content */
function getCategoryColor(tag: string): string {
  if (tag.includes('AI') || tag.includes('automation') || tag.includes('transcript')) return '#06B6D4';
  if (tag.includes('template') || tag.includes('playbook')) return '#F59E0B';
  if (tag.includes('sales') || tag.includes('pipeline') || tag.includes('close')) return '#6366F1';
  return '#6366F1';
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

  // Split into featured (first 3) and rest
  const featured = selectedTag === null ? filteredPosts.slice(0, 3) : [];
  const gridPosts = selectedTag === null ? filteredPosts.slice(3) : filteredPosts;

  return (
    <section className="pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Credibility line */}
        <p className="text-center text-sm text-[#8892B0] light:text-gray-500 mb-8">
          Built by a founder who has been on 1,000+ sales calls.
        </p>

        {/* Tag Filter */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white ${
              selectedTag === null
                ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/25'
                : 'bg-[#0F172A] light:bg-gray-100 text-gray-400 light:text-gray-600 border border-[#1E2A4A] light:border-gray-200 hover:border-[#F59E0B]/30 hover:text-gray-200 light:hover:text-gray-900'
            }`}
          >
            All
          </button>
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white ${
                selectedTag === tag
                  ? 'bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/25'
                  : 'bg-[#0F172A] light:bg-gray-100 text-gray-400 light:text-gray-600 border border-[#1E2A4A] light:border-gray-200 hover:border-[#F59E0B]/30 hover:text-gray-200 light:hover:text-gray-900'
              }`}
            >
              {tag}
            </button>
          ))}
          {!showAllTags && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags(true)}
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#0F172A] light:bg-gray-100 text-[#6366F1] light:text-[#4F46E5] border border-[#1E2A4A] light:border-gray-200 hover:border-[#6366F1]/30 transition-all duration-200"
            >
              +{hiddenCount} more
            </button>
          )}
          {showAllTags && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags(false)}
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#0F172A] light:bg-gray-100 text-[#6366F1] light:text-[#4F46E5] border border-[#1E2A4A] light:border-gray-200 hover:border-[#6366F1]/30 transition-all duration-200"
            >
              Show less
            </button>
          )}
        </div>

        {/* Featured Section — only when no tag filter active */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">
            {/* Primary featured article — spans 3 cols */}
            <Link
              href={`/blog/${featured[0].slug}`}
              className="lg:col-span-3 group block"
            >
              <article className="h-full rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 light:hover:border-[#6366F1]/30 flex flex-col">
                {/* Gradient header with category band */}
                <div className="h-48 bg-gradient-to-br from-[#6366F1]/20 via-[#4F46E5]/10 to-[#06B6D4]/10 relative flex items-end p-6">
                  <div className="absolute top-4 left-4">
                    {featured[0].tags.slice(0, 1).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ color: getCategoryColor(tag), backgroundColor: `${getCategoryColor(tag)}15`, border: `1px solid ${getCategoryColor(tag)}30` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 group-hover:text-[#6366F1] light:group-hover:text-[#4F46E5] transition-colors leading-tight line-clamp-3">
                    {featured[0].title}
                  </h2>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-base text-[#C0C8E0] light:text-gray-600 leading-relaxed mb-6 line-clamp-3 flex-1">
                    {featured[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#8892B0] light:text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(featured[0].date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {featured[0].readingTime} min
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#F59E0B] flex items-center gap-1.5 group-hover:gap-2.5 transition-[gap]">
                      Read
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>

            {/* Secondary featured — 2 stacked in 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {featured.slice(1, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block flex-1"
                >
                  <article className="h-full rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-white/20 light:hover:border-[#6366F1]/30 flex flex-col">
                    {/* Category accent bar */}
                    <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${getCategoryColor(post.tags[0])}40, transparent)` }} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 1).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ color: getCategoryColor(tag), backgroundColor: `${getCategoryColor(tag)}10` }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2 group-hover:text-[#6366F1] light:group-hover:text-[#4F46E5] transition-colors line-clamp-2 flex-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-[#8892B0] light:text-gray-500">
                        <span>{formatDate(post.date)}</span>
                        <span>{post.readingTime} min read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Bridge — after featured, before grid */}
        {selectedTag === null && gridPosts.length > 0 && (
          <div className="mb-16 rounded-2xl bg-[#0F172A] light:bg-white border border-[#F59E0B]/20 light:border-gray-200 p-8 md:p-10 text-center">
            <p className="text-lg font-bold text-white light:text-gray-900 mb-2">
              Still writing follow-ups manually?
            </p>
            <p className="text-sm text-[#C0C8E0] light:text-gray-600 max-w-lg mx-auto mb-6">
              ReplySequence turns every call into a ready-to-send follow-up, sequence, and CRM update in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
              >
                Try the Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#waitlist"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#C0C8E0] light:text-gray-700 border border-[#1E2A4A] light:border-gray-300 hover:border-[#06B6D4]/40 hover:text-white light:hover:text-gray-900 transition-all duration-200"
              >
                Join the Waitlist
              </Link>
            </div>
          </div>
        )}

        {/* Standard Posts Grid */}
        {gridPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="h-full rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-white/20 light:hover:border-[#6366F1]/30 flex flex-col">
                  {/* Category accent bar */}
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${getCategoryColor(post.tags[0])}40, transparent)` }} />

                  {post.heroImage ? (
                    <div className="relative w-full aspect-[16/9]">
                      <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : null}

                  <div className="p-5 flex flex-col flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ color: getCategoryColor(tag), backgroundColor: `${getCategoryColor(tag)}10` }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2 group-hover:text-[#6366F1] light:group-hover:text-[#4F46E5] transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-[#8892B0] light:text-gray-600 leading-relaxed mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Meta + Read */}
                    <div className="flex items-center justify-between text-xs text-[#8892B0] light:text-gray-500 pt-3 border-t border-[#1E2A4A]/50 light:border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} min
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1 group-hover:gap-2 transition-[gap]">
                        Read
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

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
