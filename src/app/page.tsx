import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

export default function RootPage() {
  const session = getCurrentUser()
  if (session) redirect('/dashboard')
  return <LandingPage />
}
