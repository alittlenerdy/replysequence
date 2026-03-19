'use client';

import { TrendingUp, RefreshCw, BarChart3, FileText, Activity } from 'lucide-react';
import { ProductPageTemplate } from '@/components/product/ProductPageTemplate';
import { PipelineAutomationDemo } from '@/components/product/PipelineAutomationDemo';

const features = [
  { icon: RefreshCw, title: 'Auto CRM Sync', description: 'Deal stages, contact info, and key details update in your CRM seconds after every call ends.' },
  { icon: BarChart3, title: 'Deal Health Scoring', description: 'Real-time health scores calculated from engagement signals, sentiment, and buyer behavior across calls.' },
  { icon: FileText, title: 'Pre-Meeting Briefings', description: 'Get a concise brief before every call with budget status, decision makers, objections, and next steps.' },
  { icon: Activity, title: 'Activity Tracking', description: 'Track email opens, proposal views, and LinkedIn visits so you know exactly where each deal stands.' },
];

const useCases = [
  { title: 'Pipeline Hygiene', audience: 'For sales ops', description: 'Eliminate stale data and manual entry. Every field stays current because every call feeds the CRM automatically.' },
  { title: 'Forecast Accuracy', audience: 'For VPs of Sales', description: 'Deal health scores and activity signals give you a real-time view of pipeline risk, not just rep opinions.' },
  { title: 'Rep Enablement', audience: 'For sales managers', description: 'Pre-meeting briefings mean reps walk into every call prepared, without spending 20 minutes reviewing notes.' },
];

export function PipelineAutomationContent() {
  return (
    <ProductPageTemplate
      accent="#F59E0B"
      icon={TrendingUp}
      title="Your Pipeline Updates Itself."
      subtitle="CRM updates, deal health scores, and pre-meeting briefings — generated from every call, automatically."
      bullets={['Automatic CRM field updates', 'Real-time deal health scoring', 'Pre-meeting intelligence briefings']}
      demo={<PipelineAutomationDemo />}
      features={features}
      useCases={useCases}
    />
  );
}
