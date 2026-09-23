import 'server-only';

import raw from '@/data/catalog.json';
import type { Category, Dataset } from '@/lib/catalog-types';

const ALL = raw as unknown as Dataset[];
const BY_ID = new Map(ALL.map((d) => [d.id, d]));

export interface DatasetSummary {
  id: string;
  title: string;
  desc: string;
  category: Category;
}

export function summarize(d: Dataset): DatasetSummary {
  return { id: d.id, title: d.title, desc: d.desc, category: d.category };
}

export function allDatasets(): readonly Dataset[] {
  return ALL;
}

export function getDataset(id: string): Dataset | undefined {
  return BY_ID.get(id);
}

export function datasetsIn(category: Category): Dataset[] {
  return ALL.filter((d) => d.category === category).sort((a, b) => a.title.localeCompare(b.title, 'ko'));
}

export function countByCategory(): Map<Category, number> {
  const counts = new Map<Category, number>();
  for (const d of ALL) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  return counts;
}

/** 클라이언트 검색용 최소 인덱스 */
export function searchIndex(): DatasetSummary[] {
  return ALL.map(summarize);
}
