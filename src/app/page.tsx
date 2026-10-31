"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Discussion {
  id: string;
  title: string;
  description: string | null;
  status: string;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
  personas: Array<{
    persona: { id: string; name: string; avatarColor: string };
  }>;
  _count: { messages: number };
}

export default function HomePage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discussions")
      .then((r) => r.json())
      .then(setDiscussions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Discussions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Watch great minds debate the questions that matter
          </p>
        </div>
        <Link
          href="/discussions/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          New Discussion
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium mb-1">No discussions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new discussion to see great minds debate
            </p>
            <Link href="/discussions/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Create Your First Discussion
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {discussions.map((d) => (
            <Link key={d.id} href={`/discussions/${d.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{d.title}</CardTitle>
                    <Badge variant={d.status === "active" ? "default" : "secondary"}>
                      {d.status}
                    </Badge>
                  </div>
                  {d.description && (
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {d.personas.map(({ persona }) => (
                        <div
                          key={persona.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium -ml-1 first:ml-0 ring-2 ring-card"
                          style={{ backgroundColor: persona.avatarColor }}
                          title={persona.name}
                        >
                          {persona.name[0]}
                        </div>
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        {d.personas.map((p) => p.persona.name).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{d._count.messages} messages</span>
                      <span>{d.totalRounds} rounds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
