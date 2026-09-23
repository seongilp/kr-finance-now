import type { Op } from '@/lib/catalog-types';
import type { Row } from '@/lib/upstream';

const LONG_TEXT = 80;
const URL_RE = /^https?:\/\/\S+$/i;
const NUMERIC = /^-?(\d+|\d*\.\d+)$/;
/** 코드·번호·날짜 성격의 필드는 숫자여도 천 단위 구분 기호를 넣지 않는다 */
const ID_LIKE = /cd$|code|no$|crno|bzno|dt$|ym$|yr$|year|isin|srtn|seq|id$/i;
const YMD = /^(\d{4})(\d{2})(\d{2})$/;

function display(name: string, v: string): string {
  if (/dt$/i.test(name) && YMD.test(v)) return v.replace(YMD, '$1-$2-$3');
  if (NUMERIC.test(v) && !ID_LIKE.test(name) && Math.abs(Number(v)) >= 1000) {
    const [i, f] = v.split('.');
    return Number(i).toLocaleString('ko-KR') + (f ? `.${f}` : '');
  }
  return v;
}

/** 응답에 실제로 등장한 필드만, 카탈로그 순서대로. 카탈로그에 없는 필드는 뒤에 붙인다. */
function columnsFor(op: Op, rows: Row[]): { name: string; label: string }[] {
  const present = new Set(rows.flatMap((r) => Object.keys(r)));
  const known = op.fields.filter((f) => present.has(f.name));
  const knownNames = new Set(known.map((f) => f.name));
  const extra = [...present].filter((n) => !knownNames.has(n)).map((name) => ({ name, label: name }));
  return [...known, ...extra].filter((c) => rows.some((r) => r[c.name]?.trim()));
}

function Cell({ name, value }: { name: string; value: string }) {
  const v = value.trim();
  if (!v) return <span className="text-muted-foreground">—</span>;
  if (URL_RE.test(v)) {
    return (
      <a href={v} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
        링크
      </a>
    );
  }
  if (v.length > LONG_TEXT) {
    return (
      <details>
        <summary className="cursor-pointer">{v.slice(0, LONG_TEXT)}…</summary>
        <div className="mt-1 whitespace-pre-wrap">{v}</div>
      </details>
    );
  }
  return <span className={NUMERIC.test(v) ? 'tabular-nums' : undefined}>{display(name, v)}</span>;
}

export function ResultTable({ op, rows }: { op: Op; rows: Row[] }) {
  const cols = columnsFor(op, rows);
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            {cols.map((c) => (
              <th key={c.name} scope="col" className="px-3 py-2 font-medium whitespace-nowrap" title={c.name}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="align-top hover:bg-accent/40">
              {cols.map((c) => (
                <td key={c.name} className="max-w-md min-w-24 px-3 py-2">
                  <Cell name={c.name} value={r[c.name] ?? ''} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
