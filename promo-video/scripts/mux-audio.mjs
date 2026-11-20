/**
 * Mux Remotion silent MP4 with VO clips + bed music.
 * Usage: node scripts/mux-audio.mjs [in.mp4] [out.mp4]
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2] || join(root, "out/call-rewind-promo-silent.mp4");
const output = process.argv[3] || join(root, "out/call-rewind-promo.mp4");

const VO = [
  { file: "public/voiceover/01-cold-open.mp3", from: 0 },
  { file: "public/voiceover/02-tax-montage.mp3", from: 378 / 30 },
  { file: "public/voiceover/03-title-smash.mp3", from: 846 / 30 },
  { file: "public/voiceover/04-how-it-works.mp3", from: 1194 / 30 },
  { file: "public/voiceover/05-skill-path.mp3", from: 1812 / 30 },
  { file: "public/voiceover/06-fine-print.mp3", from: 2190 / 30 },
  { file: "public/voiceover/07-the-button.mp3", from: 2538 / 30 },
  { file: "public/voiceover/08-demo-tease.mp3", from: 3096 / 30 },
  { file: "public/voiceover/09-cta.mp3", from: 3504 / 30 },
];

if (!existsSync(input)) {
  console.error("Missing input video:", input);
  process.exit(1);
}

const bed = join(root, "public/music/bed-upbeat.mp3");
const args = ["-y", "-i", input, "-i", bed];
for (const clip of VO) {
  args.push("-i", join(root, clip.file));
}

const filters = [];
// Bed under full video length (pad with silence if needed)
filters.push(
  `[1:a]volume=0.14,afade=t=in:st=0:d=1.2,afade=t=out:st=133:d=2,apad=whole_dur=135[bed]`,
);
const voLabels = [];
VO.forEach((clip, i) => {
  const idx = i + 2;
  const label = `vo${i}`;
  const ms = Math.round(clip.from * 1000);
  filters.push(`[${idx}:a]adelay=${ms}|${ms},volume=1[${label}]`);
  voLabels.push(`[${label}]`);
});
// duration=longest so we keep full video length; normalize after mix
filters.push(
  `${voLabels.join("")}[bed]amix=inputs=${VO.length + 1}:duration=longest:dropout_transition=0:normalize=0[aout]`,
);

args.push(
  "-filter_complex",
  filters.join(";"),
  "-map",
  "0:v",
  "-map",
  "[aout]",
  "-c:v",
  "copy",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-t",
  "135",
  output,
);

console.log("ffmpeg mux…");
const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}
console.log("Wrote", output);
