export const CATEGORY_EN_TO_KO: Record<string, string> = {
  politics: '정치',
  economy: '경제',
  entertainment: '연예',
  tech: 'IT/테크',
  sports: '스포츠',
  society: '사회',
  general: '사회'
}

export const CATEGORY_KO_VALUES = Array.from(
  new Set(Object.values(CATEGORY_EN_TO_KO))
)

export function normalizeCategory(value?: string | null): string | null {
  if (!value) return value ?? null
  const trimmed = value.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  const mapped = CATEGORY_EN_TO_KO[lower]
  return mapped ?? trimmed
}

export function getEnglishCategory(value?: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const entry = Object.entries(CATEGORY_EN_TO_KO).find(
    ([, ko]) => ko === trimmed
  )
  return entry?.[0]
}
