import { createClient as createServerClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

export async function GET(request: Request) {
  try {
    // 1. 로그인 체크
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
    }

    // 2. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 3. 내가 참여 중인 room_members 가져오기
    const { data: myRoomMembers, error: membersError } = await supabaseServer
      .from('room_members')
      .select('room_id, joined_at, last_seen')
      .eq('user_id', user.id)
      .is('left_at', null)
      .order('last_seen', { ascending: false })

    if (membersError) {
      console.error('Room members fetch error:', membersError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, membersError.message)
    }

    if (!myRoomMembers || myRoomMembers.length === 0) {
      return createSuccessResponse({
        chatRooms: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    // 4. room_id로 rooms 정보 가져오기
    const roomIds = myRoomMembers.map(m => m.room_id)
    const { data: rooms, error: roomsError } = await supabaseServer
      .from('rooms')
      .select('id, issue_id, capacity')
      .in('id', roomIds)

    if (roomsError) {
      console.error('Rooms fetch error:', roomsError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, roomsError.message)
    }

    // 5. issue_id로 issues 정보 가져오기
    const issueIds = rooms.map(r => r.issue_id)
    const { data: issues, error: issuesError } = await supabaseServer
      .from('issues')
      .select('id, display_id, title, preview, thumbnail, status')
      .in('id', issueIds)

    if (issuesError) {
      console.error('Issues fetch error:', issuesError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, issuesError.message)
    }

    // 6. 활성 멤버 수 조회
    const { data: activeCounts, error: countsError } = await supabaseServer
      .from('room_members')
      .select('room_id')
      .in('room_id', roomIds)
      .is('left_at', null)

    if (countsError) {
      console.error('Active counts fetch error:', countsError)
    }

    // room_id별 활성 멤버 수 계산
    const activeCountMap = new Map<string, number>()
    if (activeCounts) {
      activeCounts.forEach(ac => {
        const count = activeCountMap.get(ac.room_id) || 0
        activeCountMap.set(ac.room_id, count + 1)
      })
    }

    // 7. 데이터 조합: last_seen 기준으로 정렬
    const chatRoomsWithIssues = myRoomMembers
      .map(member => {
        const room = rooms.find(r => r.id === member.room_id)
        if (!room) return null

        const issue = issues.find(i => i.id === room.issue_id)
        if (!issue) return null

        return {
          room_id: room.id,
          issue_id: room.issue_id,
          joined_at: member.joined_at,
          last_seen: member.last_seen,
          active_member_count: activeCountMap.get(room.id) || 0,
          capacity: room.capacity,
          issue: {
            id: issue.id,
            display_id: issue.display_id,
            title: issue.title,
            preview: issue.preview,
            thumbnail: issue.thumbnail,
            status: issue.status
          }
        }
      })
      .filter(c => c !== null)

    // 8. 페이지네이션 적용
    const total = chatRoomsWithIssues.length
    const paginatedChatRooms = chatRoomsWithIssues.slice(offset, offset + limit)

    return createSuccessResponse({
      chatRooms: paginatedChatRooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 200, total)

  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}