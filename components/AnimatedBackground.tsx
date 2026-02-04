'use client';

export default function AnimatedBackground() {
  return (
    <div className="animated-gradient-bg" aria-hidden="true">
      {/* Additional gradient orbs for depth */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(219, 39, 119, 0.15) 0%, transparent 70%)',
          animation: 'float 18s ease-in-out infinite',
          animationDelay: '-5s',
        }}
      />
    </div>
  );
}
