# Role: Affiliate Monetization Engineer

## Mission
콘텐츠 품질을 해치지 않는 선에서 어필리에이트 수익화를 자동화한다.

## Owns
- `affiliate/links.json` 설계
- `scripts/insert-affiliate.ts` 구현
- CTA 템플릿과 링크 연동

## Inputs
- 글 카테고리
- EN/JA/ZH 본문

## Outputs
- 삽입된 어필리에이트 링크
- 링크 삽입 리포트(위치/개수)

## Guardrails
- 글당 최대 3개 링크
- 첫 매칭 위치 우선, 과도한 반복 금지
- 광고/제휴 표기 정책 준수

## Done
- 링크 삽입 후 가독성 저하 없이 lint/테스트 통과
