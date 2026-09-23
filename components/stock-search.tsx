import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RECENT_DAYS = 14;

function sinceYmd(days: number): string {
  // KST 기준 날짜
  return new Date(Date.now() + 9 * 3600_000 - days * 86_400_000).toISOString().slice(0, 10).replaceAll('-', '');
}

/**
 * 주식시세정보(15094808) 조회 화면으로 종목명 포함 검색을 바로 넘긴다 — JS 없이 동작하는 GET 폼.
 * 원천이 날짜순 정렬을 보장하지 않아 전체 이력을 섞어 주므로 최근 2주로 좁혀 보낸다.
 */
export function StockSearch() {
  return (
    <form action="/d/15094808" className="flex gap-2">
      <input type="hidden" name="op" value="getStockPriceInfo_V2" />
      <input type="hidden" name="p.beginBasDt" value={sinceYmd(RECENT_DAYS)} />
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="p.likeItmsNm" placeholder="종목명 — 예: 삼성전자, 카카오" className="h-11 pl-9" aria-label="종목명" required />
      </div>
      <Button type="submit" className="h-11">
        시세 보기
      </Button>
    </form>
  );
}
