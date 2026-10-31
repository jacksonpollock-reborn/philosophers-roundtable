import { prisma } from "@/lib/db";
import type { LLMProvider } from "./provider";
import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";

export async function getProvider(): Promise<LLMProvider> {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) throw new Error("Settings not configured. Please visit /settings.");

  if (settings.provider === "ollama") {
    return new OllamaProvider(
      settings.ollamaBaseUrl || "http://localhost:11434",
      settings.ollamaModel || "llama3.1"
    );
  }

  if (!settings.geminiApiKey) {
    throw new Error(
      "Gemini API key not configured. Please visit /settings and enter your API key."
    );
  }

  return new GeminiProvider(
    settings.geminiApiKey,
    settings.geminiModel || "gemini-2.0-flash"
  );
}
