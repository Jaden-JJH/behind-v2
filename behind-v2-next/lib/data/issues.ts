export interface Issue {
  id: string;
  title: string;
  participants: number;
  capacity: number;
  preview: string;
  thumbnail?: string;
  upvotes?: number;
  commentCount?: number;
  liveViewers?: number;
  category?: string;
  isActive?: boolean;
  createdAt: number;
  mediaEmbed?: {
    youtube?: string;
    news?: Array<{
      title: string;
      source: string;
      url: string;
    }>;
  };
}

export const allIssues: Issue[] = [
  {
    id: "skt-kt-hack",
    title: "2025 SKT·KT 해킹 사건",
    participants: 18,
    capacity: 30,
    preview: "보안 뚫린 이유가 내부자 때문이라는 얘기도 있다는데...",
    thumbnail: "https://images.unsplash.com/photo-1666875758376-25755544ba8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlciUyMHNlY3VyaXR5JTIwaGFja2luZ3xlbnwxfHx8fDE3NTk1NjM2MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    upvotes: 234,
    commentCount: 47,
    liveViewers: 12,
    category: "tech",
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    mediaEmbed: {
      youtube: "dQw4w9WgXcQ",
      news: [
        { title: "통신사 보안 사고 발생... 개인정보 유출 우려", source: "테크뉴스", url: "#" },
        { title: "전문가 \"내부자 개입 가능성 높아\"", source: "보안일보", url: "#" }
      ]
    }
  },
  {
    id: "idol-a-contract",
    title: "아이돌 A 계약 해지설",
    participants: 25,
    capacity: 30,
    preview: "팬들 사이에서는 사실 이미...",
    thumbnail: "https://images.unsplash.com/photo-1566477712363-3c75dd39b416?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwY29uY2VydCUyMHN0YWdlfGVufDF8fHx8MTc1OTQ0OTg4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    upvotes: 187,
    commentCount: 92,
    liveViewers: 8,
    category: "entertainment",
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 5
  },
  {
    id: "politician-b-scandal",
    title: "정치인 B 발언 논란, 진실은 무엇인가",
    participants: 30,
    capacity: 30,
    preview: "논란이 된 발언의 전후 맥락을 보면 다른 의미로 해석될 수 있다는 주장이...",
    thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1080",
    upvotes: 312,
    commentCount: 156,
    liveViewers: 0,
    category: "politics",
    isActive: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: "company-c-restructure",
    title: "대기업 C 구조조정 내부 정보",
    participants: 15,
    capacity: 30,
    preview: "특정 부서가 통폐합될 예정이라는 내부 제보가 있었습니다.",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080",
    upvotes: 198,
    commentCount: 67,
    liveViewers: 15,
    category: "economy",
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: "sports-match-fixing",
    title: "프로야구 승부조작 의혹 제기",
    participants: 22,
    capacity: 30,
    preview: "특정 경기에서 이상한 플레이가 연속으로 발생했다는 증언이...",
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1080",
    upvotes: 276,
    commentCount: 203,
    liveViewers: 22,
    category: "sports",
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 8
  },
  {
    id: "subway-accident",
    title: "지하철 사고 원인 분석",
    participants: 0,
    capacity: 30,
    preview: "시스템 오류인지 인적 오류인지에 대한 전문가 의견이 엇갈리고 있습니다.",
    thumbnail: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1080",
    upvotes: 89,
    commentCount: 34,
    liveViewers: 0,
    category: "society",
    isActive: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7
  },
  {
    id: "ai-copyright",
    title: "AI 창작물 저작권 논란, 어디까지 인정되어야 하나",
    participants: 12,
    capacity: 30,
    preview: "AI가 생성한 이미지의 저작권을 두고 법적 공방이 벌어지고 있습니다.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080",
    upvotes: 145,
    commentCount: 78,
    liveViewers: 12,
    category: "tech",
    isActive: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 18
  },
];
