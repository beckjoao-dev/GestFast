interface Props {
  type: 'warn' | 'danger' | 'success'
  message: string
}

const styles = {
  warn:    'bg-amber-500/10 border-amber-500/20 text-amber-400',
  danger:  'bg-red-500/10   border-red-500/20   text-red-400',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
}

export default function AlertBanner({ type, message }: Props) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm ${styles[type]}`}>
      <span className="mt-0.5 w-2 h-2 rounded-full bg-current shrink-0 opacity-80" />
      {message}
    </div>
  )
}
