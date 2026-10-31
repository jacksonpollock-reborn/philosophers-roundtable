import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }
  // Don't expose the full API key
  return NextResponse.json({
    ...settings,
    geminiApiKey: settings.geminiApiKey
      ? `${settings.geminiApiKey.slice(0, 8)}...`
      : null,
    hasGeminiKey: !!settings.geminiApiKey,
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { provider, geminiApiKey, geminiModel, ollamaBaseUrl, ollamaModel } =
    body as {
      provider?: string;
      geminiApiKey?: string;
      geminiModel?: string;
      ollamaBaseUrl?: string;
      ollamaModel?: string;
    };

  const data: Record<string, string> = {};
  if (provider !== undefined) data.provider = provider;
  if (geminiApiKey !== undefined) data.geminiApiKey = geminiApiKey;
  if (geminiModel !== undefined) data.geminiModel = geminiModel;
  if (ollamaBaseUrl !== undefined) data.ollamaBaseUrl = ollamaBaseUrl;
  if (ollamaModel !== undefined) data.ollamaModel = ollamaModel;

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({
    ...settings,
    geminiApiKey: settings.geminiApiKey
      ? `${settings.geminiApiKey.slice(0, 8)}...`
      : null,
    hasGeminiKey: !!settings.geminiApiKey,
  });
}
