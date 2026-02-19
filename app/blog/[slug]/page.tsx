import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { blogPosts, getBlogPost, getAllBlogSlugs } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { ShareButtons } from './ShareButtons';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | ReplySequence`,
      description: post.excerpt,
      url: `https://www.replysequence.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | ReplySequence`,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://www.replysequence.com/blog/${post.slug}`,
    },
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Converts a markdown string to HTML. Supports headings, bold, italic,
 * links, unordered/ordered lists, and paragraphs.
 */
function markdownToHtml(markdown: string): string {
  const lines = markdown.trim().split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close list if current line is not a list item
    const isUnorderedItem = /^[-*]\s+/.test(line);
    const isOrderedItem = /^\d+\.\s+/.test(line);
    if (inList && !isUnorderedItem && !isOrderedItem) {
      htmlLines.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
      listType = null;
    }

    // Headings
    if (line.startsWith('## ')) {
      htmlLines.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      htmlLines.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }

    // Unordered list items
    if (isUnorderedItem) {
      if (!inList || listType !== 'ul') {
        if (inList) htmlLines.push(listType === 'ol' ? '</ol>' : '</ul>');
        htmlLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      htmlLines.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Ordered list items
    if (isOrderedItem) {
      if (!inList || listType !== 'ol') {
        if (inList) htmlLines.push(listType === 'ol' ? '</ol>' : '</ul>');
        htmlLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      htmlLines.push(`<li>${inlineFormat(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    htmlLines.push(`<p>${inlineFormat(line)}</p>`);
  }

  // Close any open list
  if (inList) {
    htmlLines.push(listType === 'ol' ? '</ol>' : '</ul>');
  }

  return htmlLines.join('\n');
}

function inlineFormat(text: string): string {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (but not inside bold)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-purple-400 light:text-purple-600 underline hover:text-purple-300 light:hover:text-purple-500">$1</a>'
  );
  // Inline code: `code`
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-800 light:bg-gray-100 px-1.5 py-0.5 rounded text-sm">$1</code>'
  );
  // Em dash
  text = text.replace(/--/g, '\u2014');
  return text;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const contentHtml = markdownToHtml(post.content);

  // JSON-LD structured data for the article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ReplySequence',
      url: 'https://www.replysequence.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.replysequence.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  // Find related posts (other posts excluding current)
  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Article */}
      <article className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 light:text-gray-500 hover:text-purple-400 light:hover:text-purple-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 light:bg-purple-100 text-purple-400 light:text-purple-700"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white light:text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 light:text-gray-500 mb-10 pb-10 border-b border-gray-800 light:border-gray-200">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTime} min read
            </span>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center justify-between mb-10">
            <ShareButtons
              title={post.title}
              url={`https://www.replysequence.com/blog/${post.slug}`}
            />
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              text-gray-300 light:text-gray-700
              [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:light:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:light:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2
              [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2
              [&_li]:text-gray-300 [&_li]:light:text-gray-700
              [&_strong]:text-white [&_strong]:light:text-gray-900 [&_strong]:font-semibold
              [&_em]:italic
              [&_a]:text-purple-400 [&_a]:light:text-purple-600 [&_a]:underline [&_a]:hover:text-purple-300 [&_a]:light:hover:text-purple-500
              [&_code]:bg-gray-800 [&_code]:light:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 mb-4">
              Ready to automate your meeting follow-ups?
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-6 max-w-xl mx-auto">
              ReplySequence turns your Zoom, Teams, and Meet calls into polished follow-up emails in seconds. Start free, no credit card required.
            </p>
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white light:text-gray-900 mb-6">
              More from the blog
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group block rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6 transition-all duration-300 hover:border-purple-500/50 light:hover:border-purple-400/50"
                >
                  <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2 group-hover:text-purple-400 light:group-hover:text-purple-600 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-400 light:text-gray-600 line-clamp-2">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
