import { prisma } from "@/lib/db";
import { getProvider } from "@/lib/llm/factory";
import { buildPrompt } from "@/lib/personas/prompt-builder";

export async function generateRound(discussionId: string) {
  const discussion = await prisma.discussion.findUniqueOrThrow({
    where: { id: discussionId },
    include: {
      personas: {
        include: { persona: true },
        orderBy: { turnOrder: "asc" },
      },
      messages: {
        include: { persona: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (discussion.status !== "active") {
    throw new Error("Discussion is not active");
  }

  const provider = await getProvider();
  const newRound = discussion.totalRounds + 1;
  const allPersonas = discussion.personas.map((dp) => dp.persona);
  const messagesSoFar = [...discussion.messages];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const dp of discussion.personas) {
          const persona = dp.persona;

          // Signal typing
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "typing",
                personaId: persona.id,
                personaName: persona.name,
              })}\n\n`
            )
          );

          const { systemPrompt, userPrompt } = buildPrompt({
            persona,
            topic: discussion.title,
            description: discussion.description,
            messages: messagesSoFar,
            allPersonas,
          });

          // Stream the response
          let fullText = "";
          try {
            for await (const chunk of provider.generateStream(
              systemPrompt,
              userPrompt
            )) {
              fullText += chunk;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "chunk",
                    personaId: persona.id,
                    text: chunk,
                  })}\n\n`
                )
              );
            }
          } catch (err) {
            // Fall back to non-streaming
            fullText = await provider.generateText(systemPrompt, userPrompt);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chunk",
                  personaId: persona.id,
                  text: fullText,
                })}\n\n`
              )
            );
          }

          // Save message
          const message = await prisma.message.create({
            data: {
              discussionId,
              personaId: persona.id,
              content: fullText,
              round: newRound,
            },
            include: { persona: true },
          });

          messagesSoFar.push(message);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                personaId: persona.id,
                message: {
                  id: message.id,
                  content: message.content,
                  round: message.round,
                  personaId: message.personaId,
                  createdAt: message.createdAt,
                },
              })}\n\n`
            )
          );

          // Small delay between personas for rate limiting
          await new Promise((r) => setTimeout(r, 1500));
        }

        // Update discussion round count
        await prisma.discussion.update({
          where: { id: discussionId },
          data: { totalRounds: newRound },
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "round_complete", round: newRound })}\n\n`
          )
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message:
                error instanceof Error ? error.message : "Unknown error",
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
