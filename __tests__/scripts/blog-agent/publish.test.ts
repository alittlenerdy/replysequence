// __tests__/scripts/blog-agent/publish.test.ts
import { describe, it, expect } from 'vitest';
import { formatBlogPostEntry, getExistingSlugs } from '@/scripts/blog-agent/publish';
import type { BlogDraft } from '@/scripts/blog-agent/types';

describe('publish', () => {
  describe('formatBlogPostEntry', () => {
    it('formats a BlogDraft as a TypeScript object literal', () => {
      const draft: BlogDraft = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        excerpt: 'A test excerpt.',
        content: 'Some **markdown** content.\n\nWith paragraphs.',
        date: '2026-03-10',
        author: 'Jimmy Daly',
        tags: ['sales', 'testing'],
        readingTime: 3,
      };

      const formatted = formatBlogPostEntry(draft);
      expect(formatted).toContain("title: 'Test Post Title'");
      expect(formatted).toContain("slug: 'test-post-title'");
      expect(formatted).toContain("date: '2026-03-10'");
      expect(formatted).toContain("author: 'Jimmy Daly'");
      expect(formatted).toContain("tags: ['sales', 'testing']");
      expect(formatted).toContain('readingTime: 3');
      expect(formatted).toContain('excerpt:');
      expect(formatted).toContain('content: `');
    });
  });

  describe('getExistingSlugs', () => {
    it('extracts slugs from blog-data.ts content', () => {
      const fileContent = `
export const blogPosts: BlogPost[] = [
  {
    title: 'First Post',
    slug: 'first-post',
    excerpt: 'test',
    content: 'test',
    date: '2026-01-01',
    author: 'Jimmy Daly',
    tags: ['test'],
    readingTime: 3,
  },
  {
    title: 'Second Post',
    slug: 'second-post',
    excerpt: 'test',
    content: 'test',
    date: '2026-01-02',
    author: 'Jimmy Daly',
    tags: ['test'],
    readingTime: 4,
  },
];`;
      const slugs = getExistingSlugs(fileContent);
      expect(slugs).toContain('first-post');
      expect(slugs).toContain('second-post');
      expect(slugs).toHaveLength(2);
    });
  });
});
