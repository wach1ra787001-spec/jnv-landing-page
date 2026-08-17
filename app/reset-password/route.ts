import { redirect } from 'next/navigation'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    redirect(`/auth/reset-password?code=${code}`)
  }
  
  redirect('/auth/reset-password')
}
