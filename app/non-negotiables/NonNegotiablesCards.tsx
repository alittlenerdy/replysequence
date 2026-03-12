'use client';

import Image from 'next/image';
import {
  Mail,
  Sparkles,
  Send,
  Monitor,
  RefreshCw,
  Shield,
  Zap,
  Pencil,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

// Map icon names back to components (NON_NEGOTIABLES uses component refs which can't serialize)
const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  Sparkles,
  Send,
  Monitor,
  RefreshCw,
  Shield,
  Zap,
  Pencil,
  BarChart3,
};

const ICON_ORDER = [
  'Mail',
  'Sparkles',
  'Send',
  'Monitor',
  'RefreshCw',
  'Shield',
  'Zap',
  'Pencil',
  'BarChart3',
];

interface Item {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

interface Props {
  items: readonly Item[];
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[1080px] h-[1080px] flex-shrink-0 rounded-3xl overflow-hidden relative">
      {children}
    </div>
  );
}

function LogoBadge() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/logo.png" alt="ReplySequence" width={40} height={40} />
      <span className="text-white/90 font-semibold text-xl tracking-tight">
        ReplySequence
      </span>
    </div>
  );
}

function TitleCard() {
  return (
    <CardShell>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 text-center">
        <Image
          src="/logo.png"
          alt="ReplySequence"
          width={80}
          height={80}
          className="mb-8"
        />
        <h2 className="text-6xl font-extrabold text-white mb-6 leading-tight">
          Our 9<br />Non-Negotiables
        </h2>
        <p className="text-2xl text-white/80 max-w-[700px] leading-relaxed">
          The promises baked into every feature we ship. No exceptions.
        </p>
      </div>
    </CardShell>
  );
}

function ContentCard({
  item,
  index,
}: {
  item: Item;
  index: number;
}) {
  const iconName = ICON_ORDER[index];
  const Icon = ICON_MAP[iconName] || item.icon;

  return (
    <CardShell>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
      <div className="relative z-10 flex flex-col h-full px-16 py-16">
        {/* Top: logo + badge */}
        <div className="flex items-center justify-between mb-auto">
          <LogoBadge />
          <span className="text-white/60 font-semibold text-lg">
            Non-Negotiable #{index + 1}
          </span>
        </div>

        {/* Center: icon + text */}
        <div className="flex flex-col items-center text-center my-auto">
          <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-10">
            <Icon className="w-14 h-14 text-white" />
          </div>
          <h3 className="text-5xl font-extrabold text-white mb-6 leading-tight max-w-[800px]">
            {item.title}
          </h3>
          <p className="text-2xl text-white/80 max-w-[700px] leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Bottom spacer */}
        <div className="mt-auto" />
      </div>
    </CardShell>
  );
}

function CTACard() {
  return (
    <CardShell>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 text-center">
        <Image
          src="/logo.png"
          alt="ReplySequence"
          width={80}
          height={80}
          className="mb-8"
        />
        <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">
          Stop letting follow-ups<br />fall through the cracks
        </h2>
        <p className="text-2xl text-white/80 mb-10 max-w-[700px]">
          AI-powered email drafts, seconds after every call.
        </p>
        <div className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-indigo-700 font-bold text-2xl">
          replysequence.com
        </div>
      </div>
    </CardShell>
  );
}

export function NonNegotiablesCards({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-8 place-items-center">
      <TitleCard />
      {items.map((item, i) => (
        <ContentCard key={i} item={item} index={i} />
      ))}
      <CTACard />
    </div>
  );
}
