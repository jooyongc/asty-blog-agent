# 운영 시작 체크리스트

ASTY Cabin 블로그 에이전트 Lean 버전 론칭 순서. 전체 소요 시간 약 2시간.

---

## 🔴 Phase 0: 보안 조치 (5분, 즉시)

- [ ] Unsplash Access Key 회전
      https://unsplash.com/oauth/applications → Application 860026 → Regenerate
- [ ] 새 Unsplash Access Key를 `.env`에만 저장 (채팅/이메일 금지)
- [ ] DeepL API 키 발급 → `.env`에만 저장
      https://www.deepl.com/account/summary (Free 플랜으로 충분)
- [ ] Anthropic API 키 발급 → `.env`에만 저장
      https://console.anthropic.com/settings/keys

---

## 🟡 Phase 1: 지출 하드 캡 설정 (5분, 매우 중요)

Anthropic Console에서 반드시 설정:
- [ ] https://console.anthropic.com/settings/limits 접속
- [ ] "Spend limits" → "Change Limit" → `$15` 입력 → 저장
- [ ] 확인: 이 캡을 넘으면 API 호출 자체가 거부됨 (과금 차단)

DeepL 계정:
- [ ] Free 플랜이라 자동 과금 없음. Pro 업그레이드 창 뜨더라도 무시
- [ ] 월 500k자 초과 시 자동으로 거부됨 (과금 아님)

Unsplash:
- [ ] Free 플랜. 시간당 50회 rate limit. 과금 없음

요약: Anthropic만 신경쓰면 됨. `$15` 캡이 안전망.

---

## 🟢 Phase 2: 사이트 쪽 작업 (60분, Claude Code로)

### 2-1. `asty-cabin` 레포 클론 & Claude Code 실행
```bash
git clone https://github.com/jooyongc/asty-cabin
cd asty-cabin
npm install -g @anthropic-ai/claude-code
claude
```

### 2-2. 지시서 전달
- [ ] `site-files/APPLY-TO-SITE.md` 내용 전체를 Claude Code에 붙여넣기
- [ ] Step 1부터 순차 진행, 각 단계마다 사용자 확인

### 2-3. 완료 확인
- [ ] `blog_posts`, `blog_post_translations`, `blog_categories` 테이블 생성됨
- [ ] `/api/admin/posts/multilang` 엔드포인트 헬스체크 통과
- [ ] AGENT_API_KEY 생성되어 Cloudflare Secret으로 등록됨
- [ ] AGENT_API_KEY 값을 안전한 경로로 받아서 에이전트 `.env`에 저장 준비

---

## 🔵 Phase 3: 에이전트 레포 구축 (30분)

### 3-1. 새 GitHub 레포 생성
- [ ] `asty-blog-agent` (또는 원하는 이름) 레포 생성. **Private 추천**
- [ ] `asty-blog-agent-lean.zip` 풀어서 커밋

### 3-2. 환경변수 설정 (로컬 `.env`)
- [ ] `ANTHROPIC_API_KEY` — Phase 0에서 발급
- [ ] `DEEPL_API_KEY` — Phase 0에서 발급
- [ ] `UNSPLASH_ACCESS_KEY` — Phase 0에서 회전한 키
- [ ] `ASTY_SITE_URL=https://asty-cabin-check.vercel.app` (또는 production URL)
- [ ] `ASTY_AGENT_API_KEY` — Phase 2에서 받은 값
- [ ] `DEEPL_GLOSSARY_JA_ID`, `DEEPL_GLOSSARY_ZH_ID` — 빈값 (다음 스텝에서 채움)

### 3-3. 초기화
```bash
npm install
npx tsx scripts/setup-glossaries.ts
# 출력된 2개 ID를 .env의 DEEPL_GLOSSARY_JA_ID / DEEPL_GLOSSARY_ZH_ID에 붙여넣기
```

### 3-4. GitHub Secrets 등록 (Actions 쓸 경우만)
- Settings → Secrets and variables → Actions → New repository secret
- [ ] `ANTHROPIC_API_KEY`
- [ ] `DEEPL_API_KEY`
- [ ] `DEEPL_GLOSSARY_JA_ID`
- [ ] `DEEPL_GLOSSARY_ZH_ID`
- [ ] `UNSPLASH_ACCESS_KEY`
- [ ] `ASTY_SITE_URL`
- [ ] `ASTY_AGENT_API_KEY`

