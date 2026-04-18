# Multi-Blog Monetization AI Agent System — Development Plan v1.1

- Updated on: 2026-04-18 (KST)
- Base pilot: ASTY Cabin (`asty-blog-agent-lean`)
- Planning horizon: 8 weeks (Phase 1~6)

## 1) Goal and Scope

ASTY Cabin 파일럿을 "검증된 레퍼런스"로 고정한 뒤, 설정 중심(config-first) 구조로 확장해 다수 블로그에 재사용 가능한 수익화 에이전트 시스템을 구축한다.

핵심 가치:
- 콘텐츠 생산 자동화 (주제 선정 → 작성 → 번역 → 발행)
- 수익화 자동화 (어필리에이트 삽입, CTA 표준화)
- 성과 학습 자동화 (GA/GSC 피드백 루프)
- 운영 단일화 (통합 대시보드 + 멀티사이트 매트릭스)

## 2) Current Snapshot (ASTY Pilot)

완료:
- `writer` 에이전트 (EN 원문)
- `scripts/translate.ts` (DeepL JA/ZH)
- `scripts/enforce-glossary.ts`
- `scripts/fetch-image.ts`
- `packager` 에이전트 (`meta.json`)
- `scripts/publish.ts` (사이트 API 발행 + 아카이브 이동)
- 주간 워크플로우 구조 (`.github/workflows`)

블로킹:
- `scripts/publish.ts` preflight에서 `factcheck: passed` 미충족 시 발행 중단
- `content/drafts/*/meta.json`의 `publish_at: null`
- 사이트 레포에 GA4 미설치 (보고)
- DeepL glossary는 JA 중심, ZH는 사전 강제교정 기반 운영

## 3) Non-Negotiables (운영 원칙)

- Lean 비용 규율 유지: 기본 작성 파이프라인은 2 agents (`writer`, `packager`) 유지
- 모델 가드레일: 기본 Haiku 계열, `/polish`에서만 상위 모델 허용
- 기사당 검색 횟수 제한 및 재시도 루프 금지
- 스케줄 발행은 항상 미래 시각(최소 2시간 이후)
- 미검증 정보는 단정 대신 완곡/범위 표현 사용

## 4) Target Architecture (v2)

```text
[Topic Intake]
  -> [SEO Researcher]
  -> [Writer]
  -> [Translate + Glossary Enforcement]
  -> [Packager + Schema]
  -> [Affiliate Inserter]
  -> [Publisher]
  -> [GA/GSC Collector]
  -> [Dashboard + Weekly Insights]
```

설계 원칙:
- 에이전트는 판단/생성, 스크립트는 반복/검증 담당
- 사이트 종속값은 `sites/<site-id>/config.json`로 분리
- 모든 스크립트는 `--site <site-id>`를 1급 인자로 지원

## 5) Phase Plan (보완안)

## Phase 1 (1~2일): Launch Unblock + First Publish

목표:
- 3개 기존 드래프트를 실제 URL로 발행

작업:
1. `scripts/publish.ts`의 `factcheck` preflight 정책 완화
2. 3개 draft의 `publish_at` 채우기
3. 3개 slug 순차 발행
4. 사이트 레포에 GA4 태그 설치

권장 적용 방식:
- `factcheck` 체크는 삭제보다 "허용 목록" 방식 권장
- 예: `passed | auto-passed | pending` 중 허용값을 config로 제어

완료 기준:
- `/en/blog/<slug>`, `/ja/blog/<slug>`, `/zh-hans/blog/<slug>` 모두 200
- `content/published/`에 3개 slug 이동
- GA Realtime에서 최소 1개 이벤트 수신 확인

## Phase 2 (1주): SEO 강화

목표:
- 키워드 중심 주제 선정 및 문서 구조 일관화

작업:
1. `.claude/agents/seo-researcher.md` 추가
2. `writer` 프롬프트에 `primary_keyword` 반영 규칙 추가
3. `scripts/generate-schema.ts` 추가 (Article/Breadcrumb/FAQ JSON-LD)
4. `meta.json`에 `schema` 필드 저장

완료 기준:
- `topics/this-week.md`에 키워드 컬럼 포함
- 신규 draft마다 schema 생성/검증 통과

