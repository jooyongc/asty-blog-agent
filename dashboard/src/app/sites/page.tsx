import { listSites } from '@/lib/sites'
import Link from 'next/link'
import { Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function SitesListPage() {
  const sites = await listSites()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">사이트</h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          {sites.length}개 사이트가 구성되어 있습니다. 각 사이트는{' '}
          <code className="font-mono text-[12px] bg-[color:var(--color-bg-muted)] px-1 rounded">
            sites/&lt;id&gt;/config.json
          </code>{' '}
          으로 관리됩니다.
        </p>
      </header>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">구성된 사이트</div>
          <div className="flex-1" />
          <Chip kind="ghost">{sites.length}</Chip>
        </CardHead>
        <table className="w-full text-[13px]">
          <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Site</th>
              <th className="text-left px-4 py-2.5 font-medium">URL</th>
              <th className="text-left px-4 py-2.5 font-medium">Canonical</th>
              <th className="text-left px-4 py-2.5 font-medium">Languages</th>
              <th className="text-left px-4 py-2.5 font-medium">Categories</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr
                key={s.site_id}
                className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-bg-subtle)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/sites/${s.site_id}`}
                    className="font-medium hover:underline"
                  >
                    {s.site_id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={s.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-[color:var(--color-blue)] hover:underline"
                  >
                    {s.site_url.replace(/^https?:\/\//, '')}
                  </a>
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.canonical_lang}
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.languages.join(', ')}
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.categories.length}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sites/${s.site_id}`}
                    className="text-[12px] text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] flex items-center gap-0.5"
                  >
                    상세 <Icons.Chevron size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
