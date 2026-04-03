import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

// Rota raiz: redireciona para /dashboard se logado, /login se não
export default function RootPage() {
  const session = getCurrentUser()
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
