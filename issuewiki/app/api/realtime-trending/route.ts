import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. 설정 조회
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'realtime_trending')
      .single()

    if (settingsError) {
      console.error('Get realtime trending error:', settingsError)
      return NextResponse.json(
        { error: 'Failed to get realtime trending' },
        { status: 500 }
      )
    }

    const settings = settingsData?.value || {}

    // 2. 이슈 ID 추출
    const issueIds = [
      settings.slot_1?.issue_id,
      settings.slot_2?.issue_id,
      settings.slot_3?.issue_id,
      settings.slot_4?.issue_id,
      settings.slot_5?.issue_id
    ].filter(Boolean)

    if (issueIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // 3. 이슈 정보 조회
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('id, display_id, title, category')
      .in('id', issueIds)
      .eq('approval_status', 'approved')
      .eq('visibility', 'active')

    if (issuesError) {
      console.error('Get issues error:', issuesError)
      return NextResponse.json(
        { error: 'Failed to get issues' },
        { status: 500 }
      )
    }

    // 4. 순서대로 정렬 + 변동 수치 추가
    const issueMap = new Map(issues.map(issue => [issue.id, issue]))
    const result = []

    for (let i = 1; i <= 5; i++) {
      const slotKey = `slot_${i}`
      const slotData = settings[slotKey]

      if (slotData?.issue_id && issueMap.has(slotData.issue_id)) {
        const issue = issueMap.get(slotData.issue_id)
        result.push({
          ...issue,
          rank: i,
          change: slotData.change || '0'
        })
      }
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Get realtime trending error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
