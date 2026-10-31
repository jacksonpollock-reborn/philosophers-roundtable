"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  source: string | null;
  createdAt: string;
}

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then(setTopics)
      .finally(() => setLoading(false));
  }, []);

  async function fetchTrending() {
    setFetching(true);
    try {
      const res = await fetch("/api/topics/trending");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const newTopics = await res.json();
      setTopics((prev) => [...newTopics, ...prev]);
      toast.success(`Fetched ${newTopics.length} new topics`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch trending topics"
      );
    } finally {
      setFetching(false);
    }
  }

  function startDiscussion(topic: Topic) {
    const params = new URLSearchParams({ topic: topic.title });
    if (topic.description) params.set("description", topic.description);
    router.push(`/discussions/new?${params}`);
  }

  const categoryColors: Record<string, string> = {
    philosophy: "bg-purple-500/10 text-purple-400",
    politics: "bg-red-500/10 text-red-400",
    economics: "bg-green-500/10 text-green-400",
    psychology: "bg-blue-500/10 text-blue-400",
    technology: "bg-cyan-500/10 text-cyan-400",
    social: "bg-orange-500/10 text-orange-400",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Topics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse discussion topics or fetch trending ones
          </p>
        </div>
        <button
          onClick={fetchTrending}
          disabled={fetching}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {fetching ? "Fetching..." : "Fetch Trending Topics"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-medium mb-1">No topics yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fetch trending topics or create a discussion with any topic
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => startDiscussion(topic)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm leading-tight">
                    {topic.title}
                  </h3>
                  {topic.category && (
                    <Badge
                      variant="secondary"
                      className={
                        categoryColors[topic.category] || "bg-muted text-muted-foreground"
                      }
                    >
                      {topic.category}
                    </Badge>
                  )}
                </div>
                {topic.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {topic.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {topic.source === "trending" && (
                    <Badge variant="outline" className="text-xs">
                      Trending
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Click to start discussion
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
