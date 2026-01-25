'use client'

import { useState, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface MobileTabsWrapperProps {
  tabs: Tab[]
  desktopContent: ReactNode
}

export function MobileTabsWrapper({ tabs, desktopContent }: MobileTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  return (
    <>
      {/* 모바일 탭 뷰 */}
      <div className="md:hidden">
        {/* 탭 네비게이션 */}
        <div className="sticky top-[60px] z-20 bg-white border-b border-slate-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-3 py-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={activeTab === tab.id ? 'block' : 'hidden'}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>

      {/* 데스크톱 뷰 (기존 레이아웃) */}
      <div className="hidden md:block">
        {desktopContent}
      </div>
    </>
  )
}
