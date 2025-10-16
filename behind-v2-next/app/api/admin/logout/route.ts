import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withCsrfProtection } from '@/lib/api-helpers'

export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    // 쿠키 삭제
    const cookieStore = await cookies()
    cookieStore.delete('admin-auth')

    return NextResponse.json({ success: true })
  })
}