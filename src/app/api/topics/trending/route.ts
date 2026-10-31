import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/llm/factory";

export async function GET() {
  try {
    const provider = await getProvider();

    const prompt = `Generate 8 thought-provoking discussion topics that would spark an interesting debate between philosophers, psychologists, economists, politicians, and religious thinkers. Cover a mix of categories: philosophy, politics, economics, psychology, technology ethics, and social issues.

For each topic provide a JSON object with:
- "title": A concise question or statement (under 15 words)
- "description": A 1-2 sentence description framing it as a debate question
- "category": One of: philosophy, politics, economics, psychology, technology, social

Return ONLY a valid JSON array of objects. No other text.`;

    const result = await provider.generateText(
      "You are a helpful assistant that generates discussion topics. Always respond with valid JSON only.",
      prompt
    );

    // Parse the JSON from the response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse topics from AI response");
    }

    const topics = JSON.parse(jsonMatch[0]) as Array<{
      title: string;
      description: string;
      category: string;
    }>;

    // Save to database
    const saved = [];
    for (const topic of topics) {
      const created = await prisma.topic.create({
        data: {
          title: topic.title,
          description: topic.description,
          category: topic.category,
          source: "trending",
        },
      });
      saved.push(created);
    }

    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch topics",
      },
      { status: 500 }
    );
  }
}
