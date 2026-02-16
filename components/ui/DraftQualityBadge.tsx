'use client';

import { useState } from 'react';

interface DraftQualityBadgeProps {
  qualityScore: number | null;
  toneScore?: number | null;
  completenessScore?: number | null;
  personalizationScore?: number | null;
  accuracyScore?: number | null;
  gradingNotes?: string | null;
  showDetails?: boolean;
}

// Convert 0-100 score to 1-5 stars
function scoreToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

function getLabel(stars: number): string {
  if (stars === 5) return 'Ready to send';
  if (stars === 4) return 'Minor edits suggested';
  if (stars === 3) return 'Review recommended';
  if (stars === 2) return 'Needs work';
  return 'Regenerate suggested';
}

function getColor(stars: number): string {
  if (stars >= 4) return 'text-emerald-400';
  if (stars === 3) return 'text-amber-400';
  return 'text-red-400';
}

function getBgColor(stars: number): string {
  if (stars >= 4) return 'bg-emerald-500/10 border-emerald-500/20';
  if (stars === 3) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function DraftQualityBadge({
  qualityScore,
  toneScore,
  completenessScore,
  personalizationScore,
  accuracyScore,
  gradingNotes,
  showDetails = false,
}: DraftQualityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (qualityScore === null || qualityScore === undefined) {
    return null;
  }

  const stars = scoreToStars(qualityScore);
  const label = getLabel(stars);
  const color = getColor(stars);
  const bgColor = getBgColor(stars);

  const hasDetailedScores = toneScore !== null || completenessScore !== null ||
    personalizationScore !== null || accuracyScore !== null;

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColor} cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Quality</span>
        {/* Star rating */}
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${star <= stars ? 'text-yellow-400' : 'text-gray-600'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className={`text-sm font-bold ${color}`}>{qualityScore}/100</span>
        <span className={`text-sm font-medium ${color}`}>
          {label}
        </span>
      </div>

      {/* Tooltip with detailed scores */}
      {showTooltip && (hasDetailedScores || gradingNotes) && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              AI Quality Analysis
            </div>

            {/* Overall score */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Overall</span>
              <span className={`text-sm font-bold ${color}`}>{qualityScore}/100</span>
            </div>

            {/* Detailed scores */}
            {toneScore !== null && toneScore !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Tone</span>
                <span className="text-xs text-gray-300">{toneScore}/100</span>
              </div>
            )}
            {completenessScore !== null && completenessScore !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Completeness</span>
                <span className="text-xs text-gray-300">{completenessScore}/100</span>
              </div>
            )}
            {personalizationScore !== null && personalizationScore !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Personalization</span>
                <span className="text-xs text-gray-300">{personalizationScore}/100</span>
              </div>
            )}
            {accuracyScore !== null && accuracyScore !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Accuracy</span>
                <span className="text-xs text-gray-300">{accuracyScore}/100</span>
              </div>
            )}

            {/* Grading notes */}
            {gradingNotes && (
              <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed">{gradingNotes}</p>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-800" />
          </div>
        </div>
      )}

      {/* Expanded details view */}
      {showDetails && hasDetailedScores && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            {toneScore !== null && toneScore !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Tone</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${toneScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-8">{toneScore}</span>
                </div>
              </div>
            )}
            {completenessScore !== null && completenessScore !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Complete</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${completenessScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-8">{completenessScore}</span>
                </div>
              </div>
            )}
            {personalizationScore !== null && personalizationScore !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Personal</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${personalizationScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-8">{personalizationScore}</span>
                </div>
              </div>
            )}
            {accuracyScore !== null && accuracyScore !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Accuracy</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${accuracyScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-8">{accuracyScore}</span>
                </div>
              </div>
            )}
          </div>
          {gradingNotes && (
            <p className="mt-2 text-xs text-gray-400 italic">{gradingNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}
