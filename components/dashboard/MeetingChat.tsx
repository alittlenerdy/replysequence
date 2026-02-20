'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatSourceMeeting } from '@/lib/db/schema';

// --- Types ---

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceMeetings?: ChatSourceMeeting[];
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

// --- Main Component ---

export function MeetingChat({ meetingId }: { meetingId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load conversation history on mount
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* Ignore */ }
  }, []);

  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen, conversations.length, loadConversations]);

  // Load a specific conversation
  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations?id=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(convId);
        setMessages(data.messages || []);
        setShowHistory(false);
      }
    } catch { /* Ignore */ }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setError(null);
  };

  // Delete a conversation
  const deleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/chat/conversations?id=${convId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) {
        startNewConversation();
      }
    } catch { /* Ignore */ }
  };

  // Send a message
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setInput('');

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages(prev => [...prev, userMsg]);

    // Add placeholder for assistant
    const assistantMsgId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    }]);

    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId: conversationId || undefined,
          meetingId: meetingId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'conversation_id':
                setConversationId(event.conversationId);
                break;

              case 'sources':
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, sourceMeetings: event.meetings }
                    : m
                ));
                break;

              case 'text':
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + event.text }
                    : m
                ));
                break;

              case 'done':
                // Streaming complete
                break;

              case 'error':
                setError(event.error);
                break;
            }
          } catch {
            // Ignore parse errors for partial data
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the empty assistant placeholder on error
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Prominent floating launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95 md:bottom-8 md:right-8 group"
        >
          {/* Sparkle icon */}
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="text-sm font-semibold whitespace-nowrap">Ask your meetings</span>
          {/* Pulse ring */}
          <span className="absolute -top-1 -right-1 w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white/80 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-white" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[440px] sm:bottom-6 sm:right-6 h-[85vh] sm:h-[620px] sm:max-h-[80vh] flex flex-col bg-gray-950 light:bg-white border border-orange-500/30 light:border-orange-300/50 sm:rounded-2xl shadow-2xl shadow-orange-500/10 overflow-hidden">
          {/* Header with orange gradient */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/20 light:border-orange-200 bg-gradient-to-r from-orange-500/10 to-amber-500/10 light:from-orange-50 light:to-amber-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white light:text-gray-900">
                  {meetingId ? 'Ask this meeting' : 'Ask your meetings'}
                </h3>
                <p className="text-[10px] text-orange-300/70 light:text-orange-600/70">AI-powered meeting search</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 rounded-lg hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 light:text-gray-500 light:hover:text-orange-600 transition-colors"
                title="Conversation history"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 light:text-gray-500 light:hover:text-orange-600 transition-colors"
                title="New conversation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 light:text-gray-500 light:hover:text-orange-600 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* History sidebar (overlay) */}
          {showHistory && (
            <div className="absolute inset-0 top-[57px] z-10 bg-gray-950 light:bg-white flex flex-col">
              <div className="px-4 py-3 border-b border-gray-800 light:border-gray-200">
                <h4 className="text-sm font-medium text-gray-300 light:text-gray-600">Conversations</h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm mt-8">No conversations yet</p>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`flex items-center justify-between px-4 py-3 border-b border-gray-800/50 light:border-gray-100 hover:bg-orange-500/5 light:hover:bg-orange-50 cursor-pointer transition-colors ${
                        conv.id === conversationId ? 'bg-orange-500/10 light:bg-orange-50' : ''
                      }`}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm text-white light:text-gray-900 truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {conv.messageCount} messages
                          {conv.lastMessageAt && ` · ${formatRelativeTime(conv.lastMessageAt)}`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded hover:bg-gray-800 light:hover:bg-gray-200 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-3 text-sm text-orange-400 hover:text-orange-300 border-t border-gray-800 light:border-gray-200 light:text-orange-600 light:hover:text-orange-700 transition-colors"
              >
                Back to chat
              </button>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white light:text-gray-900 mb-1">
                  {meetingId ? 'Ask about this meeting' : 'Ask your meetings anything'}
                </p>
                <p className="text-xs text-gray-400 light:text-gray-500 max-w-[280px] mb-5">
                  {meetingId
                    ? 'Ask questions about the transcript, decisions, or action items from this meeting.'
                    : 'Search across all your meetings with AI. Get instant answers about decisions, action items, and conversations.'}
                </p>
                <div className="space-y-2 w-full max-w-[300px]">
                  {(meetingId
                    ? [
                        'What were the key decisions?',
                        'List all action items',
                        'What did each person say about next steps?',
                      ]
                    : [
                        'What action items came up this week?',
                        'Summarize my last 3 meetings',
                        'What decisions were made about the budget?',
                      ]
                  ).map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl bg-orange-500/5 light:bg-orange-50 text-orange-200 light:text-orange-700 hover:bg-orange-500/15 light:hover:bg-orange-100 border border-orange-500/15 light:border-orange-200 transition-colors"
                    >
                      <span className="text-orange-400 light:text-orange-500 mr-1.5">→</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-orange-500/20 light:border-orange-200 px-4 py-3 bg-gray-900/50 light:bg-orange-50/50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={meetingId ? 'Ask about this meeting...' : 'Ask your meetings anything...'}
                rows={1}
                className="flex-1 resize-none bg-gray-800 light:bg-white border border-gray-700 light:border-orange-200 rounded-xl px-3 py-2.5 text-sm text-white light:text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 max-h-[120px] overflow-y-auto"
                style={{ minHeight: '42px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
                disabled={isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
              >
                {isStreaming ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 light:text-gray-400 mt-1.5 text-center">
              AI can make mistakes. Verify important details.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// --- Message Bubble ---

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        {/* Source citations (above assistant messages) */}
        {!isUser && message.sourceMeetings && message.sourceMeetings.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {message.sourceMeetings.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20"
              >
                <PlatformIcon platform={src.platform} />
                {src.topic}
              </span>
            ))}
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-md'
              : 'bg-gray-800 light:bg-gray-100 text-gray-200 light:text-gray-800 rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.content ? (
            <MarkdownContent content={message.content} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:300ms]" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Simple Markdown Renderer ---

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^[-*]\s/)) {
      listItems.push(line.replace(/^[-*]\s/, ''));
      continue;
    }

    flushList();

    if (!line.trim()) {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="font-semibold mt-2 mb-0.5 text-orange-300 light:text-orange-700">{formatInline(line.slice(4))}</p>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<p key={i} className="font-semibold mt-2 mb-0.5 text-orange-300 light:text-orange-700">{formatInline(line.slice(3))}</p>);
      continue;
    }

    elements.push(<p key={i} className="mb-0.5">{formatInline(line)}</p>);
  }

  flushList();

  return <div className="space-y-0">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white light:text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// --- Helpers ---

function PlatformIcon({ platform }: { platform: string }) {
  const label = platform === 'zoom' ? 'Z' : platform === 'microsoft_teams' ? 'T' : 'G';
  const color = platform === 'zoom' ? 'text-blue-400' : platform === 'microsoft_teams' ? 'text-purple-400' : 'text-green-400';
  return <span className={`font-bold ${color}`}>{label}</span>;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
