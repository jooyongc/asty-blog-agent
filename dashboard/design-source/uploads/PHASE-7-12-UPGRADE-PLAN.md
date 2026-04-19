# Multi-Blog Autonomous Agent System — Phase 7~12 Upgrade Plan v1.0

- 기준일: 2026-04-19 (KST)
- 선행 상태: Phase 1~6 기반 파이프라인 완료
- 문서 목적: 자율 운영(원클릭 승인), 검증 강화(Verifier), Graph RAG 기반 확장, UX 고도화, 멀티사이트 협업

## 1) Executive Summary

이 계획의 핵심은 "사람이 매번 쓰고 검수하는 시스템"에서 "에이전트가 준비하고 사람이 승인만 하는 시스템"으로 전환하는 것이다.

확정된 운영 원칙:
- 발행 방식: 대시보드 원클릭 승인 (Approve 1회)
- 예산 상한: 사이트당 월 $5
- Graph RAG: Phase 8에서 구조/스키마/적재만 구현, 활성 활용은 Phase 10 이후 의사결정
- 긴급 선결: 썸네일 누락 + 블로그 로딩 지연

## 2) Current Gaps (사용자 개입 지점)

현재 자동화 파이프라인은 동작하지만 아래 지점에서 수동 개입이 남아 있다.

1. 발행 전 품질 확인 수작업
2. 주장 검증(팩트체크) 수작업
3. 주제 선정 수작업(디렉션 → 토픽 변환)
4. 예약/승인 큐 확인 수작업
5. 내부 링크 전략 수작업
6. 성과 기반 리라이트 수작업
7. 멀티사이트 주제 충돌 조정 수작업
8. 에이전트 피드백 학습 반영 수작업

## 3) Upgrade Architecture (Phase 7~12)

```text
[Direction Input]
  -> [Director]
  -> [SEO Researcher]
  -> [Writer]
  -> [Verifier]
  -> [Translate + Glossary]
  -> [Packager + Schema]
  -> [Internal Linker (Graph-assisted)]
  -> [Publish Queue]
  -> [Human Approve (1 click)]
  -> [Publisher + Graph Extraction]
  -> [GSC/GA Feedback]
  -> [Portfolio Strategist (multi-site)]
```

## 4) Phase-by-Phase Plan

## Phase 7 (2026-04-20 ~ 2026-05-03): Production Fix + Verifier 도입

목표:
- 프로덕션 이슈 2건 즉시 해결
- 크로스 에이전트 검증(Verifier) 도입

### 7-1. 썸네일 누락 수정

범위:
- 사이트 레포 `src/app/[locale]/blog/page.tsx`
- 에이전트 레포 `scripts/publish.ts`
- DB 백필 1회

실행:
1. 목록 페이지에서 `featuredImageUrl` NULL 시 카테고리 fallback 이미지 적용
2. 발행 시 `featured_image.url`이 `blog_posts.featured_image_url`에 반드시 기록되도록 방어코드 추가
3. 기존 NULL row 백필 SQL 실행

DoD:
- `/en/blog` 카드 100% 이미지 표시
- NULL 비율 0% (기존 데이터 기준)

### 7-2. 로딩 지연 수정

범위:
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/blog/[slug]/page.tsx`
- `src/app/[locale]/blog/loading.tsx`

실행:
1. 목록 페이지 `force-dynamic` 제거, `revalidate = 60`
2. 상세 페이지에서 related posts 쿼리를 `<Suspense>` 하위 분리
3. skeleton 기반 `loading.tsx` 추가

SLO:
- `/en/blog` TTFB < 400ms (warm 기준)
- `/en/blog/<slug>` first content render 체감 개선

### 7-3. Verifier 에이전트 신설

신규:
- `.claude/agents/verifier.md`
- `scripts/verify-draft.ts`

DB:
- `010_phase7.sql`

```sql
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS verification_status text
    CHECK (verification_status IN ('verified','partial','skipped','blocked'))
    DEFAULT 'skipped',
  ADD COLUMN IF NOT EXISTS verification_report jsonb;
