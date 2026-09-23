import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** 주식시세정보(15094808) 조회 화면으로 종목명 포함 검색을 바로 넘긴다 — JS 없이 동작하는 GET 폼 */
export function StockSearch() {
  return (
    <form action="/d/15094808" className="flex gap-2">
      <input type="hidden" name="op" value="getStockPriceInfo_V2" />
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
