'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Mail, Calendar, Users, ListChecks, MessageSquare, Check, Send } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

interface BentoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
  href?: string;
}

function BentoCard({ title, description, icon, className = '', children, delay = 0, href }: BentoCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`group relative rounded-2xl bg-gray-900/50 light:bg-white/80 border border-gray-700/60 light:border-gray-200 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#6366F1]/30 light:hover:border-[#6366F1]/30 light:shadow-md ${href ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#6366F1]/20 via-[#6366F1]/20 to-[#3A4BDD]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative p-5 h-full flex flex-col">
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#3A4BDD]/20 flex items-center justify-center mb-3 border border-gray-700/60 light:border-gray-200">
            {icon}
          </div>
        )}

        {children && (
          <div className="flex-1 mb-3 relative overflow-hidden rounded-xl">
            {children}
          </div>
        )}

        <h3 className="text-lg font-bold text-[#E8ECF4] light:text-gray-900 mb-1.5">{title}</h3>
        <p className="text-sm text-[#8892B0] light:text-gray-500 leading-relaxed">{description}</p>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#6366F1] to-[#3A4BDD] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

// Static data arrays hoisted to module scope
const DASHBOARD_ITEMS = [
  { name: 'Sarah Chen', type: 'sequence', detail: 'Step 2 of 3 — sending tomorrow', color: 'indigo' },
  { name: 'Mike Johnson', type: 'follow-up', detail: 'Follow-up draft ready', color: 'green' },
  { name: 'Emily Davis', type: 'risk', detail: 'Budget concern flagged', color: 'amber' },
  { name: 'Alex Kim', type: 'next-step', detail: 'Send proposal — due Thu', color: 'blue' },
  { name: 'Jordan Lee', type: 'sequence', detail: 'Step 3 of 3 — complete', color: 'green' },
  { name: 'Maria Garcia', type: 'follow-up', detail: 'Follow-up sent 2h ago', color: 'green' },
  { name: 'David Park', type: 'risk', detail: 'No response — 5 days', color: 'red' },
] as const;

const MEETING_LIST_ITEMS = [
  { platform: 'Zoom', color: '#2D8CFF', time: '10:00 AM', title: 'Q1 Pipeline Review', host: 'Sarah C.' },
  { platform: 'Teams', color: '#5B5FC7', time: '2:30 PM', title: 'Product Demo Call', host: 'Mike J.' },
  { platform: 'Meet', color: '#00897B', time: '4:00 PM', title: 'Client Onboarding', host: 'You' },
] as const;

const CRM_PLATFORMS = [
  { name: 'HubSpot', color: '#FF7A59' },
  { name: 'Salesforce', color: '#00A1E0' },
  { name: 'Sheets', color: '#34A853' },
] as const;

const CRM_SYNC_EVENTS = [
  { contact: 'Sarah C.', action: 'Summary + next steps synced', platform: 0 },
  { contact: 'Mike J.', action: 'Deal health updated', platform: 1 },
  { contact: 'Emily D.', action: 'Risk alert logged', platform: 2 },
  { contact: 'Alex K.', action: 'Sequence activity synced', platform: 0 },
] as const;

const SEQUENCE_STEPS = [
  { step: 1, label: 'Personalized follow-up', status: 'sent', delay: 'Same day' },
  { step: 2, label: 'Value-add check-in', status: 'scheduled', delay: '+3 days' },
  { step: 3, label: 'Decision nudge', status: 'pending', delay: '+7 days' },
] as const;

const NEXT_STEPS = [
  { task: 'Send revised proposal', contact: 'Sarah C.', due: 'Tomorrow', status: 'upcoming' },
  { task: 'Share case study deck', contact: 'Mike J.', due: 'Thu', status: 'upcoming' },
  { task: 'Schedule technical review', contact: 'Emily D.', due: 'Overdue', status: 'overdue' },
  { task: 'Follow up on budget approval', contact: 'Alex K.', due: 'Fri', status: 'upcoming' },
] as const;

const RISK_ALERTS = [
  { deal: 'Acme Corp', risk: 'Budget', detail: 'CFO pushing to next quarter', severity: 'high' },
  { deal: 'TechStart Inc', risk: 'Champion', detail: 'Main contact went silent', severity: 'critical' },
  { deal: 'GlobalCo', risk: 'Timeline', detail: 'Implementation deadline moved', severity: 'medium' },
] as const;

// Dashboard Preview — shows sequences, next steps, and risks at a glance
function DashboardPreview() {
  const colorMap: Record<string, string> = {
    indigo: 'bg-[#6366F1]',
    green: 'bg-green-400',
    amber: 'bg-amber-400',
    blue: 'bg-blue-400',
    red: 'bg-red-400',
  };

  const typeIcon: Record<string, string> = {
    sequence: '\u21BB',
    'follow-up': '\u2709',
    risk: '\u26A0',
    'next-step': '\u2610',
  };

  return (
    <div className="w-full h-full min-h-[320px] bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-4">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-[#6366F1] to-[#3A4BDD]" />
          <div className="h-3.5 w-28 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
        <div className="h-7 w-20 bg-[#6366F1]/20 rounded border border-[#6366F1]/30" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { value: 12, label: 'Active Sequences' },
          { value: 8, label: 'Next Steps' },
          { value: 3, label: 'Risk Alerts' },
          { value: 24, label: 'Meetings' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-gray-900/50 light:bg-white rounded-lg p-2.5 text-center border border-transparent light:border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-xl font-bold tabular-nums bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-[10px] text-[#8892B0] light:text-gray-500 leading-tight mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="space-y-2">
        {DASHBOARD_ITEMS.map((item, i) => (
          <motion.div
            key={item.name}
            className="flex items-center gap-2.5 p-2 bg-gray-900/30 light:bg-white rounded-lg border border-transparent light:border-gray-100"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#3A4BDD] flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
              {item.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#E8ECF4] light:text-gray-900 truncate">{item.name}</div>
              <div className="text-[11px] text-[#8892B0] light:text-gray-500 truncate">{item.detail}</div>
            </div>
            <span className="text-[11px] mr-1">{typeIcon[item.type]}</span>
            <div className={`w-2.5 h-2.5 rounded-full ${colorMap[item.color]}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Sequence Preview — shows multi-step follow-up sequence
function SequencePreview() {
  const statusStyles: Record<string, { dot: string; text: string }> = {
    sent: { dot: 'bg-green-400', text: 'text-green-400' },
    scheduled: { dot: 'bg-[#6366F1]', text: 'text-[#6366F1]' },
    pending: { dot: 'bg-gray-500', text: 'text-gray-500' },
  };

  return (
    <div className="w-full bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Send className="w-4 h-4 text-[#6366F1]" />
        <motion.span
          className="text-[12px] text-[#8892B0] light:text-gray-500 font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Sequence: Sarah Chen — Q4 Strategy
        </motion.span>
      </div>
      <div className="space-y-3">
        {SEQUENCE_STEPS.map((step, i) => {
          const styles = statusStyles[step.status];
          return (
            <motion.div
              key={step.step}
              className="flex items-center gap-3"
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.3, duration: 0.5 }}
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
                {i < SEQUENCE_STEPS.length - 1 && (
                  <div className="w-px h-4 bg-gray-600 light:bg-gray-300 mt-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[#E8ECF4] light:text-gray-900 truncate">
                  Step {step.step}: {step.label}
                </div>
              </div>
              <span className={`text-[11px] ${styles.text} font-medium`}>{step.delay}</span>
            </motion.div>
          );
        })}
      </div>
      {/* Progress indicator */}
      <motion.div
        className="mt-4 flex items-center gap-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex-1 h-1.5 bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-[#6366F1] rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: '33%' }}
            viewport={{ once: true }}
            transition={{ delay: 1.8, duration: 0.8 }}
          />
        </div>
        <span className="text-[11px] text-[#8892B0] light:text-gray-500">1/3 sent</span>
      </motion.div>
    </div>
  );
}

// Meeting List Preview — slides in once
function MeetingListPreview() {
  const PlatformIcon = ({ platform, color }: { platform: string; color: string }) => {
    if (platform === 'Zoom') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color} aria-hidden="true">
          <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
        </svg>
      );
    }
    if (platform === 'Teams') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color} aria-hidden="true">
          <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3z"/>
      </svg>
    );
  };

  return (
    <div className="w-full bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-3 space-y-2.5 overflow-hidden">
      {MEETING_LIST_ITEMS.map((meeting, i) => (
        <motion.div
          key={meeting.platform}
          className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-900/50 light:bg-white border border-transparent light:border-gray-100"
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.3, duration: 0.5 }}
          whileHover={{ x: 4, backgroundColor: 'rgba(17, 24, 39, 0.8)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meeting.color}20` }}
          >
            <PlatformIcon platform={meeting.platform} color={meeting.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[#E8ECF4] light:text-gray-900 truncate">
              {meeting.title}
            </div>
            <div className="text-[11px] text-[#8892B0] light:text-gray-500 truncate">
              Host: {meeting.host}
            </div>
          </div>
          <div
            className="text-[11px] font-medium px-2 py-1 rounded"
            style={{ backgroundColor: `${meeting.color}15`, color: meeting.color }}
          >
            {meeting.time}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// CRM Preview — entrance animations only, sync bar stays animated
function CRMPreview() {
  return (
    <div className="w-full bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-4 overflow-hidden">
      {/* Platform icons row */}
      <div className="flex items-center justify-center gap-4 mb-3 relative">
        {CRM_PLATFORMS.map((platform, i) => (
          <motion.div
            key={platform.name}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${platform.color}20` }}
            >
              <div
                className="w-4.5 h-4.5 rounded"
                style={{ backgroundColor: platform.color, width: 18, height: 18 }}
              />
            </div>
            <span className="text-[10px] text-[#8892B0] light:text-gray-500 font-medium">{platform.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Sync feed — slides in once */}
      <div className="space-y-2">
        {CRM_SYNC_EVENTS.map((event, i) => (
          <motion.div
            key={event.contact}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md bg-gray-900/40 light:bg-white border border-transparent light:border-gray-100"
            initial={{ x: 40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.2 }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: CRM_PLATFORMS[event.platform].color }}
            />
            <span className="text-[11px] text-[#E8ECF4] light:text-gray-900 font-medium truncate">{event.contact}</span>
            <span className="text-[10px] text-[#8892B0] light:text-gray-500 truncate flex-1 text-right">{event.action}</span>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.3, type: 'spring' }}
            >
              <Check className="w-3 h-3 text-[#6366F1] flex-shrink-0" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Sync status bar — keep as subtle infinite animation */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <motion.div
          className="w-2 h-2 rounded-full bg-[#6366F1]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[11px] text-[#6366F1] light:text-[#4F46E5] font-medium">Syncing&hellip;</span>
        <div className="w-16 h-1.5 bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6366F1] to-[#6366F1] rounded-full"
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// Next Steps Preview — shows tracked action items with due dates
function NextStepsPreview() {
  return (
    <div className="w-full bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-3 space-y-2 overflow-hidden">
      {NEXT_STEPS.map((step, i) => (
        <motion.div
          key={step.task}
          className="flex items-center gap-2.5 p-2 rounded-md bg-gray-900/40 light:bg-white border border-transparent light:border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.15 }}
        >
          <div className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 ${
            step.status === 'overdue'
              ? 'border-red-400 bg-red-400/20'
              : 'border-[#6366F1] bg-transparent'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-[#E8ECF4] light:text-gray-900 truncate">{step.task}</div>
            <div className="text-[10px] text-[#8892B0] light:text-gray-500 truncate">{step.contact}</div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
            step.status === 'overdue'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-[#6366F1]/20 text-[#6366F1]'
          }`}>
            {step.due}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Risk Alerts Preview — shows MEDDIC-based deal risk flags
function RiskAlertsPreview() {
  const severityStyles: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  };

  return (
    <div className="w-full bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/60 light:border-gray-200 p-3 space-y-2 overflow-hidden">
      {RISK_ALERTS.map((alert, i) => {
        const styles = severityStyles[alert.severity];
        return (
          <motion.div
            key={alert.deal}
            className={`flex items-start gap-2.5 p-2 rounded-md ${styles.bg} border ${styles.border}`}
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
          >
            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${styles.text}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#E8ECF4] light:text-gray-900 truncate">{alert.deal}</span>
                <span className={`text-[9px] font-bold ${styles.text} uppercase`}>{alert.risk}</span>
              </div>
              <div className="text-[10px] text-[#8892B0] light:text-gray-500 truncate">{alert.detail}</div>
            </div>
          </motion.div>
        );
      })}
      {/* Pulsing alert indicator */}
      <motion.div
        className="flex items-center justify-center gap-1.5 mt-1.5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] text-amber-400 font-medium">3 risks need attention</span>
      </motion.div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section id="features" className="py-16 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900">
            The <GradientText>Follow-Up Layer</GradientText> Your Sales Stack Is Missing
          </h2>
          <p className="text-[#8892B0] light:text-gray-500 max-w-2xl mx-auto">
            Follow-ups, sequences, next-step tracking, deal risk alerts, and CRM sync — all from the transcript
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <BentoCard
            title="Every Deal at a Glance"
            description="Sequences, next steps, risk alerts, and follow-ups — one view for your entire pipeline"
            className="lg:col-span-2 lg:row-span-2"
            delay={0}
            href="/product/follow-ups"
          >
            <DashboardPreview />
          </BentoCard>

          <BentoCard
            title="Multi-Step Sequences"
            description="Context-aware follow-up sequences that keep deals warm automatically"
            icon={<Send className="w-6 h-6 text-[#6366F1]" />}
            delay={0.1}
            href="/product/sequences"
          >
            <SequencePreview />
          </BentoCard>

          <BentoCard
            title="Zoom, Teams, and Meet"
            description="Every call captured automatically — no bot, no extra app"
            icon={<Calendar className="w-6 h-6 text-[#6366F1]" />}
            delay={0.2}
            href="/product/meeting-intelligence"
          >
            <MeetingListPreview />
          </BentoCard>

          <BentoCard
            title="CRM Updates Itself"
            description="Summaries, next steps, deal health, and sequence activity synced to your CRM"
            icon={<Users className="w-6 h-6 text-[#6366F1]" />}
            delay={0.3}
            href="/product/pipeline-automation"
          >
            <CRMPreview />
          </BentoCard>

          <BentoCard
            title="Next Steps Tracked"
            description="Action items extracted from every call with due dates and overdue reminders"
            icon={<ListChecks className="w-6 h-6 text-[#6366F1]" />}
            delay={0.4}
            href="/product/pipeline-automation"
          >
            <NextStepsPreview />
          </BentoCard>

          <BentoCard
            title="Deal Risk Alerts"
            description="Budget, timeline, and champion risks flagged before they cost you the deal"
            icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
            delay={0.5}
            href="/product/pipeline-automation"
          >
            <RiskAlertsPreview />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
