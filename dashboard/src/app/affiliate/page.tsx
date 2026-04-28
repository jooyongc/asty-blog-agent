import { listSites } from '@/lib/sites'
import { fetchPosts, fetchAffiliate, type Post, type AffiliateExport } from '@/lib/api-client'
import { Card, CardHead } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { AffiliateInsertForm } from './affiliate-form'

export const dynamic = 'force-dynamic'

type SitePosts = {
  site_id: string
  site_url: string
  posts: Post[]
  affiliate: AffiliateExport | null
}

export default async function AffiliatePage() {
  const sites = await listSites()
  const data: SitePosts[] = []
  for (const s of sites) {
    const [pe, aff] = await Promise.all([fetchPosts(s, 365), fetchAffiliate(s)])
    if (!pe) continue
    const published = pe.posts.filter((p) => p.status === 'published')
    data.push({ site_id: s.site_id, site_url: s.site_url, posts: published, affiliate: aff })
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHead>
          <Icons.Layers size={14} />
          <div className="text-[13.5px] font-semibold">어필리에이트 수동 삽입</div>
        </CardHead>
        <div className="px-4 py-3 text-[12px] text-[color:var(--color-text-3)] leading-relaxed">
          <div className="mb-2 text-[12.5px]">발행된 글에 어필리에이트 링크를 직접 추가합니다. 본문 내 키워드 첫 등장 위치가 <code>[앵커](URL)</code> 형태로 치환됩니다.</div>
          <ul className="list-disc list-inside space-y-1">
            <li>키워드는 대소문자 구분 없이 단어 경계 매칭됩니다 (예: "klook" → "Klook" 매치).</li>
            <li>같은 URL이 본문에 이미 있으면 중복 삽입하지 않습니다 (멱등성).</li>
            <li>현재 사이트에 등록된 provider가 있으면 아래 단축버튼으로 채워넣을 수 있습니다.</li>
          </ul>
        </div>
      </Card>

      {data.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-[13px] text-[color:var(--color-text-3)]">
            발행된 글이 있는 사이트가 없습니다.
          </div>
        </Card>
      ) : (
        <AffiliateInsertForm sites={data} />
      )}
    </div>
  )
}
