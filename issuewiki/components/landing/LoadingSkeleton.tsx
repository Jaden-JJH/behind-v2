export function MainContentSkeleton() {
  return (
    <div className="md:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-96"></div>
        </div>
      </div>

      {/* 활성 이슈 카드 스켈레톤 */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>

      {/* 투표 섹션 스켈레톤 */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
            <div className="space-y-2">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 지나간 이슈 스켈레톤 */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <aside className="space-y-4 sm:space-y-5 md:space-y-6 animate-pulse">
      {/* 실시간 인기 이슈 스켈레톤 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-slate-200 rounded flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 제보된 이슈 스켈레톤 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
