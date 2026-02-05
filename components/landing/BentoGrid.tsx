'use client';

import { motion } from 'framer-motion';
import { BarChart3, Mail, Calendar, Users, Zap, Settings } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

interface BentoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

function BentoCard({ title, description, icon, className = '', children, delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative rounded-2xl bg-gray-900/50 border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600 ${className}`}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-gray-700">
            {icon}
          </div>
        )}

        {children && (
          <div className="flex-1 mb-4 relative overflow-hidden rounded-xl">
            {children}
          </div>
        )}

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
    </motion.div>
  );
}

// Simulated Dashboard Preview
function DashboardPreview() {
  return (
    <div className="w-full h-48 bg-gray-800/50 rounded-lg border border-gray-700 p-3 overflow-hidden">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500" />
          <div className="h-3 w-20 bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-16 bg-blue-500/20 rounded border border-blue-500/30" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { value: '24', label: 'Meetings', color: 'blue' },
          { value: '18', label: 'Drafts', color: 'purple' },
          { value: '12', label: 'Sent', color: 'green' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="bg-gray-900/50 rounded-lg p-2 text-center"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          >
            <div className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* List items */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-gray-900/30 rounded-lg">
            <div className="w-8 h-8 rounded bg-gray-700" />
            <div className="flex-1">
              <div className="h-2 w-3/4 bg-gray-700 rounded mb-1" />
              <div className="h-2 w-1/2 bg-gray-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simulated Draft Editor Preview
function DraftEditorPreview() {
  return (
    <div className="w-full h-32 bg-gray-800/50 rounded-lg border border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-blue-400" />
        <div className="h-2 w-24 bg-gray-700 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-gray-700/60 rounded" />
        <div className="h-2 w-5/6 bg-gray-700/60 rounded" />
        <div className="h-2 w-4/6 bg-gray-700/60 rounded" />
      </div>
      <motion.div
        className="mt-3 h-2 w-1/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
        animate={{ width: ['25%', '40%', '25%'] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// Simulated Meeting List Preview
function MeetingListPreview() {
  return (
    <div className="w-full h-32 bg-gray-800/50 rounded-lg border border-gray-700 p-2 space-y-2">
      {[
        { platform: 'Zoom', color: '#2D8CFF', time: '10:00 AM' },
        { platform: 'Teams', color: '#5B5FC7', time: '2:30 PM' },
        { platform: 'Meet', color: '#00897B', time: '4:00 PM' },
      ].map((meeting, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-900/50"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${meeting.color}20` }}
          >
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: meeting.color }} />
          </div>
          <div className="flex-1">
            <div className="h-2 w-2/3 bg-gray-700 rounded" />
          </div>
          <div className="text-[10px] text-gray-500">{meeting.time}</div>
        </motion.div>
      ))}
    </div>
  );
}

// Animated Chart
function ChartPreview() {
  const bars = [40, 65, 45, 80, 55, 70, 60];

  return (
    <div className="w-full h-20 flex items-end justify-between gap-1 px-2">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export function BentoGrid() {
  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your <GradientText>Follow-up Command Center</GradientText>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to automate your post-meeting workflow
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large card - Dashboard */}
          <BentoCard
            title="Dashboard Overview"
            description="See all meetings, drafts, and sent emails in one place"
            className="lg:col-span-2 lg:row-span-2"
            delay={0}
          >
            <DashboardPreview />
          </BentoCard>

          {/* Draft Editor */}
          <BentoCard
            title="AI-Generated Drafts"
            description="Edit before sending or trust the AI"
            icon={<Zap className="w-6 h-6 text-purple-400" />}
            delay={0.1}
          >
            <DraftEditorPreview />
          </BentoCard>

          {/* Meeting List */}
          <BentoCard
            title="Every Meeting Captured"
            description="Automatic transcript download from Zoom, Teams, Meet"
            icon={<Calendar className="w-6 h-6 text-blue-400" />}
            delay={0.2}
          >
            <MeetingListPreview />
          </BentoCard>

          {/* CRM Sync */}
          <BentoCard
            title="Auto-logged to CRM"
            description="Airtable, HubSpot, Salesforce integrations coming soon"
            icon={<Users className="w-6 h-6 text-emerald-400" />}
            delay={0.3}
          />

          {/* Analytics */}
          <BentoCard
            title="Track Performance"
            description="Response rates, meeting stats, and insights"
            icon={<BarChart3 className="w-6 h-6 text-pink-400" />}
            delay={0.4}
          >
            <ChartPreview />
          </BentoCard>

          {/* Settings */}
          <BentoCard
            title="Customize Your Style"
            description="Set your tone, templates, and preferences"
            icon={<Settings className="w-6 h-6 text-orange-400" />}
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
}
