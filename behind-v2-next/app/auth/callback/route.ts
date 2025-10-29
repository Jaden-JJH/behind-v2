import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnUrl = requestUrl.searchParams.get('returnUrl')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const redirectUrl = returnUrl
    ? `${requestUrl.origin}${returnUrl}`
    : requestUrl.origin

  return NextResponse.redirect(redirectUrl)
}
