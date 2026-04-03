import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string
  accent?: 'purple' | 'green' | 'amber' | 'blue'
  sub?: string
}

const accentMap = {
  purple: 'text-brand-400  before:bg-brand-500',
  green:  'text-emerald-400 before:bg-emerald-500',
  amber:  'text-amber-400   before:bg-amber-500',
  blue:   'text-blue-400    before:bg-blue-500',
}

export default function StatCard({ label, value, accent = 'purple', sub }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-5
                    before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:content-['']"
      style={{ ['--tw-before-bg' as string]: undefined }}
    >
      {/* accent bar via inline style */}
      <div className={cn('absolute inset-x-0 top-0 h-[2px]',
        accent === 'purple' ? 'bg-gradient-to-r from-brand-500 to-transparent' :
        accent === 'green'  ? 'bg-gradient-to-r from-emerald-500 to-transparent' :
        accent === 'amber'  ? 'bg-gradient-to-r from-amber-500 to-transparent' :
                              'bg-gradient-to-r from-blue-500 to-transparent'
      )} />
      <div className="text-xs text-white/35 font-medium uppercase tracking-widest mb-2">{label}</div>
      <div className={cn('text-2xl font-semibold font-mono tracking-tight', accentMap[accent])}>
        {value}
      </div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  )
}
