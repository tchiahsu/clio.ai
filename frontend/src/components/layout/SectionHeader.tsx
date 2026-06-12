interface SectionHeaderProps {
  title: string;
  linkText?: string;
  onLinkClick?: () => void;
}

export default function SectionHeader({ title, linkText, onLinkClick }: SectionHeaderProps) {
  return (
    <div className="flfex items-center justify-between mb-4">
      <h2 className="text-xl fontsemibold text-gray-900">{title}</h2>
      {linkText && (
        <button
          onClick={onLinkClick}
          className="text[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
          >
            {linkText} ↗
          </button>
      )}
    </div>
  )
}