'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Video,
  Users,
  Clock,
  ToggleLeft,
  ToggleRight,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import type { CalendarEvent, CalendarEventAttendee, MeetingPlatform } from '@/lib/db/schema';

interface UpcomingMeetingsWidgetProps {
  initialEvents?: CalendarEvent[];
}

// Platform icons and colors
const platformConfig: Record<string, { icon: typeof Video; color: string; bgColor: string }> = {
  zoom: { icon: Video, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  google_meet: { icon: Video, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  microsoft_teams: { icon: Video, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

// Format relative time - requires nowMs to be passed to avoid hydration mismatch
function formatRelativeTime(date: Date, nowMs: number): string {
  const diffMs = date.getTime() - nowMs;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  return `in ${diffDays} days`;
}

// Format time - requires nowMs to be > 0 (client-side) to avoid hydration mismatch
function formatTime(date: Date, isMounted: boolean): string {
  if (!isMounted) return '...';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Meeting card component
function MeetingCard({
  event,
  onToggleAutoProcess,
  isUpdating,
  nowMs,
}: {
  event: CalendarEvent;
  onToggleAutoProcess: (eventId: string, newValue: 'enabled' | 'disabled') => void;
  isUpdating: boolean;
  nowMs: number;
}) {
  const startTime = new Date(event.startTime);
  const platform = event.meetingPlatform as MeetingPlatform | null;
  const config = platform ? platformConfig[platform] : platformConfig.zoom;
  const Icon = config?.icon || Video;
  const attendees = (event.attendees as CalendarEventAttendee[]) || [];
  const attendeeCount = attendees.length;
  const autoProcessEnabled = event.autoProcess !== 'disabled';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 light:bg-gray-100 hover:bg-gray-800/70 light:hover:bg-gray-200 transition-colors group"
    >
      {/* Platform icon */}
      <div className={`w-10 h-10 rounded-lg ${config?.bgColor || 'bg-gray-500/20'} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config?.color || 'text-gray-400'}`} />
      </div>

      {/* Meeting info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white light:text-gray-900 truncate">
          {event.title}
        </h4>
        <div className="flex items-center gap-3 text-sm text-gray-400 light:text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(startTime, nowMs > 0)}
          </span>
          {attendeeCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {attendeeCount}
            </span>
          )}
        </div>
      </div>

      {/* Relative time badge - only show after client hydration */}
      {nowMs > 0 && (
        <div className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
          {formatRelativeTime(startTime, nowMs)}
        </div>
      )}

      {/* Auto-process toggle */}
      {event.meetingUrl && (
        <button
          onClick={() => onToggleAutoProcess(event.id, autoProcessEnabled ? 'disabled' : 'enabled')}
          disabled={isUpdating}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
            autoProcessEnabled
              ? 'text-emerald-400 hover:bg-emerald-500/20'
              : 'text-gray-500 hover:bg-gray-700'
          } disabled:opacity-50`}
          title={autoProcessEnabled ? 'Auto-process enabled' : 'Auto-process disabled'}
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : autoProcessEnabled ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>
      )}
    </motion.div>
  );
}

export function UpcomingMeetingsWidget({ initialEvents }: UpcomingMeetingsWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState(!initialEvents);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const hasFetched = useRef(false);
  // Track "now" in state to avoid hydration mismatch
  const [nowMs, setNowMs] = useState<number>(0);

  // Initialize nowMs on client only to avoid hydration mismatch
  useEffect(() => {
    setNowMs(Date.now());
    // Update every minute
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/calendar/events?days=7', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setCalendarConnected(data.calendarConnected ?? false);
      } else {
        console.error('[UPCOMING-MEETINGS] API returned error:', response.status);
        // Still set calendarConnected to null so we show "connect calendar" message
        setCalendarConnected(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[UPCOMING-MEETINGS] Request timed out');
      } else {
        console.error('[UPCOMING-MEETINGS] Failed to fetch events:', error);
      }
      // On error, assume calendar might not be connected
      setCalendarConnected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialEvents && !hasFetched.current) {
      hasFetched.current = true;
      fetchEvents();
    }
  }, [initialEvents, fetchEvents]);

  const handleToggleAutoProcess = useCallback(
    async (eventId: string, newValue: 'enabled' | 'disabled') => {
      setUpdatingEventId(eventId);
      try {
        const response = await fetch(`/api/calendar/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autoProcess: newValue }),
        });

        if (response.ok) {
          const data = await response.json();
          setEvents((prev) =>
            prev.map((e) => (e.id === eventId ? data.event : e))
          );
        }
      } catch (error) {
        console.error('[UPCOMING-MEETINGS] Failed to update auto-process:', error);
      } finally {
        setUpdatingEventId(null);
      }
    },
    []
  );

  // Filter to only show events with meeting URLs
  const meetingEvents = events.filter((e) => e.meetingUrl);
  // Use the calendarConnected flag from API, fallback to checking if we have any events
  const hasCalendarConnected = calendarConnected ?? (events.length > 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
          <div>
            <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-28 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-700 light:bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl" />

      {/* Inner content */}
      <div className="relative m-[1px] bg-gray-900/95 light:bg-white/95 backdrop-blur-xl rounded-2xl p-6">
        {/* Background glow effects */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-gray-900">
                Upcoming Meetings
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-500">
                Next 7 days
              </p>
            </div>
          </div>

          {meetingEvents.length > 0 && (
            <div className="text-sm text-gray-400 light:text-gray-500">
              {meetingEvents.length} meeting{meetingEvents.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Content */}
        {meetingEvents.length > 0 ? (
          <div className="relative space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {meetingEvents.slice(0, 5).map((event, index) => (
              <MeetingCard
                key={event.id}
                event={event}
                onToggleAutoProcess={handleToggleAutoProcess}
                isUpdating={updatingEventId === event.id}
                nowMs={nowMs}
              />
            ))}
            {meetingEvents.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                +{meetingEvents.length - 5} more meetings
              </p>
            )}
          </div>
        ) : hasCalendarConnected ? (
          /* No meetings with URLs */
          <div className="relative text-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                <Video className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white light:text-gray-900 mb-1">
                  No Video Meetings
                </h4>
                <p className="text-gray-400 light:text-gray-500 text-sm max-w-xs mx-auto">
                  No Zoom, Meet, or Teams meetings scheduled in the next 7 days
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Calendar not connected */
          <div className="relative text-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                <CalendarPlus className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white light:text-gray-900 mb-1">
                  Connect Your Calendar
                </h4>
                <p className="text-gray-400 light:text-gray-500 text-sm max-w-xs mx-auto">
                  Connect Google or Outlook calendar to see upcoming meetings and auto-generate drafts
                </p>
              </div>
              <a
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                Connect Calendar
              </a>
            </motion.div>
          </div>
        )}

        {/* Auto-process legend */}
        {meetingEvents.length > 0 && (
          <div className="relative flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-700/50 light:border-gray-200 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ToggleRight className="w-4 h-4 text-emerald-400" />
              Auto-process on
            </span>
            <span className="flex items-center gap-1">
              <ToggleLeft className="w-4 h-4 text-gray-500" />
              Auto-process off
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
