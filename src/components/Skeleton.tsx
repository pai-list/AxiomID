"use client";

export function PassportSkeleton() {
  return (
    <div className="passport-card p-0 animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/10" />
          <div className="w-16 h-3 bg-white/10 rounded" />
        </div>
        <div className="w-20 h-2 bg-white/5 rounded" />
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Left */}
        <div className="flex flex-col items-center gap-4 md:w-48">
          <div className="w-24 h-24 rounded-2xl bg-white/5" />
          <div className="w-20 h-4 bg-white/10 rounded" />
          <div className="w-32 h-2 bg-white/5 rounded" />
          <div className="w-full h-12 bg-white/5 rounded-lg" />
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-white/5 rounded-lg" />
            <div className="w-16 h-6 bg-white/5 rounded-lg" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 h-20" />
            <div className="bg-white/5 rounded-xl p-3 h-20" />
            <div className="bg-white/5 rounded-xl p-3 h-20" />
          </div>

          <div className="bg-white/5 rounded-xl p-4 h-24" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bento-card p-4 text-center">
          <div className="w-8 h-2 bg-white/10 rounded mx-auto mb-2" />
          <div className="w-12 h-6 bg-white/10 rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}