---

## 🟣 Phase 4: 첫 수동 테스트 (30분)

목표: end-to-end 한 편 성공시키기.

### 4-1. 주제 1개 수동 추가
```bash
# topics/manual-queue.md 열고 priority:high로 한 줄 추가
- [ ] K-beauty 클리닉 3곳 추천 (English-speaking, near ASTY)  #beauty  priority:high
```

### 4-2. 로컬에서 실행
```bash
claude --model claude-haiku-4-5

# Claude Code 내에서:
> /weekly
```

### 4-3. 확인
- [ ] `content/drafts/<slug>/en.md` 생성됨 (1200~1600단어)
- [ ] `ja.md`, `zh.md` 생성됨 (DeepL 번역)
- [ ] `meta.json` 생성됨 (3언어 메타데이터)
- [ ] frontmatter의 `review_warnings`가 비어있거나 가벼움
- [ ] frontmatter의 `searches_used` ≤ 3
- [ ] 이미지 URL이 `featured_image.url`에 들어감

### 4-4. 품질 체크 (사람)
- [ ] 영문 글이 자연스럽고 ASTY Cabin 거리 정보가 들어감
- [ ] 일본어가 ですます체로 일관됨
- [ ] 중국어가 简体字로 일관되고 首尔 사용
- [ ] 이미지가 내용과 관련 있음

### 4-5. 게시
```bash
> /publish <slug>
```
- [ ] 사이트에 /en/blog/<slug> 접속 가능
- [ ] /ja/blog/<slug>, /zh-hans/blog/<slug>도 확인

---

## ⚪ Phase 5: 자동화 활성화 (5분)

만족스러우면:
- [ ] GitHub Actions 활성화 (기본으로 켜져 있음)
- [ ] Actions 탭에서 "ASTY Blog Agent (Lean)" 워크플로우 확인
- [ ] 수동 트리거 테스트: "Run workflow" → `command: weekly`
- [ ] 첫 정기 실행은 돌아오는 일요일 21:00 KST

품질 확신 없으면:
- [ ] Actions 비활성화한 채 2~3주 수동 운영
- [ ] 매주 `claude > /weekly` 로컬 실행
- [ ] 충분히 안정되면 Actions 켜기

---

## 📊 운영 시 주간 점검 (5분/주)

매주 월요일:
- [ ] Anthropic Console 지출 확인 https://console.anthropic.com/usage
      기대값: 월 $1~5. $10 근처면 로그 조사
- [ ] DeepL 사용량 확인 https://www.deepl.com/account/usage
      기대값: 월 180k자 미만
- [ ] 지난주 게시된 글 3편 퀄리티 리뷰
- [ ] `glossary/*.csv`에 새 용어 추가 필요한지 확인

매월 1일:
- [ ] `.deepl-usage.json`이 새 달로 리셋되는지 확인
- [ ] `content/_budget.log` 검토 (이상 패턴 있으면 조사)

---

## 🚨 비상 대응

**"Anthropic Console에 $10 넘는 청구가 뜸"**
1. 즉시 https://console.anthropic.com/settings/limits 에서 캡을 $5로 낮추기
2. `content/_budget.log` 확인
3. Actions 비활성화
4. 원인 파악 후 CLAUDE.md의 hard caps 강화

**"번역 품질 급락"**
1. `content/drafts/<slug>/ja.md` frontmatter의 `review_warnings` 확인
2. `glossary/ja.csv` 또는 `zh.csv` 에 누락 용어 추가
3. `npx tsx scripts/setup-glossaries.ts` 재실행 (glossary ID 갱신)
4. 해당 글 재번역: `npx tsx scripts/translate.ts <slug>`

**"Haiku가 글을 너무 짧게 씀"**
1. 특정 주제만 부족 → 해당 주제에 `/polish <slug>` (월 $3 추가 허용)
2. 지속적으로 부족 → `.claude/agents/writer.md`의 model을 `claude-sonnet-4-6`으로 변경
   (비용 $0.15/편 → 약 $2/월 증가, 여전히 $10 이하)

**"사이트 게시 API가 500 반환"**
1. Cloudflare Dashboard → Workers → Logs 확인
2. DATABASE_URL이 pooled connection인지 (포트 6543) 확인
3. AGENT_API_KEY가 양쪽 동일한지 확인
