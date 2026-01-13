'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowDown } from "lucide-react"

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
  const formatChange = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-1 sm:pb-2">
        <CardTitle className="text-base md:text-lg font-semibold text-slate-800">실시간 인기 이슈</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 sm:space-y-2.5">
          {issues.map((item, idx) => {
            const changeValue = parseChangeValue(item.change)
            return (
              <li
                key={item.id}
                onClick={() => window.location.href = `/issues/${item.display_id}`}
                className="flex items-center gap-2.5 sm:gap-3 text-slate-700 hover:text-indigo-600 cursor-pointer transition-all group py-1.5 min-h-[44px]"
              >
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-full font-bold text-sm sm:text-base bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm sm:text-base font-medium leading-relaxed">{item.title}</span>
                {changeValue !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 text-xs sm:text-sm font-bold ${
                    changeValue > 0
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {changeValue > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" />
                    )}
                    <span>{formatChange(Math.abs(changeValue))}</span>
                  </div>
                )}
                {changeValue === 0 && (
                  <span className="text-xs sm:text-sm text-slate-400 flex-shrink-0 px-2">-</span>
                )}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
