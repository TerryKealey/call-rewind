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
import { displayFont, sansFont } from "../fonts";

const CARDS = [
  { title: "SE Next Steps", joke: "Invented from vibes", delay: 0 },
  { title: "Follow-up email", joke: "Too long. Too apologetic.", delay: 30 },
  { title: "Next-meeting prep", joke: "What even is the goal?", delay: 60 },
  { title: "@Scout draft", joke: "Please don’t roast me", delay: 90 },
];

export const TaxMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const minutes = Math.min(
    30,
    Math.floor(interpolate(frame, [40, 360], [0, 30], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );

  const punch = spring({
    frame: frame - 320,
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  return (
    <SceneShell variant="dark">
      <AbsoluteFill style={{ padding: 72 }}>
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 64,
            letterSpacing: "0.04em",
            color: colors.cream,
            marginBottom: 36,
          }}
        >
          THE HOMEWORK AFTER THE WIN
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            maxWidth: 1280,
          }}
        >
          {CARDS.map((card) => {
            const local = Math.max(0, frame - card.delay);
            const enter = spring({
              frame: local,
              fps,
              config: { damping: 16, stiffness: 120 },
            });
            return (
              <div
                key={card.title}
                style={{
                  background: "rgba(255,248,232,.08)",
                  border: `2px solid ${colors.yellow}`,
                  borderRadius: 16,
                  padding: "28px 32px",
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [50, 0])}px) rotate(${interpolate(enter, [0, 1], [card.delay % 2 === 0 ? -3 : 3, 0])}deg)`,
                }}
              >
                <div
                  style={{
                    fontFamily: displayFont,
                    fontSize: 40,
                    color: colors.yellow,
                    letterSpacing: "0.03em",
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: sansFont,
                    fontSize: 26,
                    color: colors.cream,
                    opacity: 0.85,
                  }}
                >
                  {card.joke}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            right: 90,
            top: 120,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `8px solid ${colors.yellow}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: colors.blueDark,
            boxShadow: "0 0 0 12px rgba(246,215,66,.15)",
            transform: `rotate(${frame * 2}deg)`,
          }}
        >
          <div
            style={{
              fontFamily: displayFont,
              fontSize: 64,
              color: colors.yellow,
              transform: `rotate(${-frame * 2}deg)`,
            }}
          >
            +{minutes}m
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 72,
            right: 72,
            fontFamily: displayFont,
            fontSize: 56,
            color: colors.cream,
            letterSpacing: "0.02em",
            opacity: punch,
            transform: `scale(${interpolate(punch, [0, 1], [0.9, 1])})`,
          }}
        >
          Congrats. You won the call.{" "}
          <span style={{ color: colors.yellow }}>Now do homework.</span>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
