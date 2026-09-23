import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Landmark } from 'lucide-react';

import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

const NAME = '금융나우';
const TITLE = `${NAME} — 금융위원회 공공데이터 110종을 한곳에서`;
const DESCRIPTION =
  '주식·지수·채권 시세부터 기업 공시·재무, 펀드·보험·연금 상품, 업권별 금융통계까지. 금융위원회가 공개한 오픈API 110종을 검색하고 바로 조회합니다.';

export const metadata: Metadata = {
  metadataBase: new URL('https://kr-finance-now.vercel.app'),
  title: { default: TITLE, template: `%s — ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: NAME, type: 'website', locale: 'ko_KR' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white font-sans text-[#191F28]">
        <header className="sticky top-0 z-20 border-b border-[#F2F4F6] bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-white">
                <Landmark className="size-4" aria-hidden />
              </span>
              {NAME}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-[#F2F4F6] bg-[#F9FAFB] py-6 text-center text-xs text-muted-foreground">
          데이터 출처: 금융위원회 (공공데이터포털). 시세는 영업일 기준 다음 날 갱신되는 참고용 정보이며 투자 판단의 근거로 쓰지 마세요.
          <br />
          <a className="underline underline-offset-2" href="https://github.com/seongilp/kr-finance-now">
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
