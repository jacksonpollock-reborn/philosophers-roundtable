"use client";

import { useEffect, useState, useRef, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Persona {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
}

interface Message {
  id: string;
  content: string;
  round: number;
  personaId: string | null;
  persona: Persona | null;
  createdAt: string;
}

interface Discussion {
  id: string;
  title: string;
  description: string | null;
  status: string;
  totalRounds: number;
  personas: Array<{ persona: Persona; turnOrder: number }>;
}

export default function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generating, setGenerating] = useState(false);
  const [typingPersona, setTypingPersona] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [humanInput, setHumanInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/discussions/${id}`).then((r) => r.json()),
      fetch(`/api/discussions/${id}/messages`).then((r) => r.json()),
    ]).then(([disc, msgs]) => {
      setDiscussion(disc);
      setMessages(msgs);
    });
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  async function generateRound() {
    setGenerating(true);
    setStreamingText("");
    setTypingPersona(null);

    try {
      const res = await fetch(`/api/discussions/${id}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));

          switch (data.type) {
            case "typing":
              setTypingPersona(data.personaId);
              setStreamingText("");
              break;
            case "chunk":
              setStreamingText((prev) => prev + data.text);
              break;
            case "done":
              // Add the completed message
              setMessages((prev) => [
                ...prev,
                {
                  id: data.message.id,
                  content: data.message.content,
                  round: data.message.round,
                  personaId: data.message.personaId,
                  persona:
                    discussion?.personas.find(
                      (p) => p.persona.id === data.message.personaId
                    )?.persona || null,
                  createdAt: data.message.createdAt,
                },
              ]);
              setStreamingText("");
              setTypingPersona(null);
              break;
            case "round_complete":
              setDiscussion((prev) =>
                prev ? { ...prev, totalRounds: data.round } : prev
              );
              break;
            case "error":
              toast.error(data.message);
              break;
          }
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate round"
      );
    } finally {
      setGenerating(false);
      setTypingPersona(null);
      setStreamingText("");
    }
  }

  async function sendHumanMessage() {
    if (!humanInput.trim()) return;
    const content = humanInput.trim();
    setHumanInput("");

    try {
      const res = await fetch(`/api/discussions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    } catch {
      toast.error("Failed to send message");
    }
  }

  if (!discussion) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Group messages by round
  const rounds = new Map<number, Message[]>();
  for (const msg of messages) {
    if (!rounds.has(msg.round)) rounds.set(msg.round, []);
    rounds.get(msg.round)!.push(msg);
  }

  const personaMap = new Map(
    discussion.personas.map((p) => [p.persona.id, p.persona])
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border p-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{discussion.title}</h1>
              {discussion.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {discussion.description}
                </p>
              )}
            </div>
            <Badge variant={discussion.status === "active" ? "default" : "secondary"}>
              Round {discussion.totalRounds}
            </Badge>
          </div>
          {/* Persona bar */}
          <div className="flex items-center gap-3 mt-4">
            {discussion.personas.map(({ persona }) => (
              <div key={persona.id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: persona.avatarColor }}
                >
                  {persona.name[0]}
                </div>
                <span className="text-xs text-muted-foreground">
                  {persona.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.length === 0 && !generating && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                No messages yet. Click &quot;Generate Round&quot; to start the
                discussion.
              </p>
            </div>
          )}

          {Array.from(rounds.entries()).map(([round, msgs]) => (
            <div key={round}>
              {round > 0 && (
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Round {round}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  persona={msg.personaId ? personaMap.get(msg.personaId) || null : null}
                />
              ))}
            </div>
          ))}

          {/* Streaming message */}
          {typingPersona && (
            <div className="mt-2">
              {streamingText ? (
                <MessageBubble
                  message={{
                    id: "streaming",
                    content: streamingText,
                    round: discussion.totalRounds + 1,
                    personaId: typingPersona,
                    persona: personaMap.get(typingPersona) || null,
                    createdAt: new Date().toISOString(),
                  }}
                  persona={personaMap.get(typingPersona) || null}
                  streaming
                />
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium animate-pulse"
                    style={{
                      backgroundColor:
                        personaMap.get(typingPersona)?.avatarColor || "#666",
                    }}
                  >
                    {personaMap.get(typingPersona)?.name[0] || "?"}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {personaMap.get(typingPersona)?.name} is thinking...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Add your own thoughts to the discussion..."
              value={humanInput}
              onChange={(e) => setHumanInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendHumanMessage()}
              disabled={generating}
            />
            <button
              onClick={sendHumanMessage}
              disabled={!humanInput.trim() || generating}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <button
            onClick={generateRound}
            disabled={generating}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? "Generating..." : "Generate Round"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  persona,
  streaming,
}: {
  message: Message;
  persona: Persona | null;
  streaming?: boolean;
}) {
  const isHuman = !message.personaId;

  return (
    <div className={`flex gap-3 p-4 rounded-lg ${isHuman ? "bg-primary/5" : "hover:bg-accent/30"} transition-colors`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 mt-0.5 ${
          streaming ? "animate-pulse" : ""
        }`}
        style={{
          backgroundColor: isHuman
            ? "#6366f1"
            : persona?.avatarColor || "#666",
        }}
      >
        {isHuman ? "You" : persona?.name[0] || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-sm">
            {isHuman ? "You" : persona?.name || "Unknown"}
          </span>
          {!isHuman && persona && (
            <span className="text-xs text-muted-foreground">
              {persona.title}
            </span>
          )}
        </div>
        <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {streaming && (
            <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
