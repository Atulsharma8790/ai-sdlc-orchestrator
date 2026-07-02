'use client'
interface Props { score: number; rationale: string }

export default function ConfidenceScore({ score, rationale }: Props) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low'

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      {/* Ring */}
      <div className="shrink-0 relative w-12 h-12">
        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-default)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Confidence</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{label}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rationale}</p>
      </div>
    </div>
  )
}
