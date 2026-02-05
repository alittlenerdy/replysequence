'use client';

import { motion } from 'framer-motion';
import { BarChart3, Mail, Calendar, Users, Zap, Settings, ArrowRight, Check } from 'lucide-react';
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
      className={`group relative rounded-2xl bg-gray-900/50 light:bg-white/80 border border-gray-700 light:border-gray-200 overflow-hidden transition-all duration-300 hover:border-gray-600 light:hover:border-gray-300 light:shadow-lg ${className}`}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-gray-700 light:border-gray-200">
            {icon}
          </div>
        )}

        {children && (
          <div className="flex-1 mb-4 relative overflow-hidden rounded-xl">
            {children}
          </div>
        )}

        <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 light:text-gray-600">{description}</p>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
    </motion.div>
  );
}

// Animated Number Counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      className="font-bold tabular-nums bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {value}{suffix}
    </motion.span>
  );
}

// Simulated Dashboard Preview with animated stats and email list
function DashboardPreview() {
  const emails = [
    { name: 'Sarah Chen', subject: 'Re: Q4 Strategy Call', status: 'sent' },
    { name: 'Mike Johnson', subject: 'Follow-up: Product Demo', status: 'draft' },
    { name: 'Emily Davis', subject: 'Partnership Discussion', status: 'pending' },
  ];

  return (
    <div className="w-full h-48 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3 overflow-hidden">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="h-3 w-20 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
        <motion.div
          className="h-6 w-16 bg-blue-500/20 rounded border border-blue-500/30"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Stats row with gradient animated counters */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { value: 24, label: 'Meetings' },
          { value: 18, label: 'Drafts' },
          { value: 12, label: 'Sent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-gray-900/50 light:bg-gray-100 rounded-lg p-2 text-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-lg font-bold">
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-[10px] text-gray-500 light:text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Email list with contact names */}
      <div className="space-y-1.5">
        {emails.map((email, i) => (
          <motion.div
            key={email.name}
            className="flex items-center gap-2 p-1.5 bg-gray-900/30 light:bg-gray-100/80 rounded-lg"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {/* Avatar with initials */}
            <motion.div
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-medium text-white"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              {email.name.split(' ').map(n => n[0]).join('')}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-white light:text-gray-900 truncate">{email.name}</div>
              <div className="text-[9px] text-gray-500 truncate">{email.subject}</div>
            </div>
            <motion.div
              className={`w-2 h-2 rounded-full ${
                email.status === 'sent' ? 'bg-green-400' :
                email.status === 'draft' ? 'bg-yellow-400' : 'bg-blue-400'
              }`}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Simulated Draft Editor Preview with typing animation
function DraftEditorPreview() {
  return (
    <div className="w-full h-32 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Mail className="w-4 h-4 text-blue-400" />
        </motion.div>
        <div className="h-2 w-24 bg-gray-700 light:bg-gray-200 rounded" />
      </div>
      <div className="space-y-1.5">
        {[1, 0.83, 0.67].map((width, i) => (
          <motion.div
            key={i}
            className="h-2 bg-gray-700/60 light:bg-gray-300/60 rounded"
            style={{ width: `${width * 100}%` }}
            initial={{ width: 0 }}
            whileInView={{ width: `${width * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          />
        ))}
      </div>
      {/* Animated progress bar */}
      <motion.div
        className="mt-3 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
        animate={{ width: ['25%', '60%', '25%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Simulated Meeting List Preview with slide animations
function MeetingListPreview() {
  const meetings = [
    { platform: 'Zoom', color: '#2D8CFF', time: '10:00 AM' },
    { platform: 'Teams', color: '#5B5FC7', time: '2:30 PM' },
    { platform: 'Meet', color: '#00897B', time: '4:00 PM' },
  ];

  return (
    <div className="w-full h-32 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-2 space-y-2">
      {meetings.map((meeting, i) => (
        <motion.div
          key={meeting.platform}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-900/50 light:bg-gray-100"
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          whileHover={{ x: 4, backgroundColor: 'rgba(17, 24, 39, 0.8)' }}
        >
          <motion.div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${meeting.color}20` }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          >
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: meeting.color }} />
          </motion.div>
          <div className="flex-1">
            <div className="h-2 w-2/3 bg-gray-700 light:bg-gray-300 rounded" />
          </div>
          <motion.div
            className="text-[10px] text-gray-500 light:text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          >
            {meeting.time}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// CRM Preview with animated connections
function CRMPreview() {
  const platforms = [
    { name: 'Airtable', color: '#18BFFF' },
    { name: 'HubSpot', color: '#FF7A59' },
    { name: 'Salesforce', color: '#00A1E0' },
  ];

  return (
    <div className="w-full h-28 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3">
      <div className="flex items-center justify-between">
        {platforms.map((platform, i) => (
          <motion.div
            key={platform.name}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${platform.color}20` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: platform.color }}
              />
            </motion.div>
            <span className="text-[9px] text-gray-500 light:text-gray-600">{platform.name}</span>
          </motion.div>
        ))}
      </div>
      {/* Animated sync indicator */}
      <motion.div
        className="flex items-center justify-center gap-2 mt-3"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <ArrowRight className="w-3 h-3 text-gray-500 light:text-gray-600" />
        </motion.div>
        <span className="text-[10px] text-gray-500 light:text-gray-600">Syncing...</span>
      </motion.div>
    </div>
  );
}

// Animated Chart with growing bars
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
          transition={{ duration: 0.5, delay: i * 0.08 }}
          whileHover={{ height: `${Math.min(height + 15, 100)}%`, transition: { duration: 0.2 } }}
        />
      ))}
    </div>
  );
}

// Settings Preview with animated toggles
function SettingsPreview() {
  return (
    <div className="w-full h-28 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3 space-y-2">
      {['Tone: Professional', 'Auto-send: Off', 'Template: Default'].map((setting, i) => (
        <motion.div
          key={setting}
          className="flex items-center justify-between"
          initial={{ x: -10, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <span className="text-[10px] text-gray-400 light:text-gray-600">{setting}</span>
          <motion.div
            className={`w-8 h-4 rounded-full ${i === 1 ? 'bg-gray-600 light:bg-gray-300' : 'bg-blue-500'} flex items-center p-0.5`}
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-white light:bg-gray-100"
              animate={{ x: i === 1 ? 0 : 12 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      ))}
      {/* Color swatches */}
      <div className="flex gap-1 mt-2">
        {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'].map((color, i) => (
          <motion.div
            key={color}
            className="w-4 h-4 rounded-full border-2 border-transparent"
            style={{ backgroundColor: color }}
            whileHover={{ scale: 1.2, borderColor: 'white' }}
            animate={i === 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}
      </div>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
            Your <GradientText>Follow-up Command Center</GradientText>
          </h2>
          <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
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
          >
            <CRMPreview />
          </BentoCard>

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
          >
            <SettingsPreview />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
