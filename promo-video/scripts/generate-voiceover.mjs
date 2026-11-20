/**
 * Generate Call Rewind promo VO with natural neural TTS.
 *
 * Priority:
 * 1) OpenAI gpt-4o-mini-tts (coral) if OPENAI_API_KEY is a real sk-… key
 * 2) Microsoft Edge neural TTS via edge-tts (Ava Multilingual — natural / jovial)
 *
 * Usage: node scripts/generate-voiceover.mjs
 */
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/voiceover");
mkdirSync(outDir, { recursive: true });

/** @type {{ id: string, text: string }[]} */
const SCENES = [
  {
    id: "01-cold-open",
    text: "The call went great. Then you open the CRM... and your brain leaves the building.",
  },
  {
    id: "02-tax-montage",
    text: "SE Next Steps. Follow-up email. Next-meeting prep. And if there's a product gap - please draft something Scout won't roast you for. Congrats. You won the call. Now do homework.",
  },
  {
    id: "03-title-smash",
    text: "Thirty minutes of unpaid emotional labor - after you already did the hard part. Call Rewind. Be kind. Rewind the call.",
  },
  {
    id: "04-how-it-works",
    text: "Paste a Vault deal URL. We pull your CRM transcript. Next steps. Merchant follow-up. Prep for the next call. Scout draft when a gap shows up. Deal URL in. Memory optional.",
  },
  {
    id: "05-skill-path",
    text: "Prefer working in your AI assistant? Say call rewind for deal - same closeout, fewer browser tabs. Post-call guilt, handled... with your CRM.",
  },
  {
    id: "06-fine-print",
    text: "Drafts only. No auto-email. No auto-Scout. Your judgment stays employed. We're not monsters.",
  },
  {
    id: "07-the-button",
    text: "And when you need a demo - hit the button. the-button.flint.shopify.io. Sample deal ID already filled. Because I'll spin up a demo later... is a lie we all tell.",
  },
  {
    id: "08-demo-tease",
    text: "Or try the local demo: Find deal, everything populates - then open The Button with that deal ready to go.",
  },
  {
    id: "09-cta",
    text: "call-rewind.quick.shopify.io. Quick site, skill, or The Button. You're welcome, future you.",
  },
];

/** Newer multilingual neural — more natural / human than classic Edge voices */
const EDGE_VOICE = "en-US-AvaMultilingualNeural";
const EDGE_FALLBACKS = [
  "en-US-AvaMultilingualNeural",
  "en-US-EmmaMultilingualNeural",
  "en-US-JennyNeural",
  "en-US-BrianNeural",
];
const EDGE_RATE = "+5%";
const EDGE_PITCH = "+2Hz";

function sanitizeForTts(text) {
  return text
    .replaceAll("…", "...")
    .replaceAll("—", " - ")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"');
}

function isPlatformOpenAiKey(key) {
  return Boolean(key && !key.startsWith("shopify-") && key.startsWith("sk-"));
}

async function synthesizeOpenAi(text, outPath, apiKey) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input: text,
      instructions:
        "Speak like a friendly, jovial human coworker — warm, clear, lightly playful. Natural pacing with real energy. Not corporate-robot.",
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  }
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

function synthesizeEdge(text, outPath) {
  const tmpMp3 = outPath.replace(/\.mp3$/i, ".edge.mp3");
  const clean = sanitizeForTts(text);
  let lastErr = "";
  let usedVoice = null;
  for (const voice of EDGE_FALLBACKS) {
    const py = `
import asyncio, edge_tts, sys
async def main():
  communicate = edge_tts.Communicate(
    sys.argv[1],
    sys.argv[3],
    rate=${JSON.stringify(EDGE_RATE)},
    pitch=${JSON.stringify(EDGE_PITCH)},
  )
  await communicate.save(sys.argv[2])
asyncio.run(main())
`;
    const r = spawnSync("python3", ["-c", py, clean, tmpMp3, voice], {
      encoding: "utf8",
    });
    if (r.status === 0 && existsSync(tmpMp3)) {
      usedVoice = voice;
      break;
    }
    lastErr = r.stderr || r.stdout || String(r.status);
  }
  if (!usedVoice) {
    throw new Error(`edge-tts failed: ${lastErr}`);
  }
  console.log(`  voice=${usedVoice}`);
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      tmpMp3,
      "-codec:a",
      "libmp3lame",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "192k",
      outPath,
    ],
    { encoding: "utf8" },
  );
  try {
    unlinkSync(tmpMp3);
  } catch {
    /* ignore */
  }
  if (ff.status !== 0) {
    throw new Error(`ffmpeg failed: ${ff.stderr || ff.stdout}`);
  }
}

const apiKey = process.env.OPENAI_API_KEY;
const useOpenAi = isPlatformOpenAiKey(apiKey);

console.log(
  useOpenAi
    ? "Generating VO · OpenAI coral (jovial)"
    : `Generating VO · Edge neural ${EDGE_VOICE}`,
);

for (const scene of SCENES) {
  const path = join(outDir, `${scene.id}.mp3`);
  if (useOpenAi) {
    await synthesizeOpenAi(sanitizeForTts(scene.text), path, apiKey);
  } else {
    synthesizeEdge(scene.text, path);
  }
  console.log(`✓ ${scene.id}.mp3`);
}
console.log("Done → public/voiceover/");
