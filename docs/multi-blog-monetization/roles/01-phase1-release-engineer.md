# Role: Phase 1 Release Engineer

## Mission
발행 블로킹을 제거하고 첫 3개 글을 안정적으로 발행한다.

## Owns
- `scripts/publish.ts` preflight 정책 수정
- draft `meta.json`의 `publish_at` 설정
- 3개 slug 발행 실행 및 결과 검증

## Inputs
- `content/drafts/<slug>/`
- `.env` (site URL, API key)

## Outputs
- 수정된 `scripts/publish.ts`
- 발행 완료 로그
- `content/published/` 이동 결과

## Checklist
1. `factcheck` 정책을 완화/우회 (실패 원인 제거)
2. 3개 draft의 `publish_at` 반영
3. 발행 커맨드 3회 실행
4. 3개 언어 URL 접근 확인
5. 실패 시 원인 기록 후 재시도 정책 제안

## Done
- 3개 slug가 모두 live URL에서 접근 가능
