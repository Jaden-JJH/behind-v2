'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendingIssue {
  id: string
  display_id: number
  title: string
  change: string
}

interface TrendingSectionProps {
  issues: TrendingIssue[]
}

function parseChangeValue(changeStr: string): number {
  if (!changeStr || changeStr === '0' || changeStr === '-') return 0
  const num = parseInt(changeStr, 10)
  return isNaN(num) ? 0 : num
}

export function TrendingSection({ issues }: TrendingSectionProps) {
  // 이슈가 없으면 영역 숨김
  if (!issues || issues.length === 0) {
    return null
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm gap-2">
      <CardHeader className="pb-0">
        <CardTitle className="text-base md:text-lg font-semibold text-slate-800">실시간 인기 이슈</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ol className="space-y-1">
          {issues.map((item, idx) => {
            const changeValue = parseChangeValue(item.change)
            return (
              <li
                key={item.id}
                onClick={() => window.location.href = `/issues/${item.display_id}`}
                className="flex items-center gap-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-all group py-2.5 px-1 rounded-lg"
              >
                <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-md font-semibold text-sm bg-slate-100 text-slate-500 group-hover:bg-yellow-100 group-hover:text-yellow-700 transition-colors">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm sm:text-base font-medium line-clamp-1">{item.title}</span>
                <span className="flex-shrink-0 w-5 flex justify-center">
                  {changeValue > 0 && (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  {changeValue < 0 && (
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                  )}
                  {changeValue === 0 && (
                    <Minus className="w-4 h-4 text-slate-300" />
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