## Phase 3 (1주): Affiliate Layer

목표:
- 카테고리별 어필리에이트 링크를 안전하게 자동 삽입

작업:
1. `affiliate/links.json` 정의
2. `scripts/insert-affiliate.ts` 구현
3. 글당 최대 3개 링크, 본문 자연문맥 삽입
4. CTA 템플릿을 카테고리별 표준화

완료 기준:
- EN 본문 첫 매칭 위치 링크 삽입 성공
- JA/ZH 앵커 동기화 규칙 적용
- 링크 과다삽입 방지 테스트 통과

## Phase 4 (2주): Admin Dashboard

목표:
- 발행/성과/수정 워크플로우를 사이트 관리자 화면으로 통합

작업:
1. `/admin` UI 확장 (상태, 조회수, 체류시간, 편집)
2. API 추가: posts list/update, analytics proxy
3. GA4 Data API 서버 연동

완료 기준:
- 관리 페이지에서 글 수정 후 재발행 가능
- 글별 KPI(조회수/평균체류시간) 확인 가능

## Phase 5 (2~4주): Multi-Site Platform

목표:
- 설정 추가만으로 신규 블로그 온보딩 가능

작업:
1. `sites/<site-id>/config.json` 구조 도입
2. 핵심 스크립트 전부 `--site` 파라미터화
3. GitHub Actions matrix 전략 도입
4. 사이트별 지표를 단일 집계 대상(시트/DB)로 통합

완료 기준:
- `site-b` 샘플 추가 후 동일 파이프라인 dry-run 성공

## Phase 6 (상시): Intelligence Feedback Loop

목표:
- 성과 데이터 기반 자동 개선

작업:
1. 고성과/저성과 분류 및 주제 재학습
2. A/B 헤드라인 실험 자동화
3. `/refresh <slug>` 리프레시 워크플로우

완료 기준:
- 주간 보고서에 "유지/확대/리라이트" 추천이 자동 생성

## 6) Role Model (개발 역할 분리)

역할 파일은 `docs/multi-blog-monetization/roles/`에 정의:
- Program Manager
- Phase 1 Release Engineer
- SEO Researcher
- Content/Schema Engineer
- Affiliate Monetization Engineer
- Dashboard Analytics Engineer
- Multisite Platform Engineer
- Growth Feedback Analyst
- QA Reliability Guardian

## 7) Execution Prompt Pack

실행 프롬프트는 `docs/multi-blog-monetization/prompts/`에 정의:
- `00-master-orchestrator.md`
- `phase-1-hotfix-and-publish.md`
- `phase-2-seo-and-schema.md`
- `phase-3-affiliate-layer.md`
- `phase-4-dashboard-and-ga.md`
- `phase-5-multisite-refactor.md`
- `phase-6-feedback-loop.md`

## 8) Risks and Mitigations

1. 발행 실패 반복
- 완화: preflight를 "중단"보다 "경고+정책"으로 전환

2. 번역 품질 편차
- 완화: glossary + 금칙어/표기 룰 기반 자동 교정 유지

3. 수익화 링크 과삽입
- 완화: 문서당 상한(3), 문맥점수 기반 삽입, nofollow/sponsored 정책

4. 멀티사이트 확장 시 설정 누락
- 완화: `config.schema.json` 도입 + CI validation

5. 분석 API 쿼터 초과
- 완화: 집계 캐시(일 단위), 대시보드 조회 TTL

## 9) 14-Day Practical Sprint (권장)

- 2026-04-18 ~ 2026-04-19: Phase 1 hotfix + 첫 발행
- 2026-04-20 ~ 2026-04-26: Phase 2 SEO/Schema
- 2026-04-27 ~ 2026-05-03: Phase 3 Affiliate

이후:
- 2026-05-04 ~ 2026-05-17: Phase 4
- 2026-05-18 ~ 2026-06-14: Phase 5
- 2026-06-15 이후: Phase 6 지속 운영

## 10) Definition of Success

- 4주 내: "주제→발행" 자동 루프 + GA 기반 리포트 운영
- 8주 내: 두 번째 사이트 온보딩 완료
- 12주 내: 성과기반 리라이트 자동 큐 운영