```

파이프라인 변경:
- `weekly`: Writer -> Verifier -> Packager
- `unsupported >= 1`: writer 1회 자동 재작성(hedging)
- `contradicted >= 1`: queue status를 `blocked`로 설정하고 사람 검토 대기

DoD:
- draft별 `verification.json` 생성
- 의도적 오류 claim 주입 시 `blocked` 동작 확인

예상 비용:
- +$0.5/site/month

## Phase 8 (2026-05-04 ~ 2026-06-07): Graph RAG Foundation

목표:
- Graph 스키마/적재/조회 기반만 구축 (활성 활용은 보류)

### 8-1. Graph 스키마

마이그레이션:
- `011_graph.sql`

핵심 테이블:
- `graph_entities`
- `graph_relationships`

원칙:
- `site_id IS NULL` = 글로벌 엔티티
- `site_id = <id>` = 사이트 로컬 엔티티

### 8-2. 엔티티 추출 파이프라인

신규:
- `scripts/extract-entities.ts`

입력:
- 발행된 본문 + `verification.json`

출력:
- entity/relationship upsert

호출 정책(예산 보호):
- 기본: "격주 모드" (2편당 1회) 권장
- 고정밀 모드: 편당 1회 (옵션)

### 8-3. Read API

신규:
- `src/app/api/admin/graph/export/route.ts`

요구:
- `GET /api/admin/graph/export?entity=<name>&hops=2`
- Bearer 인증
- 2-hop subgraph JSON 응답

### 8-4. 문서화

신규:
- `docs/GRAPH-RAG.md`

포함:
- 엔티티/관계 정의
- 운영 가이드
- 활성화 의사결정 체크리스트

DoD:
- 10편 기준 `entities >= 50`, `relationships >= 100`
- API p95 < 300ms

예상 비용:
- 기본 모드(격주 추출): +$0.9/site/month
- 고정밀 모드(편당 추출): +$1.8/site/month

## Phase 9 (2026-06-08 ~ 2026-06-28): 원클릭 승인 + 자율 큐

목표:
- 주간 실행이 "대기열 생성"까지 완전 자율 진행
- 사용자는 Approve 1회만 수행

### 9-1. Director + Topic Queue

신규:
- `.claude/agents/director.md`
- `topic_queue` 테이블

역할:
- 사용자 자유텍스트 디렉션 -> 실행 가능한 주제 3개로 변환

### 9-2. Publish Review Queue

신규 테이블:
- `publish_queue`

신규 API:
- `POST /api/admin/queue/approve/:slug`
- `POST /api/admin/queue/reject/:slug`

요구:
- 3언어 미리보기
- 품질 점수 + 검증 상태 표시
- Reject 사유는 writer 피드백 루프에 저장

### 9-3. Budget Guard

신규:
- `scripts/budget-guard.ts`
- `agent_costs` 테이블

룰:
- $4.5 초과: 경고
- $5.0 초과: 사이클 자동 중단

### 9-4. 대시보드 승인 UI

신규:
- `dashboard/src/app/sites/[id]/queue/page.tsx`
- `dashboard/src/app/sites/[id]/queue/[slug]/page.tsx`
- `dashboard/src/app/api/approve/[slug]/route.ts`

DoD:
- 사람 개입 없이 "Ready to approve" 카드까지 생성
- Approve 1회로 발행 완료
- 예산 초과 시 자동 halt 검증

예상 비용:
- +$0.5/site/month

## Phase 10 (2026-06-29 ~ 2026-07-19): SEO Max + Graph 첫 활용

목표:
- GSC 연동과 내부 링크 자동화로 검색 성과 개선

### 10-1. GSC 연동

신규:
- `src/lib/gsc.ts`
- `src/app/api/admin/gsc/export/route.ts`
- `scripts/pull-gsc.ts`

규칙:
- `seo-researcher`가 striking distance(8~20위) 우선 타깃

### 10-2. Internal Linker

신규:
- `scripts/internal-linker.ts`

동작:
- CO_OCCURS 기반 관련 포스트 추천
- 글당 3~5개 내부링크 자동 삽입
- 트래픽 상위 링크 우선

### 10-3. Schema 고도화

확장:
- `generate-schema.ts`
  - `FAQPage` 자동 생성
  - `HowTo` 패턴 감지
  - `mentions`에 그래프 엔티티 반영

### 10-4. 임베딩 활성화 의사결정

옵션:
- Voyage AI 권장(저비용)
- OpenAI embedding 대안 유지

결정 게이트:
- Phase 10 시작 시 1회 결정
- 비활성화 가능하도록 feature flag 적용

DoD:
- 신규 글 내부링크 3개 이상
- GSC 대시보드 조회 가능
- striking distance 개선 케이스 최소 1건

예상 비용:
- GSC API: $0
- 임베딩: 최대 +$0.5/site/month

## Phase 11 (2026-07-20 ~ 2026-08-09): Dashboard UX Overhaul

목표:
- "최소 디렉션" UX 완성

### 11-1. Direction 화면

신규:
- `dashboard/src/app/sites/[id]/direction/page.tsx`

기능:
- 자유텍스트 입력
- Director가 주제 3개 제안
- 카드별 👍/👎 저장

### 11-2. Quality Loop 시각화

대상:
- `dashboard/src/app/sites/[id]/queue/page.tsx`

기능:
- 단계 타임라인(SEO -> Writer -> Verifier -> Translate -> Package -> Ready)
- 단계별 원문/경고 확인

### 11-3. Graph Explorer

신규:
- `dashboard/src/app/graph/page.tsx`

기능:
- 2D 그래프 시각화
- 엔티티 검색
- 사이트/타입 필터

### 11-4. Feedback 학습 루프

신규 테이블:
- `agent_feedback`

동작:
- 최근 피드백 5개를 director few-shot 컨텍스트로 주입

DoD:
- 신규 사이트를 대시보드만으로 E2E 운영 가능
- 500 노드 렌더링 성능 수용
- 👎 피드백 반영 로그 확인

예상 비용:
- +$0.2/site/month

## Phase 12 (2026-08-10 ~ 2026-08-30): Multi-site Collaboration

목표:
- 사이트 간 주제 중복 방지 + 학습 전파

### 12-1. Portfolio Strategist

신규:
- `.claude/agents/portfolio-strategist.md`

역할:
- 사이트별 주간 주제 배분 최적화
- 키워드 카니발리제이션 방지

### 12-2. Cross-site Learning

신규:
- `scripts/cross-site-learning.ts`
- `site_learnings` 테이블

동작:
- 고성과 패턴 추출 -> 타 사이트 writer few-shot으로 전파

### 12-3. Shared Graph 활용

규칙:
- 전역 엔티티(`site_id IS NULL`) 기반 공통 맥락 공유

### 12-4. Portfolio 화면

신규:
- `dashboard/src/app/portfolio/page.tsx`

기능:
- 사이트 x 엔티티 매트릭스
- 크로스사이트 학습 타임라인
- 통합 예산 추적

DoD:
- `site-b` config 추가만으로 편입
- 2주 운영 시 주제 중복 0건
- 사이트 간 학습 반영 사례 1건 이상

예상 비용:
- +$0.3/site/month (2-site 기준 평균화)

## 5) Budget Plan (사이트당 월 $5 상한 대응)

기본 누적 추정(Phase 12 풀옵션): 약 $5.8/site/month

상한 준수 운영 프로파일:

1. Lean Profile (권장, $4.4~$4.9)
- Graph 추출: 격주
- 임베딩: OFF (필요 시 ON)
- Director/Verifier 유지

2. Standard Profile ($5.0~$5.3)
- Graph 추출: 주 1회
- 임베딩: ON
- 피드백 루프 유지

3. Full Profile ($5.5+)
- 모든 기능 상시 ON
- 예산상한 초과 가능, 전략 사이트만 선택 적용

예산 제어 규칙:
- 사이트별 프로파일을 `sites/<site-id>/config.json`에 명시
- `budget-guard.ts`가 호출 전 차단
- 월말 7일 전 자동 다운시프트(Full -> Lean)

## 6) Dependency & Delivery Order

```text
Phase 7 ─┬─> Phase 8 ─┬─> Phase 10
         │             │
         └─> Phase 9 ──┴─> Phase 11 ─> Phase 12
