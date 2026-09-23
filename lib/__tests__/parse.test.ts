import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseDataGoKr } from '../parse';

test('data.go.kr JSON: header/body 가 최상위에 있는 기본 형식', () => {
  const body = JSON.stringify({
    header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
    body: { pageNo: 1, totalCount: 4743, numOfRows: 1, items: [{ itemName: '타이레놀정500밀리그람', itemSeq: 202106092 }] },
  });
  const r = parseDataGoKr(body);
  assert.deepEqual(r, { ok: true, total: 4743, rows: [{ itemName: '타이레놀정500밀리그람', itemSeq: '202106092' }] });
});

test('data.go.kr JSON: response 로 감싸고 items.item 이 객체 하나인 형식', () => {
  const body = JSON.stringify({
    response: { header: { resultCode: '00' }, body: { totalCount: 1, items: { item: { A: 'x', B: null } } } },
  });
  assert.deepEqual(parseDataGoKr(body), { ok: true, total: 1, rows: [{ A: 'x', B: '' }] });
});

test('data.go.kr 게이트웨이 오류(미신청 code 30)는 사람이 읽을 메시지로', () => {
  const body = JSON.stringify({
    OpenAPI_ServiceResponse: { cmmMsgHeader: { returnReasonCode: '30', returnAuthMsg: '등록되지 않은 서비스키' } },
  });
  const r = parseDataGoKr(body);
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.message : '', /활용신청.*코드 30/);
});

test('data.go.kr XML 응답과 CDATA·엔티티', () => {
  const body = `<?xml version="1.0"?><response><header><resultCode>00</resultCode></header><body><items>
    <item><PRDUCT><![CDATA[김 & 밥]]></PRDUCT><ENTRPS>A&amp;B</ENTRPS></item>
    <item><PRDUCT>둘째</PRDUCT><ENTRPS></ENTRPS></item>
  </items><totalCount>2</totalCount></body></response>`;
  assert.deepEqual(parseDataGoKr(body), {
    ok: true,
    total: 2,
    rows: [
      { PRDUCT: '김 & 밥', ENTRPS: 'A&B' },
      { PRDUCT: '둘째', ENTRPS: '' },
    ],
  });
});

test('UTF-8 BOM 이 붙은 JSON 도 해석한다', () => {
  const body = '\uFEFF' + JSON.stringify({ response: { header: { resultCode: '00' }, body: { totalCount: 1, items: { item: [{ itmsNm: '삼성전자' }] } } } });
  assert.deepEqual(parseDataGoKr(body), { ok: true, total: 1, rows: [{ itmsNm: '삼성전자' }] });
});

test('금융통계 tableList: 표마다 제목·건수를 따로 두고, total 은 가장 큰 표 기준', () => {
  const body = JSON.stringify({
    response: {
      header: { resultCode: '00' },
      body: {
        tableList: [
          { title: '은행_일반현황_임직원현황', totalCount: 364, items: { item: [{ fncoNm: '우리은행', xcsmCnt: '13967' }] } },
          { title: '은행_일반현황_점포현황', totalCount: 12, items: { item: { fncoNm: '국민은행', brncCnt: '800' } } },
        ],
      },
    },
  });
  assert.deepEqual(parseDataGoKr(body), {
    ok: true,
    total: 364,
    rows: [{ fncoNm: '우리은행', xcsmCnt: '13967' }, { fncoNm: '국민은행', brncCnt: '800' }],
    tables: [
      { title: '은행_일반현황_임직원현황', total: 364, rows: [{ fncoNm: '우리은행', xcsmCnt: '13967' }] },
      { title: '은행_일반현황_점포현황', total: 12, rows: [{ fncoNm: '국민은행', brncCnt: '800' }] },
    ],
  });
});
