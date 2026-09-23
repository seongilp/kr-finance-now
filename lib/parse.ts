/** 원천 응답(data.go.kr JSON/XML)을 한 모양으로 맞춘다. 네트워크 없음 — 테스트 대상. */

export type Row = Record<string, string>;

/** 금융통계 서비스는 한 응답에 여러 표(tableList)를 담는다. 표마다 컬럼이 달라 따로 그린다. */
export interface Table {
  title: string;
  rows: Row[];
  total: number;
}

export type ParseResult =
  | { ok: true; rows: Row[]; total: number; tables?: Table[] }
  | { ok: false; reason: 'upstream'; message: string };

type Json = Record<string, unknown>;

export function parseDataGoKr(raw: string): ParseResult {
  // 금융위 일부 서비스는 UTF-8 BOM 을 붙여 보내 JSON.parse 가 실패한다
  const body = raw.replace(/^\uFEFF/, '').trimStart();
  return body.startsWith('<') ? parseDataGoKrXml(body) : parseDataGoKrJson(body);
}

function parseDataGoKrJson(body: string): ParseResult {
  let j: Json;
  try {
    j = JSON.parse(body) as Json;
  } catch {
    return { ok: false, reason: 'upstream', message: '응답을 해석하지 못했습니다.' };
  }
  const gatewayError = (j.OpenAPI_ServiceResponse as Json | undefined)?.cmmMsgHeader as Json | undefined;
  if (gatewayError) return upstreamError(String(gatewayError.returnReasonCode), String(gatewayError.returnAuthMsg ?? ''));

  const envelope = (j.response as Json | undefined) ?? j;
  const header = envelope.header as Json | undefined;
  const code = String(header?.resultCode ?? '00');
  if (!isOkCode(code)) return upstreamError(code, String(header?.resultMsg ?? ''));

  const bodyNode = (envelope.body as Json | undefined) ?? {};
  if (Array.isArray(bodyNode.tableList)) return fromTableList(bodyNode.tableList);
  const rows = toRows(extractItems(bodyNode.items));
  const total = Number(bodyNode.totalCount ?? rows.length) || 0;
  return { ok: true, rows, total };
}

function fromTableList(list: unknown[]): ParseResult {
  const tables: Table[] = list
    .filter((t): t is Json => !!t && typeof t === 'object')
    .map((t) => {
      const rows = toRows(extractItems(t.items));
      return { title: String(t.title ?? ''), rows, total: Number(t.totalCount ?? rows.length) || 0 };
    });
  return {
    ok: true,
    rows: tables.flatMap((t) => t.rows),
    total: Math.max(0, ...tables.map((t) => t.total)),
    tables,
  };
}

function extractItems(items: unknown): unknown[] {
  if (Array.isArray(items)) return items;
  if (items && typeof items === 'object') {
    const inner = (items as Json).item;
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === 'object') return [inner];
  }
  return [];
}

function parseDataGoKrXml(body: string): ParseResult {
  const code = tagText(body, 'resultCode') ?? tagText(body, 'returnReasonCode') ?? '00';
  if (!isOkCode(code)) {
    return upstreamError(code, tagText(body, 'resultMsg') ?? tagText(body, 'returnAuthMsg') ?? '');
  }
  const rows: Row[] = [];
  for (const [, inner] of body.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const row: Row = {};
    for (const [, name, value] of inner.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) row[name] = decodeXml(value);
    rows.push(row);
  }
  const total = Number(tagText(body, 'totalCount') ?? rows.length) || 0;
  return { ok: true, rows, total };
}

function tagText(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? decodeXml(m[1]).trim() : undefined;
}

function decodeXml(s: string): string {
  return s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function isOkCode(code: string): boolean {
  return ['00', '0', '000', '0000'].includes(code);
}

function upstreamError(code: string, msg: string): ParseResult {
  const hint =
    code === '30' ? '이 데이터의 활용신청 승인이 아직 반영되지 않았습니다.' :
    code === '22' ? '오늘 호출 한도를 모두 썼습니다. 내일 다시 시도해 주세요.' :
    code === '23' ? '잠시 호출이 몰렸습니다. 조금 뒤 다시 시도해 주세요.' :
    msg || '원천 서버가 오류를 반환했습니다.';
  return { ok: false, reason: 'upstream', message: `${hint} (코드 ${code})` };
}

function toRows(items: unknown[]): Row[] {
  return items
    .filter((it): it is Json => !!it && typeof it === 'object')
    .map((it) => Object.fromEntries(Object.entries(it).map(([k, v]) => [k, stringify(v)])));
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