```

실행 순서:
1. Phase 7 선행(긴급 이슈)
2. Phase 8/9 병렬 가능
3. Phase 10은 Phase 8 완료 후 착수
4. Phase 11은 Phase 9 완료 후 착수
5. Phase 12는 site-b 온보딩 시점에 시작

## 7) Repo-by-Repo File Plan

### A. `asty-blog-agent-lean`

신규:
- `.claude/agents/verifier.md`
- `.claude/agents/director.md`
- `.claude/agents/portfolio-strategist.md`
- `scripts/verify-draft.ts`
- `scripts/extract-entities.ts`
- `scripts/budget-guard.ts`
- `scripts/pull-gsc.ts`
- `scripts/internal-linker.ts`
- `scripts/cross-site-learning.ts`
- `docs/GRAPH-RAG.md`

수정:
- `.claude/commands/weekly.md`
- `.claude/agents/writer.md`
- `.claude/agents/seo-researcher.md`

### B. `asty-cabin` (site)

신규:
- `src/app/api/admin/graph/export/route.ts`
- `src/app/api/admin/gsc/export/route.ts`
- `src/app/api/admin/queue/approve/[slug]/route.ts`
- `src/app/api/admin/queue/reject/[slug]/route.ts`
- `src/app/[locale]/blog/loading.tsx`
- `src/lib/gsc.ts`
- `drizzle/migrations/010_phase7.sql` ~ `016_phase12.sql`

수정:
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/blog/[slug]/page.tsx`
- `src/lib/db/schema.ts`

