import type { Category } from '@/lib/catalog-types';

export interface CategoryMeta {
  id: Category;
  name: string;
  blurb: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'market', name: '시세', blurb: '주식·지수·ETF·파생·채권·금 시세, 상장종목' },
  { id: 'stock', name: '주식', blurb: '발행·배당·대차·권리일정·크라우드펀딩' },
  { id: 'bond', name: '채권·단기금융', blurb: '채권 발행·권리행사·대차, CP·CD, REPO' },
  { id: 'corp', name: '기업·공시', blurb: '기업 개요·재무제표·공시·지배구조' },
  { id: 'product', name: '금융상품·보험', blurb: '펀드·ISA·퇴직연금·실손·자동차보험·서민금융' },
  { id: 'fnco', name: '금융회사', blurb: '금융회사 개요·재무·부보, 파산금융회사, 공매자산' },
  { id: 'stats', name: '금융통계', blurb: '은행·보험·카드·저축은행·증권사 업권별 통계' },
  { id: 'mortgage', name: '주택금융', blurb: '모기지론(MBS) 발행·상환·잔액, 주택연금' },
  { id: 'sb', name: '개인사업자', blurb: '개인사업자 기본·재무·금융·평가 통계' },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryMeta(id: Category): CategoryMeta {
  return BY_ID.get(id) ?? { id, name: id, blurb: '' };
}

export function isCategory(value: string): value is Category {
  return BY_ID.has(value as Category);
}
