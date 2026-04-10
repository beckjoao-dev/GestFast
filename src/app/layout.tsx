import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GestFast — Pare de vender sem lucro',
  description: 'Sistema que calcula automaticamente o custo de produção e sugere o preço ideal para que você nunca mais venda no prejuízo.',
  openGraph: {
    title: 'GestFast — Pare de vender sem lucro',
    description: 'Calcule o custo real dos seus produtos e descubra o preço ideal para ter lucro. Acesso vitalício por R$ 49.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
