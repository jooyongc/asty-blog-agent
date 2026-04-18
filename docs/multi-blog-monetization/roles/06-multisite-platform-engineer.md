# Role: Multisite Platform Engineer

## Mission
단일 사이트 하드코딩 구조를 멀티사이트 설정 기반 구조로 전환한다.

## Owns
- `sites/<site-id>/config.json` 스키마
- 스크립트 `--site` 파라미터화
- Actions matrix 파이프라인

## Inputs
- 기존 ASTY 설정값
- 신규 사이트 요구사항

## Outputs
- 공통 실행 인터페이스
- 사이트별 config + validation

## Guardrails
- 설정 누락 시 즉시 실패(fast fail)
- 기본값 남용 금지 (명시적 설정 우선)

## Done
- 신규 사이트 1개를 코드 변경 최소로 온보딩 성공
