# 금융나우 (kr-finance-now)

금융위원회가 공공데이터포털에 공개한 오픈API 110종(조회 오퍼레이션 349개)을 한 사이트에서 검색·조회한다.

- 배포: https://kr-finance-now.vercel.app
- `data/catalog.json` 한 벌로 모든 데이터셋의 조회 폼과 결과 표를 자동 생성한다(`/d/[publicDataPk]`).
- 카탈로그 갱신: `npm run catalog` (`scripts/raw/apis.json` → `data/catalog.json`)
- env: `DATA_GO_KR_KEY` — 공공데이터포털 **인코딩 키를 그대로**(재인코딩하면 code 30)

## 구조

| 경로 | 역할 |
|---|---|
| `scripts/raw/apis.json` | data.go.kr 상세페이지 swagger/표에서 뽑은 원본 조사 결과 |
| `scripts/build-catalog.py` | 분류·한글 라벨 생성 → `data/catalog.json` |
| `lib/upstream.ts` | data.go.kr 호출(1시간 캐시) |
| `lib/parse.ts` | JSON/XML·BOM·게이트웨이 오류를 한 모양으로 |
| `lib/market.ts` | 홈 화면 주요 지수(코스피·코스닥·코스피200) |
