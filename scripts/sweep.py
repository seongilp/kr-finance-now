#!/usr/bin/env python3
"""모든 오퍼레이션을 1건씩 호출해 상태와 실제 응답 필드를 scripts/raw/sweep.json 에 기록한다.

키는 환경변수 DATA_GO_KR_KEY(인코딩 키 verbatim). 결과 파일에 키는 남기지 않는다.
"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY = os.environ['DATA_GO_KR_KEY']
cat = json.loads((ROOT / 'data/catalog.json').read_text())


def call(d, o):
    url = f"{o['endpoint']}?serviceKey={KEY}&pageNo=1&numOfRows=3&resultType=json"
    try:
        with urllib.request.urlopen(url, timeout=45) as r:
            body = r.read().decode('utf-8-sig', 'replace')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8-sig', 'replace')
    except Exception as e:  # noqa: BLE001
        return {'code': 'ERR', 'msg': str(e)[:80]}
    try:
        j = json.loads(body)
    except ValueError:
        return {'code': 'NOJSON', 'msg': body[:120]}
    if 'OpenAPI_ServiceResponse' in j:
        h = j['OpenAPI_ServiceResponse']['cmmMsgHeader']
        return {'code': h.get('returnReasonCode'), 'msg': h.get('returnAuthMsg')}
    env = j.get('response', j)
    h = env.get('header', {})
    b = env.get('body', {}) or {}
    blocks = b.get('tableList') if isinstance(b.get('tableList'), list) else [b]
    items = []
    for blk in blocks:
        its = (blk or {}).get('items') or {}
        if isinstance(its, dict):
            its = its.get('item') or []
        if isinstance(its, dict):
            its = [its]
        items += its
    keys = []
    for it in items:
        for k in it:
            if k not in keys:
                keys.append(k)
    return {'code': str(h.get('resultCode')), 'msg': h.get('resultMsg'), 'total': b.get('totalCount'), 'keys': keys}


jobs = [(d, o) for d in cat for o in d['ops']]
def run(job):
    d, o = job
    time.sleep(0.1)
    return {'id': d['id'], 'op': o['id'], **call(d, o)}

with ThreadPoolExecutor(6) as ex:
    out = list(ex.map(run, jobs))
(ROOT / 'scripts/raw/sweep.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
from collections import Counter
print(Counter(r['code'] for r in out))
print('empty ok:', sum(1 for r in out if r['code'] in ('00', '0000') and not r.get('keys')))
