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
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-indigo-500/20 to-indigo-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center mb-4 border border-gray-700 light:border-gray-200">
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
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
    </motion.div>
  );
}

// Animated Number Counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      className="font-bold tabular-nums bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent"
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
    { name: 'Alex Kim', subject: 'Budget Review Follow-up', status: 'sent' },
    { name: 'Jordan Lee', subject: 'Re: Technical Integration', status: 'sent' },
    { name: 'Maria Garcia', subject: 'Quarterly Planning Sync', status: 'draft' },
    { name: 'David Park', subject: 'Follow-up: Contract Terms', status: 'pending' },
  ];

  return (
    <div className="w-full h-full min-h-[280px] bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-4">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-indigo-700"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="h-3 w-20 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
        <motion.div
          className="h-6 w-16 bg-indigo-500/20 rounded border border-indigo-500/30"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Stats row with gradient animated counters */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { value: 24, label: 'Meetings' },
          { value: 18, label: 'Drafts' },
          { value: 12, label: 'Sent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-gray-900/50 light:bg-gray-100 rounded-lg p-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-xl font-bold">
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-xs text-gray-500 light:text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Email list with contact names */}
      <div className="space-y-2">
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
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-[10px] font-medium text-white"
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
                email.status === 'draft' ? 'bg-yellow-400' : 'bg-indigo-400'
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
  const draftLines = [
    "Hi Sarah,",
    "Thanks for the great call today!",
    "Key points we discussed:",
    "• Q4 budget allocation",
    "• Timeline for launch",
  ];

  return (
    <div className="w-full h-40 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Mail className="w-4 h-4 text-indigo-400" />
        </motion.div>
        <motion.span
          className="text-[10px] text-gray-400 light:text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          To: sarah.chen@company.com
        </motion.span>
      </div>
      <div className="space-y-1">
        {draftLines.map((line, i) => (
          <motion.div
            key={i}
            className="text-[9px] text-gray-300 light:text-gray-700 font-mono overflow-hidden whitespace-nowrap"
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: "100%",
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.5 + i * 0.6,
              ease: "easeOut"
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1] }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.6 }}
            >
              {line}
            </motion.span>
          </motion.div>
        ))}
        {/* Typing cursor */}
        <motion.span
          className="inline-block w-1.5 h-3 bg-indigo-400 ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>
      {/* Send button that appears after typing */}
      <motion.div
        className="mt-2 h-5 w-16 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 4, duration: 0.3 }}
      >
        <span className="text-[8px] text-white font-medium">Send Email</span>
      </motion.div>
    </div>
  );
}

