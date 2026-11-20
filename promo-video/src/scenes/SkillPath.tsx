import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneShell } from "../components/SceneShell";
import { colors } from "../theme";
import { displayFont, monoFont, sansFont } from "../fonts";

const LINES = [
  { prefix: ">", text: "call rewind for deal 321741", delay: 20 },
  { prefix: "✓", text: "CRM transcript found (as you)", delay: 90 },
  { prefix: "✓", text: "Drafting next steps… without the spiral", delay: 140 },
  { prefix: "✓", text: "Scout gap parked until you say go", delay: 190 },
];

export const SkillPath: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const joke = spring({
    frame: frame - 240,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <SceneShell variant="dark">
      <AbsoluteFill style={{ padding: 80 }}>
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 64,
            color: colors.cream,
            letterSpacing: "0.04em",
            opacity: title,
            marginBottom: 18,
          }}
        >
          ALSO WORKS AS A SKILL
        </div>
        <div
          style={{
            fontFamily: sansFont,
            fontSize: 28,
            color: "rgba(255,248,232,.7)",
            marginBottom: 36,
            opacity: title,
          }}
        >
          Quick site or AI assistant — same closeout. Fewer tabs. Less “I’ll write that later.”
        </div>

        <div
          style={{
            background: "#060e22",
            border: `3px solid ${colors.yellow}`,
            borderRadius: 18,
            padding: "36px 40px",
            fontFamily: monoFont,
            fontSize: 32,
            lineHeight: 1.7,
            color: colors.cream,
            maxWidth: 1500,
            boxShadow: "0 24px 60px rgba(0,0,0,.35)",
          }}
        >
          {LINES.map((line) => {
            const enter = spring({
              frame: frame - line.delay,
              fps,
              config: { damping: 14, stiffness: 140 },
            });
            const typed = Math.floor(
              interpolate(frame - line.delay, [0, 50], [0, line.text.length], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            );
            return (
              <div
                key={line.text}
                style={{
                  opacity: enter,
                  transform: `translateX(${interpolate(enter, [0, 1], [24, 0])}px)`,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: colors.yellow, marginRight: 16 }}>
                  {line.prefix}
                </span>
                {line.text.slice(0, Math.max(0, typed))}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: displayFont,
            fontSize: 48,
            color: colors.yellow,
            letterSpacing: "0.03em",
            opacity: joke,
          }}
        >
          Post-call guilt, handled — with your CRM.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
