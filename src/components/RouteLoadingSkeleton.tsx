export default function RouteLoadingSkeleton() {
  return (
    <div
      className="min-h-screen bg-grid flex items-center justify-center p-4 animate-fadeIn"
      role="status"
      aria-busy="true"
      aria-label="Page loading"
    >
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-8 bg-glass rounded w-1/3" />
        <div className="h-4 bg-glass rounded w-2/3" />
        <div className="h-4 bg-glass rounded w-1/2" />
        <div className="h-32 bg-glass rounded w-full" />
      </div>
    </div>
  );
}
