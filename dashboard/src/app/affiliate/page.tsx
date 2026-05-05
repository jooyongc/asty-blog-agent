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
          <div className="mb-2 text-[12.5px]">여러 글에 여러 어필리에이트 링크를 한 번에 삽입합니다. 글마다 다른 provider/키워드 조합을 적용할 수 있습니다.</div>
          <ul className="list-disc list-inside space-y-1">
            <li><b>구조</b>: 사이트 1개 선택 → 글 N개 그룹 → 각 그룹 안에 어필리에이트 N개 → 일괄 처리</li>
            <li><b>EN</b>: 키워드 첫 등장 위치를 인라인 치환 (단어 경계, 대소문자 무시)</li>
            <li><b>JA / ZH</b>: 본문 끝에 단독 CTA 추가 (영문 키워드는 번역 본문에 없으므로)</li>
            <li>같은 URL이 본문에 이미 있으면 중복 삽입하지 않음 (멱등성)</li>
            <li>지원 provider: <b>Klook · KKday · Viator · 세시간전</b></li>
            <li>한 번 삽입한 링크는 자동으로 저장되어 다음에 클릭으로 재사용 가능 (활성 글 그룹에 추가됨)</li>
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
