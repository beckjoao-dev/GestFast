import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GestFast — Descubra quanto você realmente lucra',
  description: 'Calcule o custo dos seus produtos e descubra o preço ideal para ganhar mais.',
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
