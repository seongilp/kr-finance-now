#!/usr/bin/env python3
"""scripts/raw/apis.json(조사 결과) → data/catalog.json(앱이 읽는 카탈로그).

apis.json 은 data.go.kr 상세페이지 swagger/표에서 뽑은 금융위원회 오픈API 110종이다.
앱은 이 카탈로그만 보고 조회 폼과 결과 표를 자동으로 만들기 때문에
endpoint 는 실제 호출 URL, params/fields 는 원문 이름 그대로여야 한다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts/raw/apis.json'
SAMPLES = ROOT / 'scripts/raw/samples'
OUT = ROOT / 'data/catalog.json'

SYSTEM_PARAMS = {'servicekey', 'pageno', 'numofrows', 'resulttype', 'type', '_type'}

# (카테고리, 제목 키워드 정규식) — 위에서부터 먼저 맞는 것
CATEGORY_RULES = [
    ('mortgage', r'모기지론|주택연금'),
    ('sb', r'개인사업자'),
    ('stats', r'금융통계|영업활동통계|영업및경영지표|종합통계'),
    ('market', r'시세|상장종목|ESG|소매채권수익률'),
    ('product', r'펀드상품|변액보험|실손|퇴직연금|ISA|서민금융|보험가입|자동차보험|생명보험|침수차량|사회적금융'),
    ('bond', r'채권|단기금융|REPO'),
    ('stock', r'주식(?!발행공시)|신주인수권|국제거래|크라우드펀딩'),
    ('corp', r'기업|공시|지배구조'),
    ('fnco', r'.'),
]

LABELS = {
    'basDt': '기준일자', 'basYm': '기준연월', 'bizYr': '사업연도', 'bizYear': '사업연도',
    'crno': '법인등록번호', 'itmsNm': '종목명', 'isinCd': 'ISIN코드', 'srtnCd': '단축코드',
    'fncoNm': '금융회사명', 'FncoNm': '금융회사명', 'FncoCd': '금융회사코드',
}


def param_label(name: str, desc: str) -> str:
    d = re.sub(r'\s+', ' ', desc or '').strip()
    m = re.match(r'검색값과 (.+?)[이가와]? ?일치하는', d)
    if m:
        return clean(m.group(1))
    m = re.match(r'(.+?)(?:값)?[이가]? ?검색값을 ?포함하는', d)
    if m:
        return f'{clean(m.group(1))} (포함)'
    m = re.match(r'(.+?)[이가]? ?(?:검색값)?보다 ?크거나 ?같은', d)
    if m:
        return f'{clean(m.group(1))} 이상'
    m = re.match(r'(.+?)[이가]? ?(?:검색값)?보다 ?작은', d)
    if m:
        return f'{clean(m.group(1))} 미만'
    if name in LABELS:
        return LABELS[name]
    return clean(d) or name


def clean(s: str) -> str:
    s = re.sub(r'값$', '', s.strip())
    s = re.sub(r'\(년월일\)', '', s)
    if s.startswith('작업 또는 거래의 기준이 되는 일자'):
        return '기준일자'
    return s if len(s) <= 24 else s[:22] + '…'


def field_label(name: str, desc: str) -> str:
    d = re.sub(r'\s+', ' ', desc or '').strip()
    return (d if len(d) <= 24 else d[:22] + '…') or name


def category_of(title: str) -> str:
    for cat, pat in CATEGORY_RULES:
        if re.search(pat, title):
            return cat
    return 'fnco'


def sample_value(name: str) -> str | None:
    return {'basDt': '20260923', 'basYm': '202606', 'bizYr': '2025', 'likeItmsNm': '삼성'}.get(name)


RESPONSE_META = {'resultCode', 'resultMsg', 'numOfRows', 'pageNo', 'totalCount'}


def build() -> list[dict]:
    src = json.loads(SRC.read_text())
    out = []
    for api in src:
        base = 'https://' + api['endpoint'].removeprefix('https://').removeprefix('http://').rstrip('/')
        ops = []
        for o in api.get('operations') or []:
            path = o['name'] if o['name'].startswith('/') else '/' + o['name']
            op_id = path.rsplit('/', 1)[-1]
            params, seen = [], set()
            for p in o.get('params') or []:
                if p['name'] in seen:
                    continue
                seen.add(p['name'])
                params.append({
                    'name': p['name'],
                    'label': param_label(p['name'], p.get('desc', '')),
                    'required': bool(p.get('required')) and p['name'].lower() not in SYSTEM_PARAMS,
                    **({'sample': s} if (s := sample_value(p['name'])) else {}),
                    **({'system': True} if p['name'].lower() in SYSTEM_PARAMS else {}),
                })
            fields = [
                {'name': f['name'], 'label': field_label(f['name'], f.get('desc', ''))}
                for f in o.get('fields') or []
                if f['name'] not in RESPONSE_META and f['name'] not in {'items', 'item', 'header', 'body', 'response'}
            ]
            ops.append({
                'id': op_id,
                'name': o.get('label') or op_id,
                'endpoint': base + path,
                'params': params,
                'fields': fields,
            })
        title = api['title'].removeprefix('금융위원회_').strip()
        out.append({
            'id': api['pk'],
            'title': title,
            'desc': clean_desc(api.get('desc', '')),
            'category': category_of(title),
            'sourceUrl': f"https://www.data.go.kr/data/{api['pk']}/openapi.do",
            'ops': ops,
        })
    return sorted(out, key=lambda d: d['title'])


def clean_desc(s: str) -> str:
    s = re.sub(r'※ ?금융위원회 ?의 모든 API는.*$', '', s or '').strip(' .')
    return s


if __name__ == '__main__':
    cat = build()
    OUT.write_text(json.dumps(cat, ensure_ascii=False, indent=1))
    from collections import Counter
    print(len(cat), 'datasets', sum(len(d['ops']) for d in cat), 'ops', Counter(d['category'] for d in cat))
