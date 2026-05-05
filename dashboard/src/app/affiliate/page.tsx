import { listSites, type SiteConfig } from '@/lib/sites'
import { Card, CardHead } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { AffiliateClient } from './affiliate-client'

export const dynamic = 'force-dynamic'

export type SiteSummary = {
  site_id: string
  name: string
  site_url: string
}

export default async function AffiliatePage() {
  const sites = await listSites()
  const summaries: SiteSummary[] = sites.map((s: SiteConfig) => ({
    site_id: s.site_id,
    name: s.site_id,
    site_url: s.site_url,
  }))

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHead>
          <Icons.Layers size={14} />
          <div className="text-[13.5px] font-semibold">어필리에이트 관리</div>
        </CardHead>
        <div className="px-4 py-3 text-[12px] text-[color:var(--color-text-3)] leading-relaxed">
          <div className="text-[12.5px]">
            사이트별 발행 글 현황과 각 글에 적용된 어필리에이트 링크를 한눈에 관리합니다.
            새로 발행된 글은 새로고침 시 자동으로 목록에 추가되고, 인라인으로 어필리에이트를 바로 추가할 수 있습니다.
          </div>
        </div>
      </Card>

      {summaries.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-[13px] text-[color:var(--color-text-3)]">
            등록된 사이트가 없습니다.
          </div>
        </Card>
      ) : (
        <AffiliateClient sites={summaries} />
      )}
    </div>
  )
}
