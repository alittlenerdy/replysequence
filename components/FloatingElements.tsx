'use client';

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'layout style paint' }}>
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 light:bg-indigo-400/30 rounded-full blur-3xl animate-pulse-slow will-change-transform"
        style={{ contain: 'layout' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 light:bg-indigo-400/30 rounded-full blur-3xl animate-pulse-slow will-change-transform"
        style={{ animationDelay: '1s', contain: 'layout' }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/10 light:bg-amber-400/30 rounded-full blur-3xl animate-pulse-slow will-change-transform"
        style={{ animationDelay: '2s', contain: 'layout' }}
      />
    </div>
  );
}
