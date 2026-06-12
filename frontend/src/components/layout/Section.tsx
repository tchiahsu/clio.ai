import SectionHeader from "./SectionHeader";

interface SectionProps {
  title: string
  linkText?: string
  onLinkClick?: () => void
  children: React.ReactNode
}

export default function Section ({ title, linkText, onLinkClick, children} : SectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <SectionHeader
        title={title}
        linkText={linkText}
        onLinkClick={onLinkClick}
      />
      {children}
    </div>
  )
}