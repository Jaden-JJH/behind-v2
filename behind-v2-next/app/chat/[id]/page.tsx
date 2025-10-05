'use client'

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, Shuffle, MessageCircle } from "lucide-react";
import { allIssues } from "@/lib/data/issues";
import { getLS, setLS, chatKey, nickKey, randomNickname, formatTime } from "@/lib/utils";

interface Message {
  id: number;
  author: string;
  text: string;
  ts: number;
  isSystem?: boolean;
}

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const issue = allIssues.find((i) => i.id === roomId) || allIssues[0];

  const [nick, setNick] = useState(() => getLS<string>(nickKey(roomId), randomNickname()) || randomNickname());
  const [messages, setMessages] = useState<Message[]>(() => getLS<Message[]>(chatKey(roomId), null) || [
    { id: 1, author: "운영봇", text: "오늘 이슈 요약: 내부자 개입 가능성 제기", ts: Date.now() - 1000 * 60 * 30, isSystem: true },
    { id: 2, author: "활동자1014", text: "보안팀이 뚫린거면 진짜 심각한거 아님?", ts: Date.now() - 1000 * 60 * 20 },
    { id: 3, author: "활동자5823", text: "ㄹㅇ... 나도 걱정된다", ts: Date.now() - 1000 * 60 * 10 },
  ]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLS(chatKey(roomId), messages); }, [roomId, messages]);
  useEffect(() => { setLS(nickKey(roomId), nick); }, [roomId, nick]);
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const next = messages.concat([{ id: Date.now(), author: nick, text, ts: Date.now() }]);
    setMessages(next);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="truncate">{issue.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground flex-wrap">
                <span>{issue.participants}/{issue.capacity}</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="truncate">
                  <strong className="text-foreground">{nick}</strong>
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNick(randomNickname())}
            >
              <Shuffle className="w-4 h-4 mr-1.5" />
              닉네임 변경
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <div ref={scrollerRef} className="h-[500px] overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>아직 메시지가 없습니다.</p>
                  <p className="text-sm">첫 메시지를 남겨보세요!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOwn = m.author === nick && !m.isSystem;
                  const isSystem = m.isSystem;

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="bg-muted px-3 py-1.5 rounded-full max-w-md text-center">
                          <p className="text-muted-foreground">{m.text}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={isOwn ? "bg-indigo-600 text-white" : "bg-muted"}>
                          {m.author.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                        {!isOwn && (
                          <span className="text-sm text-muted-foreground px-1">{m.author}</span>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${isOwn ? "bg-indigo-600 text-white" : "bg-muted"}`}>
                          <p className="break-words">{m.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">{formatTime(m.ts)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          <Button onClick={send} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  );
}