### C. `dashboard`

신규:
- `src/app/sites/[id]/direction/page.tsx`
- `src/app/sites/[id]/queue/page.tsx`
- `src/app/sites/[id]/queue/[slug]/page.tsx`
- `src/app/graph/page.tsx`
- `src/app/portfolio/page.tsx`
- `src/app/api/direction/route.ts`
- `src/app/api/approve/[slug]/route.ts`

## 8) E2E Acceptance Scenario (Phase 12)

1. `/sites/asty-cabin/direction`에서 자유 텍스트 입력
2. Director가 3개 주제 제안, 사용자 1개 긍정 피드백
3. 에이전트가 SEO -> Writer -> Verifier -> Translate -> Package -> Internal link 자동 진행
4. `/sites/asty-cabin/queue`에서 3언어 미리보기 확인
5. Approve 1회로 발행 및 그래프 갱신
6. `/graph`에서 엔티티 관계 확인
7. 2주 후 GSC 데이터 반영 및 내부 링크 개선
8. `site-b` 추가 후 포트폴리오 전략 자동 조정

## 9) Immediate Start Pack (승인 즉시)

다음 2개는 즉시 착수 가능:

1. 썸네일 fallback 통일 (약 30분)
2. 로딩 개선(force-dynamic 제거 + Suspense + loading.tsx, 약 1시간)

다음 단계:
- Verifier 개발(최소 1일)
- 이후 Graph foundation 착수

## 10) Change Control

- 본 문서는 Phase 7~12 기준 계획 베이스라인이다.
- 변경 시 버전 증가 규칙: `v1.0 -> v1.1 -> v1.2`
- 예산/스키마/API 변경은 반드시 DoD와 마이그레이션 번호를 함께 업데이트한다.
