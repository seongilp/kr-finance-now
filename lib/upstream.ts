import 'server-only';

import type { Op } from '@/lib/catalog-types';
import { parseDataGoKr, type ParseResult } from '@/lib/parse';

export type { Row } from '@/lib/parse';

export type QueryResult = ParseResult | { ok: false; reason: 'no-key' | 'network'; message: string };

export interface QueryInput {
  op: Op;
  params: Record<string, string>;
  page: number;
  size: number;
}

// 금융위원회 데이터는 대부분 영업일 D+1 오후 갱신이라 1시간 캐시로 충분하다
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 15_000;

export async function query({ op, params, page, size }: QueryInput): Promise<QueryResult> {
  // data.go.kr 인코딩 키는 이미 퍼센트 인코딩된 상태라 그대로 붙여야 한다(재인코딩하면 code 30)
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return { ok: false, reason: 'no-key', message: '공공데이터포털 인증키가 설정되지 않았습니다.' };

  const qs = [`serviceKey=${key}`, `pageNo=${page}`, `numOfRows=${size}`, 'resultType=json'];
  for (const [k, v] of Object.entries(params)) qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  const url = `${op.endpoint}?${qs.join('&')}`;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await res.text();
    // 게이트웨이 오류(code 30 등)는 HTTP 4xx 로 오면서 본문에 사유가 있으므로 본문부터 해석한다
    const parsed = parseDataGoKr(body);
    if (!res.ok && parsed.ok) {
      return { ok: false, reason: 'upstream', message: `원천 서버가 HTTP ${res.status} 로 응답했습니다.` };
    }
    return parsed;
  } catch (err) {
    console.error('[upstream] fetch failed', url.replace(/serviceKey=[^&]+/, 'serviceKey=***'), err);
    return { ok: false, reason: 'network', message: '원천 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
}
