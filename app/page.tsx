import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { DatasetSearch } from '@/components/dataset-search';
import { MarketStrip } from '@/components/market-strip';
import { StockSearch } from '@/components/stock-search';
import { allDatasets, countByCategory, searchIndex } from '@/lib/catalog';
import { CATEGORIES } from '@/lib/categories';

// 주요 지수 카드가 시간마다 새 종가를 받도록 ISR
export const revalidate = 3600;

const SHORTCUTS = [
  { href: '/d/15094808', label: '주식 시세' },
  { href: '/d/15094807', label: '지수 시세' },
  { href: '/d/15094806', label: 'ETF·ETN 시세' },
  { href: '/d/15043284', label: '배당' },
  { href: '/d/15043459', label: '기업 재무제표' },
  { href: '/d/15059649', label: '공시' },
  { href: '/d/15094792', label: '펀드' },
  { href: '/d/15094797', label: '실손보험' },
  { href: '/d/15094787', label: '서민금융상품' },
];

export default function Home() {
  const counts = countByCategory();
  const total = allDatasets().length;
  const ops = allDatasets().reduce((n, d) => n + d.ops.length, 0);

  return (
    <div className="space-y-10">
      <section className="-mx-4 -mt-6 space-y-4 bg-gradient-to-b from-[var(--brand-soft)] to-white px-4 pt-10 pb-6 sm:rounded-b-3xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          금융위원회 공공데이터 <span className="text-primary">{total}종</span>, 전부 여기서 조회
        </h1>
        <p className="text-muted-foreground">
          주식·채권 시세, 기업 공시·재무제표, 펀드·보험·연금 상품, 업권별 금융통계까지 조회 화면 {ops}개. 가입도 키도 필요 없습니다.
        </p>
        <DatasetSearch index={searchIndex()} />
        <div className="flex flex-wrap gap-2">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-full border border-[#E5E8EB] bg-white px-3 py-1 text-sm hover:border-primary/40 hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      <MarketStrip />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">종목 시세 찾기</h2>
        <StockSearch />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">분야별로 보기</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.filter((c) => counts.get(c.id)).map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.id}`}
              className="group flex items-center justify-between rounded-2xl border border-[#E5E8EB] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_4px_16px_rgba(49,130,246,0.12)]"
            >
              <div>
                <div className="font-medium">
                  {c.name} <span className="text-sm font-normal text-muted-foreground">{counts.get(c.id)}</span>
                </div>
                <div className="text-sm text-muted-foreground">{c.blurb}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
