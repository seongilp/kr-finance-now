import Link from 'next/link';

import { headlineIndexes } from '@/lib/market';

function signClass(n: number): string {
  // 한국 관례: 상승 빨강, 하락 파랑
  return n > 0 ? 'text-[#F04452]' : n < 0 ? 'text-[#3182F6]' : 'text-muted-foreground';
}

function signed(n: number, digits: number): string {
  const s = Math.abs(n).toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return n > 0 ? `▲ ${s}` : n < 0 ? `▼ ${s}` : s;
}

export async function MarketStrip() {
  const quotes = await headlineIndexes();
  if (quotes.length === 0) return null;
  const basDt = quotes[0].basDt.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3');

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">주요 지수</h2>
        <span className="text-xs text-muted-foreground">{basDt} 종가 기준</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {quotes.map((q) => (
          <Link
            key={q.name}
            href={`/d/15094807?op=getStockMarketIndex_V2&p.idxNm=${encodeURIComponent(q.name)}`}
            className="rounded-2xl border border-[#E5E8EB] bg-white p-4 transition-colors hover:border-primary/40"
          >
            <div className="text-sm text-muted-foreground">{q.name}</div>
            <div className="text-2xl font-bold tabular-nums">
              {q.close.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm tabular-nums ${signClass(q.change)}`}>
              {signed(q.change, 2)} ({q.rate > 0 ? '+' : ''}
              {q.rate.toFixed(2)}%)
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
