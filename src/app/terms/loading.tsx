export default function Loading() {
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-8 bg-white/5 rounded w-1/3" />
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-32 bg-white/5 rounded w-full" />
      </div>
    </div>
  );
}
