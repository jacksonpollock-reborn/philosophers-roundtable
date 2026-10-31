import type { LLMProvider } from "./provider";

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl: string = "http://localhost:11434",
    model: string = "llama3.1"
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
      }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data = await response.json();
    return data.response;
  }

  async *generateStream(
    systemPrompt: string,
    userPrompt: string
  ): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: true,
      }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) yield parsed.response;
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
