interface ContentCardProps {
  title: string
  amount: string
  subtitle?: string
  badge?: {
    text: string
    variant: 'success' | 'danger' | 'neutral'
  }
  progress?: {
    value: number
    max?: number
  }
  footer?: string
}

export default function ContentCard({ title, amount, subtitle, badge, progress, footer }: ContentCardProps) {
  const badgeStyles = {
    success: { backgroundColor: 'rgba(52, 168, 112, 0.15)', color: '#34a870' },
    danger: { backgroundColor: 'rgba(220, 80, 80, 0.15)', color: '#dc5050' },
    neutral: { backgroundColor: 'rgba(100, 100, 100, 0.1)', color: '#666' },
  }

  return (
    <div className="bg-clio-glass shadow-sm border-white rounded-2xl p-6 flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
      
      <h2 className="text-4xl font-bold text-gray-900">{amount}</h2>
      
      {subtitle && (
        <p className="text-sm text-gray-400">{subtitle}</p>
      )}

      {badge && (
        <div
          className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full w-fit"
          style={{ ...badgeStyles[badge.variant], padding: '1px 10px'}}
        >
          {badge.variant === 'danger' ? '↘' : '↗'} {badge.text}
        </div>
      )}

      {progress && (
        <div className="mt-2">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{width : `${Math.min(progress.value, 100)}%`}}
            />
          </div>
          {footer && (
            <p className="text-xs text-gray-400 mt-1"></p>
          )}
        </div>
      )}

    </div>
  )
}