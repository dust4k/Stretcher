import OpenAI from "openai";
import { z } from "zod";
import { hasOpenAIKey } from "@/lib/env";
import { getRoutineSummary } from "@/lib/db/queries";

const placementSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  phase: z.enum(["warmup", "main", "cooldown"]),
  bodyAreas: z.array(z.string()),
  durationSec: z.number().int().positive().optional(),
  insertIndex: z.number().int().min(0),
  rationale: z.string(),
});

export type PlacementResult = z.infer<typeof placementSchema>;

function getOpenAI() {
  if (!hasOpenAIKey()) {
    throw new Error("OPENAI_API_KEY is not set or invalid");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyzeAndPlaceStretch(input: {
  caption?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  mediaCount?: number;
}): Promise<PlacementResult> {
  const routine = await getRoutineSummary();
  const maxIndex = routine.length;
  const imageUrls = input.imageUrls?.length
    ? input.imageUrls.slice(0, 4)
    : input.thumbnailUrl
      ? [input.thumbnailUrl]
      : [];

  const mediaNote =
    (input.mediaCount ?? imageUrls.length) > 1
      ? `\nThis post has ${input.mediaCount ?? imageUrls.length} images (likely step-by-step photos). Write instructions that reference each step in order.`
      : imageUrls.length === 1 && !input.caption
        ? "\nThis is a photo-only stretch post with no caption. Infer the stretch from the image."
        : "";

  const systemPrompt = `You are a stretching routine planner. Given an Instagram stretch post (video, photo, or carousel) and the user's existing routine, generate:
- title: short descriptive name for the stretch
- instructions: clear step-by-step instructions (2-5 steps) for performing the stretch safely
- phase: "warmup", "main", or "cooldown"
- bodyAreas: array of targeted body areas (e.g. "hips", "hamstrings", "shoulders", "lower back")
- durationSec: suggested hold duration in seconds (typically 20-60)
- insertIndex: 0-based index where this stretch should be inserted in the routine order
- rationale: one sentence explaining why this placement makes sense relative to neighboring stretches

Placement rules:
- Warmups go first (low intensity, general mobility)
- Main stretches in the middle (targeted, moderate intensity)
- Cooldowns last (gentle, relaxing)
- Sequence complementary areas (e.g. hip opener before hamstring stretch)
- Avoid clustering multiple intense stretches on the same body area back-to-back
- insertIndex must be between 0 and ${maxIndex} (inclusive; ${maxIndex} means append at end)${mediaNote}`;

  const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Caption: ${input.caption || "(no caption available)"}\n\nExisting routine (${routine.length} stretches):\n${
        routine.length === 0
          ? "(empty — this will be the first stretch)"
          : routine
              .map(
                (s, i) =>
                  `[${i}] "${s.title}" (${s.phase}, areas: ${s.bodyAreas.join(", ") || "general"})`
              )
              .join("\n")
      }`,
    },
  ];

  for (const imageUrl of imageUrls) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl, detail: "low" },
    });
  }

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty response");
  }

  const parsed = JSON.parse(content);
  return placementSchema.parse(parsed);
}
