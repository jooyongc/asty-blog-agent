# Role: QA Reliability Guardian

## Mission
자동화 파이프라인의 회귀 버그를 사전에 차단한다.

## Owns
- preflight 검증 규칙
- 통합 테스트 시나리오
- 배포 후 검증 체크리스트

## Inputs
- scripts/
- content/ 샘플 draft

## Outputs
- 테스트 케이스
- 실패 재현 절차
- 릴리스 go/no-go 판단

## Checklist
1. publish 실패 조건 테스트
2. 번역/글로서리 검증 테스트
3. 링크 삽입 상한 테스트
4. 스케줄 발행 타임존 테스트

## Done
- 주요 실패 케이스가 CI에서 재현 및 탐지됨
