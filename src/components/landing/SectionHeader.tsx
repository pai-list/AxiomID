interface SectionHeaderProps {
  label: string;
  title: string;
  labelColor: string;
}

export default function SectionHeader({ label, title, labelColor }: SectionHeaderProps) {
  return (
    <div className="text-center mb-10 sm:mb-12">
      <span className={`text-[10px] font-mono ${labelColor} tracking-widest uppercase`}>{label}</span>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-surface mt-2">{title}</h2>
    </div>
  );
}
