import { listReports } from '@/lib/sites'
import Link from 'next/link'
import fs from 'fs'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Minimal markdown-to-HTML: safe since content is generated locally by our own script.
function mdToHtml(md: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let paraBuf: string[] = []
  let inTable = false

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p class="text-sm text-gray-700 my-3 leading-relaxed">${escape(paraBuf.join(' '))}</p>`)
      paraBuf = []
    }
  }
  const endTable = () => {
    if (inTable) { out.push('</tbody></table></div>'); inTable = false }
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('# ')) { flushPara(); endTable(); out.push(`<h1 class="text-2xl font-semibold mt-6 mb-3">${escape(l.slice(2))}</h1>`) }
    else if (l.startsWith('## ')) { flushPara(); endTable(); out.push(`<h2 class="text-lg font-semibold mt-6 mb-2">${escape(l.slice(3))}</h2>`) }
    else if (l.startsWith('- ')) { flushPara(); endTable(); out.push(`<li class="text-sm text-gray-700 ml-6 list-disc my-1">${escape(l.slice(2))}</li>`) }
    else if (l.startsWith('| ')) {
      flushPara()
      const cells = l.slice(1).split('|').map(c => c.trim()).filter(s => s !== '')
      if (!inTable) {
        out.push('<div class="overflow-x-auto my-3"><table class="text-xs border-collapse w-full"><thead class="bg-gray-50 text-gray-600 border-b"><tr>')
        for (const c of cells) out.push(`<th class="text-left px-3 py-1.5 font-medium">${escape(c)}</th>`)
        out.push('</tr></thead><tbody>')
        // skip separator row (next line looks like |---|)
        if (lines[i + 1] && /^\|[\s\-:|]+\|?$/.test(lines[i + 1].trim())) i++
        inTable = true
      } else {
        out.push('<tr class="border-b">')
        for (const c of cells) out.push(`<td class="px-3 py-1.5 font-mono text-[11px]">${escape(c).replace(/^`|`$/g, '')}</td>`)
        out.push('</tr>')
      }
    }
    else if (l.trim() === '') { flushPara(); endTable() }
    else { paraBuf.push(l) }
  }
  flushPara()
  endTable()
  return out.join('\n')
}

function renderJsonReport(raw: string): string {
  // Render a freshness/citation JSON report as a readable table. Falls back to
  // pretty-printed JSON if the shape doesn't match.
  try {
    const obj = JSON.parse(raw) as {
      site?: string
      generated_at?: string
      stale_days?: number
      results?: Array<{
        slug: string
        title: string
        category: string
        publishedAt: string | null
        age_days: number
        score: number
        band: string
        risks: string[]
      }>
    }
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    if (obj.results && Array.isArray(obj.results)) {
      const bandColor: Record<string, string> = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-amber-100 text-amber-700',
        low: 'bg-gray-100 text-gray-600',
        fresh: 'bg-emerald-100 text-emerald-700',
      }
      const rows = obj.results.map((r) => {
        const bandCls = bandColor[r.band] ?? 'bg-gray-100'
        return `
        <tr class="border-b">
          <td class="px-3 py-2"><span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase ${bandCls}">${escape(r.band)}</span></td>
          <td class="px-3 py-2 font-mono tabular-nums">${r.score}</td>
          <td class="px-3 py-2 font-mono tabular-nums">${r.age_days}d</td>
          <td class="px-3 py-2 text-[11px]">${escape(r.category)}</td>
          <td class="px-3 py-2 text-[12px]">${escape(r.title)}</td>
          <td class="px-3 py-2 text-[10.5px] text-gray-500 font-mono">${escape(r.slug)}</td>
          <td class="px-3 py-2 text-[10px] text-gray-600">${r.risks.map(escape).join(', ')}</td>
        </tr>`
      }).join('')

      return `
        <h1 class="text-2xl font-semibold mb-1">Freshness Report — ${escape(obj.site ?? '')}</h1>
        <div class="text-sm text-gray-500 mb-4">Generated ${escape(obj.generated_at ?? '')} · stale ≥ ${obj.stale_days ?? '?'}d</div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th class="px-3 py-2 text-left">Band</th>
                <th class="px-3 py-2 text-left">Score</th>
                <th class="px-3 py-2 text-left">Age</th>
                <th class="px-3 py-2 text-left">Category</th>
                <th class="px-3 py-2 text-left">Title</th>
                <th class="px-3 py-2 text-left">Slug</th>
                <th class="px-3 py-2 text-left">Risks</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
    }
  } catch {
    // fall through to raw pretty-print
  }
  let pretty = raw
  try {
    pretty = JSON.stringify(JSON.parse(raw), null, 2)
  } catch { /* keep raw */ }
  const safe = pretty.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<pre class="text-xs bg-gray-50 p-4 rounded overflow-x-auto font-mono leading-relaxed">${safe}</pre>`
}

export default async function ReportDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name: encoded } = await params
  const name = decodeURIComponent(encoded)
  const r = listReports().find(x => x.name === name)
  if (!r) notFound()
  const raw = fs.readFileSync(r.path, 'utf8')
  const html = r.name.endsWith('.json') ? renderJsonReport(raw) : mdToHtml(raw)
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/reports" className="text-sm text-gray-600 hover:underline">← All reports</Link>
      <article className="mt-4 bg-white border rounded-lg p-8" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
