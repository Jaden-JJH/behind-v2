import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 <span className="font-semibold">스톤즈랩</span>. All rights reserved.
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