// Simulated Meeting List Preview with realistic meeting entries
function MeetingListPreview() {
  const meetings = [
    { platform: 'Zoom', color: '#2D8CFF', time: '10:00 AM', title: 'Q1 Pipeline Review', host: 'Sarah C.' },
    { platform: 'Teams', color: '#5B5FC7', time: '2:30 PM', title: 'Product Demo Call', host: 'Mike J.' },
    { platform: 'Meet', color: '#00897B', time: '4:00 PM', title: 'Client Onboarding', host: 'You' },
  ];

  // Platform-specific icons as mini SVGs
  const PlatformIcon = ({ platform, color }: { platform: string; color: string }) => {
    if (platform === 'Zoom') {
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
          <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
        </svg>
      );
    }
    if (platform === 'Teams') {
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
          <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3z"/>
      </svg>
    );
  };

  return (
    <div className="w-full h-32 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-2 space-y-2 overflow-hidden">
      {meetings.map((meeting, i) => (
        <motion.div
          key={meeting.platform}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-900/50 light:bg-gray-100"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.3, duration: 0.5 }}
          whileHover={{ x: 4, backgroundColor: 'rgba(17, 24, 39, 0.8)' }}
        >
          {/* Platform icon */}
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${meeting.color}20` }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          >
            <PlatformIcon platform={meeting.platform} color={meeting.color} />
          </motion.div>

          {/* Meeting info */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-white light:text-gray-900 truncate">
              {meeting.title}
            </div>
            <div className="text-[9px] text-gray-500 light:text-gray-500 truncate">
              Host: {meeting.host}
            </div>
          </div>

          {/* Time badge */}
          <motion.div
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${meeting.color}15`, color: meeting.color }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          >
            {meeting.time}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// CRM Preview with animated data flow, contact cards, and sync activity
function CRMPreview() {
  const platforms = [
    { name: 'Airtable', color: '#18BFFF' },
    { name: 'HubSpot', color: '#FF7A59' },
    { name: 'Salesforce', color: '#00A1E0' },
  ];

  const syncEvents = [
    { contact: 'Sarah C.', action: 'Contact updated', platform: 0 },
    { contact: 'Mike J.', action: 'Deal created', platform: 1 },
    { contact: 'Emily D.', action: 'Note added', platform: 2 },
    { contact: 'Alex K.', action: 'Activity logged', platform: 0 },
  ];

  return (
    <div className="w-full h-40 bg-gray-800/50 light:bg-white/50 rounded-lg border border-gray-700 light:border-gray-200 p-3 overflow-hidden">
      {/* Platform icons row with animated connection lines */}
      <div className="flex items-center justify-center gap-3 mb-3 relative">
        {platforms.map((platform, i) => (
          <div key={platform.name} className="flex items-center">
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                style={{ backgroundColor: `${platform.color}20` }}
                animate={{
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    `0 0 0 0 ${platform.color}00`,
                    `0 0 12px 4px ${platform.color}40`,
                    `0 0 0 0 ${platform.color}00`,
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: platform.color }}
                />
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{ borderColor: platform.color }}
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.8 }}
                />
              </motion.div>
              <span className="text-[8px] text-gray-500 light:text-gray-600 font-medium">{platform.name}</span>
            </motion.div>

            {/* Animated data packets flowing between platforms */}
            {i < platforms.length - 1 && (
              <div className="relative w-8 h-4 mx-0.5 -mt-3">
                {[0, 1, 2].map((packet) => (
                  <motion.div
                    key={packet}
                    className="absolute top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: platforms[i + 1].color }}
                    animate={{
                      x: [-2, 30],
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: packet * 0.5 + i * 0.3,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live sync feed - scrolling activity log */}
      <div className="space-y-1.5">
        {syncEvents.map((event, i) => (
          <motion.div
            key={event.contact}
            className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-900/40 light:bg-gray-100/80"
            initial={{ x: 40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.2 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: platforms[event.platform].color }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            />
            <span className="text-[9px] text-white light:text-gray-900 font-medium truncate">{event.contact}</span>
            <span className="text-[8px] text-gray-500 truncate flex-1 text-right">{event.action}</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.3, type: 'spring' }}
            >
              <Check className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Animated sync status bar */}
      <motion.div
        className="flex items-center justify-center gap-2 mt-2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[9px] text-indigo-400 light:text-indigo-600 font-medium">Syncing...</span>
        {/* Mini progress bar */}
        <div className="w-12 h-1 bg-gray-700 light:bg-gray-300 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full"
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
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
          className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-700 rounded-t"
          animate={{
            height: [`${height}%`, `${Math.min(height + 20, 95)}%`, `${height}%`],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut'
          }}
          whileHover={{ height: `${Math.min(height + 25, 100)}%`, transition: { duration: 0.2 } }}
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
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
        >
          <motion.span
            className="text-[10px] text-gray-400 light:text-gray-600"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          >
            {setting}
          </motion.span>
          <motion.div
            className={`w-8 h-4 rounded-full ${i === 1 ? 'bg-gray-600 light:bg-gray-300' : 'bg-indigo-500'} flex items-center p-0.5`}
            animate={i !== 1 ? { boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 8px 2px rgba(59, 130, 246, 0.4)', '0 0 0 0 rgba(59, 130, 246, 0)'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-white light:bg-gray-100"
              animate={{ x: i === 1 ? [0, 0] : [12, 12] }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      ))}
      {/* Color swatches with wave animation */}
      <div className="flex gap-1 mt-2">
        {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'].map((color, i) => (
          <motion.div
            key={color}
            className="w-4 h-4 rounded-full border-2 border-transparent cursor-pointer"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.25, 1], y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            whileHover={{ scale: 1.3, borderColor: 'white' }}
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
            icon={<Zap className="w-6 h-6 text-indigo-400" />}
            delay={0.1}
          >
            <DraftEditorPreview />
          </BentoCard>

          {/* Meeting List */}
          <BentoCard
            title="Every Meeting Captured"
            description="Automatic transcript download from Zoom, Teams, Meet"
            icon={<Calendar className="w-6 h-6 text-indigo-400" />}
            delay={0.2}
          >
            <MeetingListPreview />
          </BentoCard>

          {/* CRM Sync */}
          <BentoCard
            title="Auto-logged to CRM"
            description="Airtable, HubSpot, Salesforce integrations coming soon"
            icon={<Users className="w-6 h-6 text-indigo-400" />}
            delay={0.3}
          >
            <CRMPreview />
          </BentoCard>

          {/* Analytics */}
          <BentoCard
            title="Track Performance"
            description="Response rates, meeting stats, and insights"
            icon={<BarChart3 className="w-6 h-6 text-amber-400" />}
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
