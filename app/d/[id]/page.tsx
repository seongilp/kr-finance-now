import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { ResultTable } from '@/components/result-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDataset } from '@/lib/catalog';
import type { Dataset, Op, OpParam } from '@/lib/catalog-types';
import { categoryMeta } from '@/lib/categories';
import { query } from '@/lib/upstream';

const PAGE_SIZE = 20;
const PARAM_PREFIX = 'p.';

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

function pickOp(d: Dataset, opId: string): Op | undefined {
  return d.ops.find((o) => o.id === opId) ?? d.ops[0];
}

function userParams(op: Op, sp: SearchParams): Record<string, string> {
  const allowed = new Set(op.params.filter((p) => !p.system).map((p) => p.name));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (!k.startsWith(PARAM_PREFIX)) continue;
    const name = k.slice(PARAM_PREFIX.length);
    const value = first(v).trim().slice(0, 200);
    if (allowed.has(name) && value) out[name] = value;
  }
  return out;
}

function hrefWith(id: string, opId: string, params: Record<string, string>, page: number): string {
  const qs = new URLSearchParams({ op: opId, page: String(page) });
  for (const [k, v] of Object.entries(params)) qs.set(PARAM_PREFIX + k, v);
  return `/d/${id}?${qs.toString()}`;
}

export async function generateMetadata({ params }: PageProps<'/d/[id]'>): Promise<Metadata> {
  const d = getDataset((await params).id);
  return d ? { title: d.title } : {};
}

export default async function DatasetPage({ params, searchParams }: PageProps<'/d/[id]'>) {
  const { id } = await params;
  const d = getDataset(id);
  if (!d) notFound();

  const sp = (await searchParams) as SearchParams;
  const op = pickOp(d, first(sp.op));
  const page = Math.max(1, Math.min(10_000, Number(first(sp.page)) || 1));
  const cat = categoryMeta(d.category);

  return (
    <div className="space-y-5">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          홈
        </Link>{' '}
        /{' '}
        <Link href={`/c/${d.category}`} className="hover:text-foreground">
          {cat.name}
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{d.title}</h1>
        {d.desc && <p className="text-sm text-muted-foreground">{d.desc}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">금융위원회</Badge>
          <Badge variant="outline">{cat.name}</Badge>
          <a
            href={d.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            원문 <ExternalLink className="size-3" />
          </a>
        </div>
      </header>

      {!op ? (
        <p className="rounded-xl border p-4 text-muted-foreground">
          이 데이터는 조회용 API 가 없어 원문 페이지에서만 볼 수 있습니다.
        </p>
      ) : (
        <DatasetBody d={d} op={op} page={page} params={userParams(op, sp)} />
      )}
    </div>
  );
}

const PRIMARY_LIMIT = 3;
const NAME_SEARCH = /명 \(포함\)$/;
const KEY_EXACT = /^(기준일자|기준연월|사업연도|법인등록번호|금융회사명|회사명|종목명)$/;
const RANGE = /(이상|미만|\(포함\))$/;

/** 필수 항목과 이름·코드류 몇 개만 바로 보이고, 나머지는 접어 둔다(모바일에서 폼이 화면을 다 먹지 않게) */
function splitParams(op: Op): { primary: OpParam[]; more: OpParam[] } {
  const inputs = op.params.filter((p) => !p.system);
  const ranked = [...inputs].sort((a, b) => rank(a) - rank(b));
  const primary = ranked.slice(0, Math.max(PRIMARY_LIMIT, inputs.filter((p) => p.required).length));
  const chosen = new Set(primary.map((p) => p.name));
  return {
    primary: inputs.filter((p) => chosen.has(p.name)),
    more: inputs.filter((p) => !chosen.has(p.name)),
  };
}

/** 필수 → '○○명 (포함)' 이름 검색 → 기준일자·법인번호 같은 핵심 일치 조건 → 기타 → 범위·부분일치 */
function rank(p: OpParam): number {
  if (p.required) return 0;
  if (NAME_SEARCH.test(p.label)) return 1;
  if (KEY_EXACT.test(p.label)) return 2;
  return RANGE.test(p.label) ? 4 : 3;
}

function ParamInput({ p, value }: { p: OpParam; value: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">
        {p.label}
        {p.required && <span className="text-destructive"> *</span>}
      </span>
      <Input name={PARAM_PREFIX + p.name} defaultValue={value} placeholder={p.sample ?? ''} />
    </label>
  );
}

function SearchForm({ d, op, params }: { d: Dataset; op: Op; params: Record<string, string> }) {
  const { primary, more } = splitParams(op);
  const moreFilled = more.some((p) => params[p.name]);
  return (
    <form action={`/d/${d.id}`} className="space-y-3 rounded-xl border bg-card p-4">
      <input type="hidden" name="op" value={op.id} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map((p) => (
          <ParamInput key={p.name} p={p} value={params[p.name] ?? ''} />
        ))}
      </div>
      {more.length > 0 && (
        <details open={moreFilled} className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            상세 조건 {more.length}개
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <ParamInput key={p.name} p={p} value={params[p.name] ?? ''} />
            ))}
          </div>
        </details>
      )}
      <Button type="submit" className="w-full sm:w-auto">
        조회
      </Button>
    </form>
  );
}

async function DatasetBody({ d, op, page, params }: { d: Dataset; op: Op; page: number; params: Record<string, string> }) {
  const inputs = op.params.filter((p) => !p.system);
  const result = await query({ op, params, page, size: PAGE_SIZE });
  const lastPage = result.ok ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <>
      {d.ops.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {d.ops.map((o) => (
            <Button key={o.id} asChild size="sm" variant={o.id === op.id ? 'default' : 'outline'}>
              <Link href={hrefWith(d.id, o.id, {}, 1)}>{o.name}</Link>
            </Button>
          ))}
        </div>
      )}

      {inputs.length > 0 && <SearchForm d={d} op={op} params={params} />}

      {!result.ok ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">{result.message}</p>
      ) : result.rows.length === 0 ? (
        <p className="rounded-xl border p-4 text-muted-foreground">조건에 맞는 결과가 없습니다.</p>
      ) : (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            총 <strong className="text-foreground">{result.total.toLocaleString()}</strong>건 · {page}/
            {lastPage.toLocaleString()} 페이지
          </p>
          {result.tables ? (
            result.tables
              .filter((t) => t.rows.length > 0)
              .map((t) => (
                <div key={t.title} className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    {t.title.replaceAll('_', ' · ')}{' '}
                    <span className="font-normal text-muted-foreground">{t.total.toLocaleString()}건</span>
                  </h3>
                  <ResultTable op={op} rows={t.rows} />
                </div>
              ))
          ) : (
            <ResultTable op={op} rows={result.rows} />
          )}
          <div className="flex justify-between">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={hrefWith(d.id, op.id, params, page - 1)}>이전</Link>
              </Button>
            ) : (
              <span />
            )}
            {page < lastPage && (
              <Button asChild variant="outline" size="sm">
                <Link href={hrefWith(d.id, op.id, params, page + 1)}>다음</Link>
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
