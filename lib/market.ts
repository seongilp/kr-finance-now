import 'server-only';

import { getDataset } from '@/lib/catalog';
import { query } from '@/lib/upstream';

export interface IndexQuote {
  name: string;
  basDt: string;
  close: number;
  change: number;
  rate: number;
}

const INDEX_DATASET = '15094807';
const INDEX_OP = 'getStockMarketIndex_V2';
export const HEADLINE_INDEXES = ['코스피', '코스닥', '코스피 200'] as const;
/** 연휴가 길어도 최근 영업일이 들어오도록 넉넉히 거슬러 올라간다 */
const LOOKBACK_DAYS = 14;

function ymd(d: Date): string {
  // 한국 영업일 기준이므로 KST 로 날짜를 자른다
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10).replaceAll('-', '');
}

/** 지수시세정보에서 지수별 가장 최근 영업일 종가를 가져온다. 실패하면 빈 배열 — 홈 화면을 막지 않는다. */
export async function headlineIndexes(now = new Date()): Promise<IndexQuote[]> {
  const op = getDataset(INDEX_DATASET)?.ops.find((o) => o.id === INDEX_OP);
  if (!op) return [];
  const since = ymd(new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000));
  const results = await Promise.all(
    HEADLINE_INDEXES.map((idxNm) => query({ op, params: { idxNm, beginBasDt: since }, page: 1, size: LOOKBACK_DAYS })),
  );
  return results.flatMap((r, i) => {
    if (!r.ok || r.rows.length === 0) return [];
    const latest = r.rows.reduce((a, b) => (b.basDt > a.basDt ? b : a));
    return [
      {
        name: HEADLINE_INDEXES[i],
        basDt: latest.basDt,
        close: Number(latest.clpr),
        change: Number(latest.vs),
        rate: Number(latest.fltRt),
      },
    ];
  });
}
