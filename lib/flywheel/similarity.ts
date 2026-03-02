/**
 * Calculate how different a user's edited draft is from the AI original.
 * Returns 0-100 where 100 = identical, 0 = completely different.
 *
 * Uses word-level Jaccard similarity for speed and simplicity.
 * No external dependencies needed.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function calculateEditDiffScore(original: string, edited: string): number {
  const originalTokens = new Set(tokenize(original));
  const editedTokens = new Set(tokenize(edited));

  if (originalTokens.size === 0 && editedTokens.size === 0) return 100;
  if (originalTokens.size === 0 || editedTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of originalTokens) {
    if (editedTokens.has(token)) intersection++;
  }

  const union = new Set([...originalTokens, ...editedTokens]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Extract what the user changed between original and edited drafts.
 * Returns a human-readable summary of the changes.
 */
export function describeEdits(original: string, edited: string): string {
  const origLines = original.split('\n').filter(Boolean);
  const editLines = edited.split('\n').filter(Boolean);

  const added = editLines.filter(l => !origLines.includes(l));
  const removed = origLines.filter(l => !editLines.includes(l));

  const parts: string[] = [];
  if (added.length > 0) parts.push(`Added ${added.length} lines`);
  if (removed.length > 0) parts.push(`Removed ${removed.length} lines`);
  if (edited.length > original.length * 1.2) parts.push('Made email longer');
  if (edited.length < original.length * 0.8) parts.push('Made email shorter');

  return parts.length > 0 ? parts.join('. ') : 'Minor edits';
}
