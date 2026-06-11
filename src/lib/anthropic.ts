import Anthropic from "@anthropic-ai/sdk";

// Server-side only. The API key must never reach the client — this module is
// imported exclusively from route handlers.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function askClaude(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages,
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
