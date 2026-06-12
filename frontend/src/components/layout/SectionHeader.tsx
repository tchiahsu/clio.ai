interface SectionHeaderProps {
  title: string;
  linkText?: string;
  onLinkClick?: () => void;
}

export default function SectionHeader({ title, linkText, onLinkClick }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <h2 className="text-sm! font-semibold text-gray-500 uppercase tracking-widest mb-2">{title}</h2>
      {linkText && (
        <button
          onClick={onLinkClick}
          className="text-xs! uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:underline transition-colors"
          >
            {linkText} ↗
          </button>
      )}
    </div>
  )
}