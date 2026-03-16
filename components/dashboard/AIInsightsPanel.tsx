'use client';

import { motion } from 'framer-motion';
import { Brain, User, Calendar, AlertCircle, Target, ArrowUpRight } from 'lucide-react';

type FollowUpPriority = 'high' | 'medium' | 'low';

interface MeetingInsights {
  meetingName?: string;
  summary?: string;
  nextSteps?: string[];
  decisionMaker?: { name: string; title: string };
  timeline?: string;
  painPoints?: string[];
  objections?: string[];
  followUpPriority?: FollowUpPriority;
}

interface AIInsightsPanelProps {
  insights?: MeetingInsights;
}

const priorityConfig: Record<FollowUpPriority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#FF5D5D', bg: 'rgba(255, 93, 93, 0.10)' },
  medium: { label: 'Medium', color: '#FFD75F', bg: 'rgba(255, 215, 95, 0.10)' },
  low: { label: 'Low', color: '#4DFFA3', bg: 'rgba(77, 255, 163, 0.10)' },
};

const defaultInsights: MeetingInsights = {
  meetingName: 'Acme Corp - Sales Discovery Call',
  summary:
    'Sarah Chen (VP of Sales) expressed strong interest in automating their post-meeting follow-up process. Currently spending 45 min per meeting on manual recap emails. Team of 12 SDRs, each handling 8-10 calls/day. Budget approved for Q2, evaluating 3 vendors.',
  nextSteps: [
    'Send product comparison doc by Friday',
    'Schedule demo with SDR team lead (Mike)',
    'Prepare ROI calculator with their meeting volume',
  ],
  decisionMaker: { name: 'Sarah Chen', title: 'VP of Sales' },
  timeline: 'Q2 2026 purchase decision, pilot starting April',
  painPoints: ['Manual follow-ups', 'Inconsistent messaging', 'Lost action items', 'CRM data gaps'],
  objections: ['Existing tool overlap', 'Data privacy concerns', 'Onboarding timeline'],
  followUpPriority: 'high',
};

export function AIInsightsPanel({ insights = defaultInsights }: AIInsightsPanelProps) {
  const priority = insights.followUpPriority
    ? priorityConfig[insights.followUpPriority]
    : null;

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#7A5CFF]/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#7A5CFF]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900">AI Insights</h3>
            <p className="text-[11px] text-gray-500 light:text-gray-400 truncate max-w-[180px]">
              {insights.meetingName}
            </p>
          </div>
        </div>
        {priority && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ backgroundColor: priority.bg, color: priority.color }}
          >
            <Target className="w-3 h-3" />
            {priority.label} priority
          </span>
        )}
      </div>

      {/* Summary */}
      {insights.summary && (
        <div className="mb-3">
          <p className="text-xs text-gray-300 light:text-gray-600 leading-relaxed">
            {insights.summary}
          </p>
        </div>
      )}

      <div className="border-t border-gray-800/50 light:border-gray-100 pt-3 space-y-3">
        {/* Decision Maker + Timeline */}
        <div className="grid grid-cols-2 gap-3">
          {insights.decisionMaker && (
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-[#5B6CFF] mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium mb-0.5">
                  Decision Maker
                </p>
                <p className="text-xs text-white light:text-gray-900 font-medium">
                  {insights.decisionMaker.name}
                </p>
                <p className="text-[11px] text-gray-500 light:text-gray-400">
                  {insights.decisionMaker.title}
                </p>
              </div>
            </div>
          )}
          {insights.timeline && (
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#38E8FF] mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium mb-0.5">
                  Timeline
                </p>
                <p className="text-xs text-white light:text-gray-900">
                  {insights.timeline}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {insights.nextSteps && insights.nextSteps.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium mb-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Next Steps
            </p>
            <ul className="space-y-1">
              {insights.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300 light:text-gray-600">
                  <span className="text-[#4DFFA3] mt-0.5 shrink-0">-</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pain Points */}
        {insights.painPoints && insights.painPoints.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium mb-1.5">
              Pain Points
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.painPoints.map((point, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF5D5D]/10 text-[#FF8585] border border-[#FF5D5D]/15"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Objections */}
        {insights.objections && insights.objections.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Objections
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.objections.map((obj, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFD75F]/10 text-[#FFD75F] border border-[#FFD75F]/15"
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
