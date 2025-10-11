import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // 쿠키 삭제
  cookies().delete('admin-auth')
  
  return NextResponse.json({ success: true })
}