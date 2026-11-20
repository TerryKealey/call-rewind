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

export const TitleSmash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const smash = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.8 },
  });
  const sub = spring({
    frame: frame - 18,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const line = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell variant="dark">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 220,
            lineHeight: 0.9,
            letterSpacing: "0.04em",
            color: colors.cream,
            transform: `scale(${interpolate(smash, [0, 1], [2.2, 1])})`,
            opacity: smash,
          }}
        >
          CALL
          <br />
          <span style={{ color: colors.yellow }}>REWIND</span>
        </div>
        <div
          style={{
            marginTop: 28,
            width: 420,
            height: 10,
            background: colors.yellow,
            borderRadius: 999,
            transform: `scaleX(${line})`,
            transformOrigin: "center",
          }}
        />
        <div
          style={{
            marginTop: 36,
            fontFamily: sansFont,
            fontSize: 42,
            fontWeight: 700,
            color: colors.cream,
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [24, 0])}px)`,
          }}
        >
          Be kind. Rewind the call.
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: sansFont,
            fontSize: 24,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,248,232,.65)",
            opacity: sub,
          }}
        >
          Hackday · Track E
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
