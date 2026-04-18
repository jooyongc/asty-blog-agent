export function KpiCard({ label, value, hint, tone }: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = tone === 'success' ? 'text-green-700'
    : tone === 'warning' ? 'text-amber-700'
    : tone === 'danger' ? 'text-red-700'
    : 'text-gray-900'
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
      {hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-200 text-gray-700',
    archived: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-gray-100'}`}>
      {status}
    </span>
  )
}
