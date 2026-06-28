import './globals.css';

export const metadata = { title: '要約添削アプリ', description: '現代文要約の自学用AI添削アプリ' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
