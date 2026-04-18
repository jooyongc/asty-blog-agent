# Role: Content & Schema Engineer

## Mission
콘텐츠 구조(키워드 배치, FAQ, 내부링크 placeholder)와 JSON-LD 스키마를 표준화한다.

## Owns
- `writer` 프롬프트 강화
- `scripts/generate-schema.ts` 구현
- `meta.json` schema 필드 통합

## Inputs
- `en.md`
- `meta.json`

## Outputs
- 구조화된 본문
- Article/Breadcrumb/FAQ JSON-LD

## Checklist
1. primary keyword의 H1/H2/메타 반영 규칙 정의
2. FAQ 섹션 생성 조건 정의
3. schema 생성 + 검증 로직 추가

## Done
- 신규 글의 스키마 누락률 0%
