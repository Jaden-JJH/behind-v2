'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [preview, setPreview] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [capacity, setCapacity] = useState('30')
  const [pollQuestion, setPollQuestion] = useState('')
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPoll, setShowPoll] = useState(false)
  const [showInMainHot, setShowInMainHot] = useState(false)
  const [showInMainPoll, setShowInMainPoll] = useState(false)
  const [summary, setSummary] = useState('')
  const [mediaYoutube, setMediaYoutube] = useState('')
  const [mediaNewsTitle, setMediaNewsTitle] = useState('')
  const [mediaNewsSource, setMediaNewsSource] = useState('')
  const [mediaNewsUrl, setMediaNewsUrl] = useState('')
  const [behindStory, setBehindStory] = useState('')

  useEffect(() => {
    // 인증 확인
    fetch('/api/admin/check')
      .then(res => {
        if (!res.ok) router.push('/admin/login')
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          preview,
          summary,
          thumbnail,
          capacity: parseInt(capacity),
          mediaYoutube: mediaYoutube || null,
          mediaNewsTitle: mediaNewsTitle || null,
          mediaNewsSource: mediaNewsSource || null,
          mediaNewsUrl: mediaNewsUrl || null,
          behindStory: behindStory || null,
          pollQuestion: showPoll ? pollQuestion : null,
          options: showPoll ? [option1, option2] : null,
          showInMainHot,
          showInMainPoll: showPoll ? showInMainPoll : false
        })
      })

      if (response.ok) {
        setMessage('✅ 이슈가 성공적으로 등록되었습니다!')
        // 폼 초기화
        setTitle('')
        setPreview('')
        setSummary('')
        setThumbnail('')
        setCapacity('30')
        setMediaYoutube('')
        setMediaNewsTitle('')
        setMediaNewsSource('')
        setMediaNewsUrl('')
        setBehindStory('')
        setShowPoll(false)
        setPollQuestion('')
        setOption1('')
        setOption2('')
        setShowInMainHot(false)
        setShowInMainPoll(false)
      } else {
        const error = await response.json()
        setMessage('❌ ' + (error.error || '등록 실패'))
      }
    } catch (error) {
      setMessage('❌ 오류 발생: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">이슈 등록</h1>
          <button
            onClick={() => router.push('/admin/login')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            로그아웃
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="이슈 제목 (5-50자, 예: 아이돌 A씨 계약 분쟁)"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/50자</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">미리보기 텍스트</label>
            <textarea
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              required
              maxLength={100}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="이슈 요약 (10-100자, 예: 소속사와의 계약 종료 요구)"
            />
            <p className="text-xs text-gray-500 mt-1">{preview.length}/100자</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이슈 요약 *</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              maxLength={500}
              rows={5}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="이슈에 대한 상세 설명 (10-500자, 이슈 상세 페이지 상단에 표시됨)"
            />
            <p className="text-xs text-gray-500 mt-1">{summary.length}/500자</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">썸네일 URL</label>
            <input
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <hr className="my-6" />
          <h2 className="text-xl font-bold mb-4">관련 미디어 (선택)</h2>

          <div>
            <label className="block text-sm font-medium mb-2">유튜브 영상 URL</label>
            <input
              type="url"
              value={mediaYoutube}
              onChange={(e) => setMediaYoutube(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">유튜브 링크를 입력하면 이슈 상세 페이지에 영상 플레이어가 표시됩니다</p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">관련 뉴스</label>
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <input
                type="text"
                value={mediaNewsTitle}
                onChange={(e) => setMediaNewsTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="뉴스 제목 (예: 통신사 보안 사고 발생)"
              />
              <input
                type="text"
                value={mediaNewsSource}
                onChange={(e) => setMediaNewsSource(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="언론사 (예: 테크뉴스)"
              />
              <input
                type="url"
                value={mediaNewsUrl}
                onChange={(e) => setMediaNewsUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="뉴스 링크 URL"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">뉴스 제목과 링크를 입력하면 이슈 상세 페이지에 뉴스 카드가 표시됩니다</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">채팅방 정원</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="10"
              max="100"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비하인드</label>
            <textarea
              value={behindStory}
              onChange={(e) => setBehindStory(e.target.value)}
              maxLength={1000}
              rows={5}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="내부자의 진짜 이야기나 비하인드 (선택, 최대 1000자)"
            />
            <p className="text-xs text-gray-500 mt-1">{behindStory.length}/1000자</p>
            <p className="text-xs text-gray-400 mt-1">입력하지 않으면 이슈 상세 페이지에 표시되지 않습니다</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="showInMainHot"
                checked={showInMainHot}
                onChange={(e) => setShowInMainHot(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showInMainHot" className="text-sm font-medium">
                메인 화면 "가장 뜨거운 이슈"에 표시
              </label>
            </div>
          </div>

          <hr className="my-6" />

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="showPoll"
              checked={showPoll}
              onChange={(e) => setShowPoll(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showPoll" className="text-sm font-medium">
              투표 추가하기
            </label>
          </div>

          {showPoll && (
            <div className="space-y-4 pl-6 border-l-2 border-indigo-200">
              <h2 className="text-xl font-bold mb-4">투표 설정</h2>

              <div>
                <label className="block text-sm font-medium mb-2">투표 질문</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  required={showPoll}
                  maxLength={50}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="투표 질문 (5-50자, 예: 당신의 의견은?)"
                />
                <p className="text-xs text-gray-500 mt-1">{pollQuestion.length}/50자</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">선택지 1</label>
                <input
                  type="text"
                  value={option1}
                  onChange={(e) => setOption1(e.target.value)}
                  required={showPoll}
                  maxLength={20}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="선택지 (2-20자, 예: 찬성)"
                />
                <p className="text-xs text-gray-500 mt-1">{option1.length}/20자</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">선택지 2</label>
                <input
                  type="text"
                  value={option2}
                  onChange={(e) => setOption2(e.target.value)}
                  required={showPoll}
                  maxLength={20}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="선택지 (2-20자, 예: 반대)"
                />
                <p className="text-xs text-gray-500 mt-1">{option2.length}/20자</p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="showInMainPoll"
                  checked={showInMainPoll}
                  onChange={(e) => setShowInMainPoll(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="showInMainPoll" className="text-sm font-medium">
                  메인 화면 "실시간 투표"에 표시
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? '등록 중...' : '이슈 등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
