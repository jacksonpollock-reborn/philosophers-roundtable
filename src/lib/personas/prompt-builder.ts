import type { Persona, Message } from "@prisma/client";

interface PromptContext {
  persona: Persona;
  topic: string;
  description?: string | null;
  messages: (Message & { persona: Persona | null })[];
  allPersonas: Persona[];
}

export function buildPrompt(ctx: PromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { persona, topic, description, messages, allPersonas } = ctx;

  // Layer 1: Identity + Layer 2: Behavior rules
  const systemPrompt = `You are ${persona.name}, ${persona.title}${persona.era ? ` (${persona.era})` : ""}.

${persona.systemPrompt}

BEHAVIORAL RULES:
- Stay in character at all times. Never break character or acknowledge that you are an AI.
- Respond in 2-4 paragraphs. Be conversational and engaging, not essay-like.
- Reference specific ideas, concepts, and works from your intellectual tradition.
- When replying to another participant, address them by name and engage directly with their argument.
- You may disagree strongly but remain intellectually honest and substantive.
- Do not repeat what others have already said — build on, challenge, or reframe their points.
- Use your characteristic rhetorical style and vocabulary.`;

  // Layer 3: Discussion context
  const personaNames = allPersonas.map((p) => p.name).join(", ");

  let userPrompt = `DISCUSSION TOPIC: "${topic}"`;
  if (description) {
    userPrompt += `\n${description}`;
  }
  userPrompt += `\n\nParticipants in this discussion: ${personaNames}\n`;

  if (messages.length > 0) {
    userPrompt += "\n--- PREVIOUS MESSAGES ---\n";
    for (const msg of messages) {
      const speaker = msg.persona ? msg.persona.name : "Human Moderator";
      userPrompt += `\n[${speaker}]:\n${msg.content}\n`;
    }
    userPrompt += "\n--- END OF PREVIOUS MESSAGES ---\n";
  }

  userPrompt += `\nYou are now responding as ${persona.name}. Address the topic and engage with what others have said.`;

  return { systemPrompt, userPrompt };
}
