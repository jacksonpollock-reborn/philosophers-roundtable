"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Persona {
  id: string;
  name: string;
  title: string;
  era: string | null;
  avatarColor: string;
  systemPrompt: string;
  isDefault: boolean;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then(setPersonas)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {personas.length} thinkers available for discussions
          </p>
        </div>
        <Link
          href="/personas/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Create Persona
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((p) => (
            <Card key={p.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.title}
                    </p>
                    {p.era && (
                      <p className="text-xs text-muted-foreground">{p.era}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {p.systemPrompt.slice(0, 150)}...
                </p>
                <Badge variant={p.isDefault ? "secondary" : "outline"}>
                  {p.isDefault ? "Built-in" : "Custom"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
