"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const colorOptions = [
  "#6366f1", "#dc2626", "#ec4899", "#7c3aed", "#0891b2",
  "#16a34a", "#ea580c", "#d97706", "#64748b", "#059669",
  "#4338ca", "#b91c1c", "#1e40af", "#a16207", "#78716c",
];

export default function NewPersonaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [era, setEra] = useState("");
  const [avatarColor, setAvatarColor] = useState(colorOptions[0]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !title.trim() || !systemPrompt.trim()) {
      toast.error("Name, title, and system prompt are required");
      return;
    }

    setCreating(true);
    try {
      await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          era: era.trim() || undefined,
          avatarColor,
          systemPrompt: systemPrompt.trim(),
        }),
      });
      toast.success("Persona created!");
      router.push("/personas");
    } catch {
      toast.error("Failed to create persona");
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create Persona</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Define a new thinker to join your discussions
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persona Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder='e.g. "Hannah Arendt"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder='e.g. "Political Theorist"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="era">Era (optional)</Label>
            <Input
              id="era"
              placeholder='e.g. "20th Century (1906-1975)"'
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Avatar Color</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    avatarColor === color
                      ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="prompt">System Prompt</Label>
            <p className="text-xs text-muted-foreground mb-1">
              Define this persona&apos;s personality, beliefs, speaking style,
              and intellectual framework
            </p>
            <Textarea
              id="prompt"
              placeholder={`You are [Name]. You speak with... You believe... Your rhetorical style is... You often reference...`}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="mt-1"
              rows={8}
            />
          </div>

          {/* Preview */}
          {name && (
            <div className="border border-border rounded-lg p-4 bg-accent/30">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: avatarColor }}
                >
                  {name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{name || "Name"}</p>
                  <p className="text-xs text-muted-foreground">
                    {title || "Title"} {era ? `(${era})` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !title.trim() || !systemPrompt.trim()}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Persona"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
