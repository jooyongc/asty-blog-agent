import { listSites, readDeeplUsage } from '@/lib/sites'
import { KpiCard } from '@/components/kpi-card'

export const dynamic = 'force-dynamic'

const DEEPL_MONTHLY_CAP = 500000

export default function PipelinePage() {
  const sites = listSites()
  const deepl = readDeeplUsage()
  const thisMonth = new Date().toISOString().slice(0, 7)
  const deeplActive = deepl && deepl.month === thisMonth
  const pct = deepl && deeplActive ? Math.round((deepl.chars / DEEPL_MONTHLY_CAP) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">Agent runtime health, usage, and triggers.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="DeepL (monthly)"
          value={deeplActive ? `${pct}%` : '—'}
          hint={deeplActive ? `${deepl!.chars.toLocaleString()} / ${DEEPL_MONTHLY_CAP.toLocaleString()} chars` : 'No usage file found'}
          tone={pct > 80 ? 'warning' : 'default'}
        />
        <KpiCard
          label="DeepL runs"
          value={deeplActive ? deepl!.runs : '—'}
          hint="This month"
        />
        <KpiCard label="Sites" value={sites.length} />
        <KpiCard label="Month" value={thisMonth} />
      </div>

      <section className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-3">Sites</h2>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-gray-600 border-b">
            <tr>
              <th className="text-left pb-2">Site</th>
              <th className="text-left pb-2">URL</th>
              <th className="text-left pb-2">Canonical</th>
              <th className="text-left pb-2">Languages</th>
              <th className="text-left pb-2">Categories</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(s => (
              <tr key={s.site_id} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.site_id}</td>
                <td className="py-2">
                  <a href={s.site_url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">
                    {s.site_url.replace(/^https?:\/\//, '')}
                  </a>
                </td>
                <td className="py-2 text-xs text-gray-600">{s.canonical_lang}</td>
                <td className="py-2 text-xs text-gray-600">{s.languages.join(', ')}</td>
                <td className="py-2 text-xs text-gray-600">{s.categories.length}</td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-xs">No sites configured</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-3">External links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <a href="https://console.anthropic.com/usage" target="_blank" rel="noopener" className="border rounded p-4 hover:bg-gray-50">
            <div className="font-medium">Anthropic usage</div>
            <div className="text-xs text-gray-500 mt-1">Check Haiku spend</div>
          </a>
          <a href="https://www.deepl.com/account/usage" target="_blank" rel="noopener" className="border rounded p-4 hover:bg-gray-50">
            <div className="font-medium">DeepL account</div>
            <div className="text-xs text-gray-500 mt-1">Account-level quota</div>
          </a>
          <a href="https://github.com/jooyongc/asty-blog-agent/actions" target="_blank" rel="noopener" className="border rounded p-4 hover:bg-gray-50">
            <div className="font-medium">GitHub Actions</div>
            <div className="text-xs text-gray-500 mt-1">Weekly pipeline runs</div>
          </a>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-2">Weekly Trigger</h2>
        <p className="text-xs text-gray-500 mb-4">
          The <code className="bg-gray-100 px-1 rounded">/weekly</code> command runs every Sunday 21:00 KST via GitHub Actions,
          or can be triggered manually. This dashboard reads from the agent repo — no direct trigger yet.
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Schedule: <code className="bg-gray-100 px-1 rounded">0 12 * * 0</code> (Sunday 12:00 UTC)</div>
          <div>• Subagents per run: 9 (3 seo-researcher + 3 writer + 3 packager)</div>
          <div>• Target cost: ≤ $2.00/week</div>
        </div>
      </section>
    </div>
  )
}
