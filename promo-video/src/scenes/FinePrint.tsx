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

export const FinePrint: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stamp = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 200, mass: 0.7 },
  });
  const lines = spring({
    frame: frame - 60,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <SceneShell variant="dark">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 160,
            letterSpacing: "0.06em",
            color: colors.yellow,
            border: `10px solid ${colors.yellow}`,
            padding: "28px 56px",
            borderRadius: 18,
            transform: `rotate(${interpolate(stamp, [0, 1], [-18, -6])}deg) scale(${interpolate(stamp, [0, 1], [1.8, 1])})`,
            opacity: stamp,
            boxShadow: "0 20px 50px rgba(0,0,0,.35)",
            background: "rgba(11,31,77,.85)",
          }}
        >
          DRAFTS ONLY
        </div>
        <div
          style={{
            marginTop: 64,
            fontFamily: sansFont,
            fontSize: 40,
            fontWeight: 700,
            color: colors.cream,
            maxWidth: 1100,
            lineHeight: 1.35,
            opacity: lines,
            transform: `translateY(${interpolate(lines, [0, 1], [20, 0])}px)`,
          }}
        >
          No auto-email. No auto-Scout.
          <br />
          <span style={{ color: colors.yellow }}>
            Your judgment stays employed.
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: sansFont,
            fontSize: 26,
            color: "rgba(255,248,232,.7)",
            opacity: lines,
          }}
        >
          We’re not monsters. (We’re SEs with a hackday.)
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
