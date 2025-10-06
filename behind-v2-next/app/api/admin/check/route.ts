import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const authCookie = cookies().get('admin-auth')
  
  if (authCookie?.value === 'true') {
    return NextResponse.json({ authenticated: true })
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
