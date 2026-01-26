import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CsrfProvider } from "@/components/csrf-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "이슈위키 - 대한민국 No.1 뉴스 아카이브",
  description: "지금 가장 뜨거운 이슈의 뒷이야기를 나누는 공간, 이슈위키에서 다양한 시각으로 뉴스를 탐색하세요.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  verification: {
    other: {
      'naver-site-verification': '2d6f9cfd814eb672ae82b58955ba054bdd0be398',
    },
  },
  openGraph: {
    title: "이슈위키 - 대한민국 No.1 뉴스 아카이브",
    description: "지금 가장 뜨거운 이슈의 뒷이야기를 나누는 공간, 이슈위키에서 다양한 시각으로 뉴스를 탐색하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "이슈위키",
    images: [
      {
        url: "/issuewiki-og.png",
        width: 1200,
        height: 630,
        alt: "이슈위키 - 대한민국 No.1 뉴스 아카이브",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "이슈위키 - 대한민국 No.1 뉴스 아카이브",
    description: "지금 가장 뜨거운 이슈의 뒷이야기를 나누는 공간",
    images: ["/issuewiki-og.png"],
  },
  keywords: ["뉴스", "이슈", "아카이브", "이슈위키", "IssueWiki", "뉴스 아카이브", "이슈 정리"],
  authors: [{ name: "스톤즈랩" }],
  creator: "스톤즈랩",
  publisher: "스톤즈랩",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <GoogleAnalytics />
        <Header />
        <CsrfProvider>
          <main className="flex-1">
            {children}
          </main>
        </CsrfProvider>
        <Footer />
        <Toaster richColors />
      </body>
    </html>
  );
}
