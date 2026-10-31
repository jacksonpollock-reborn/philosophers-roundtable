"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  title: string;
  era: string | null;
  avatarColor: string;
  isDefault: boolean;
}

export default function NewDiscussionPage() {
  return (
    <Suspense>
      <NewDiscussionContent />
    </Suspense>
  );
}

function NewDiscussionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then(setPersonas);
    // Pre-fill from URL params (from Topics page)
    const topicParam = searchParams.get("topic");
    const descParam = searchParams.get("description");
    if (topicParam) setTitle(topicParam);
    if (descParam) setDescription(descParam);
  }, [searchParams]);

  function togglePersona(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Please enter a discussion topic");
      return;
    }
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 personas");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          personaIds: Array.from(selectedIds),
        }),
      });
      const discussion = await res.json();
      router.push(`/discussions/${discussion.id}`);
    } catch {
      toast.error("Failed to create discussion");
      setCreating(false);
    }
  }

  // Group personas by category
  const categories = new Map<string, Persona[]>();
  for (const p of personas) {
    const cat = p.title.includes("Philosopher") || p.title.includes("Existentialist") || p.title.includes("Founder of Taoism") || p.title.includes("Sage")
      ? "Philosophy"
      : p.title.includes("Psycho") || p.title.includes("Psychoanal")
      ? "Psychology"
      : p.title.includes("Econom")
      ? "Economics"
      : p.title.includes("President") || p.title.includes("Strategist") || p.title.includes("Political")
      ? "Politics"
      : p.title.includes("Military")
      ? "Strategy"
      : "Religion & Spirituality";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(p);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">New Discussion</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Choose a topic and select the minds you want at the table
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Topic */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-base font-medium">
              Discussion Topic
            </Label>
            <Input
              id="title"
              placeholder='e.g. "Is free will an illusion?"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 text-lg"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-base font-medium">
              Context (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add context or framing for the discussion..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim() || selectedIds.size < 2}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Creating..." : `Start Discussion (${selectedIds.size} personas)`}
            </button>
            {selectedIds.size < 2 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Select at least 2 personas to start
              </p>
            )}
          </div>
        </div>

        {/* Right: Persona Selection */}
        <div>
          <Label className="text-base font-medium">Select Personas</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Click to select/deselect. Choose 2-6 personas.
          </p>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {Array.from(categories.entries()).map(([category, ps]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ps.map((p) => {
                    const selected = selectedIds.has(p.id);
                    return (
                      <Card
                        key={p.id}
                        onClick={() => togglePersona(p.id)}
                        className={`cursor-pointer transition-all ${
                          selected
                            ? "ring-2 ring-primary bg-primary/5"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                            style={{ backgroundColor: p.avatarColor }}
                          >
                            {p.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.title}
                            </p>
                          </div>
                          {selected && (
                            <Badge className="ml-auto shrink-0" variant="default">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
