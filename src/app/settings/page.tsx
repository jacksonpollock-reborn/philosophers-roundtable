"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Settings {
  provider: string;
  geminiApiKey: string | null;
  hasGeminiKey: boolean;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setSettings(s);
      });
  }, []);

  async function save(data: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setSettings(updated);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div className="p-8">Loading...</div>;

  const isGemini = settings.provider === "gemini";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Configure your AI provider for generating discussion responses
      </p>

      <div className="space-y-6">
        {/* Provider Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {isGemini ? "Google Gemini" : "Ollama (Local)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isGemini
                    ? "Cloud-based, requires API key"
                    : "Local models, requires Ollama installed"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Gemini</span>
                <Switch
                  checked={!isGemini}
                  onCheckedChange={(checked) =>
                    save({ provider: checked ? "ollama" : "gemini" })
                  }
                />
                <span className="text-xs text-muted-foreground">Ollama</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gemini Settings */}
        {isGemini && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google Gemini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={
                      settings.hasGeminiKey
                        ? "Key is set (enter new to replace)"
                        : "Enter your Gemini API key"
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (apiKey) {
                        save({ geminiApiKey: apiKey });
                        setApiKey("");
                      }
                    }}
                    disabled={!apiKey || saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get your key at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    aistudio.google.com/apikey
                  </a>
                </p>
              </div>
              <div>
                <Label htmlFor="geminiModel">Model</Label>
                <select
                  id="geminiModel"
                  value={settings.geminiModel}
                  onChange={(e) => save({ geminiModel: e.target.value })}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="gemini-2.0-flash">
                    Gemini 2.0 Flash (Cheapest, 2K RPM)
                  </option>
                  <option value="gemini-2.5-flash-lite">
                    Gemini 2.5 Flash Lite (4K RPM, very fast)
                  </option>
                  <option value="gemini-2.5-flash">
                    Gemini 2.5 Flash (Recommended - 1K RPM, smart + affordable)
                  </option>
                  <option value="gemini-3-flash-preview">
                    Gemini 3 Flash Preview (1K RPM, latest)
                  </option>
                  <option value="gemini-3.1-pro-preview">
                    Gemini 3.1 Pro Preview (25 RPM, best quality, most expensive)
                  </option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Gemini 2.0 Flash is the best value. Pro models give deeper responses but cost more and have lower rate limits.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ollama Settings */}
        {!isGemini && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ollama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ollamaUrl">Base URL</Label>
                <Input
                  id="ollamaUrl"
                  value={settings.ollamaBaseUrl}
                  onChange={(e) => save({ ollamaBaseUrl: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ollamaModel">Model</Label>
                <Input
                  id="ollamaModel"
                  value={settings.ollamaModel}
                  onChange={(e) => save({ ollamaModel: e.target.value })}
                  placeholder="e.g. llama3.1, mistral, phi3"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
