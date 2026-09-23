/**
 * 데이터셋 카탈로그 스키마.
 *
 * `data/catalog.json` 은 이 타입의 배열이며, `scripts/build-catalog.py` 가 생성한다.
 * 앱은 이 카탈로그만 보고 모든 데이터셋의 조회 화면(파라미터 입력 폼 + 결과 표)을 자동 생성하므로,
 * 필드 하나하나가 실제 호출 가능한 값과 정확히 일치해야 한다.
 */

export type Category = 'market' | 'stock' | 'bond' | 'corp' | 'fnco' | 'stats' | 'product' | 'mortgage' | 'sb';

export interface OpParam {
  /** 실제 쿼리스트링 키 */
  name: string;
  /** 한글 라벨 */
  label: string;
  required: boolean;
  /** 입력창 placeholder 예시 */
  sample?: string;
  /** serviceKey/pageNo/numOfRows/resultType 처럼 lib/upstream.ts 가 채우는 값이면 true — 입력 폼에서 숨긴다 */
  system?: boolean;
}

export interface OpField {
  /** 응답 원문 필드명 (영문) */
  name: string;
  /** 한글 라벨 */
  label: string;
}

export interface Op {
  /** 오퍼레이션 경로 마지막 조각 (예: getStockPriceInfo_V2) */
  id: string;
  /** 오퍼레이션 한글명 */
  name: string;
  /** 전체 요청 URL (예: 'https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2') */
  endpoint: string;
  params: OpParam[];
  fields: OpField[];
}

export interface Dataset {
  /** data.go.kr publicDataPk */
  id: string;
  /** '금융위원회_' 접두어를 뗀 제목 */
  title: string;
  desc: string;
  category: Category;
  /** data.go.kr 상세 페이지 */
  sourceUrl: string;
  ops: Op[];
}
