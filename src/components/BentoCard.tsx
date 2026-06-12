export function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bento-card p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}
