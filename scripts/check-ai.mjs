import { readFileSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";

const env = readFileSync(".env.local", "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("ANTHROPIC_API_KEY="));
const key = line?.slice("ANTHROPIC_API_KEY=".length).trim() ?? "";

console.log("key_present:", Boolean(key));
console.log("key_length:", key.length);
console.log("key_prefix_ok:", key.startsWith("sk-ant"));
console.log("has_wrapping_quotes:", /^['"]/.test(key));

if (!key) {
  process.exit(1);
}

const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const client = new Anthropic({ apiKey: key });

try {
  const res = await client.messages.create({
    model,
    max_tokens: 32,
    messages: [{ role: "user", content: "Reply with exactly: ok" }],
  });
  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  console.log("api_ok:", true);
  console.log("model:", model);
  console.log("sample:", text.slice(0, 50));
} catch (err) {
  console.log("api_ok:", false);
  console.log("error:", err?.message ?? String(err));
  process.exit(1);
}
