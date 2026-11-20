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

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const url = spring({
    frame: frame - 40,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const skill = spring({
    frame: frame - 100,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const button = spring({
    frame: frame - 170,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const wink = spring({
    frame: frame - 260,
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
            fontSize: 120,
            letterSpacing: "0.04em",
            color: colors.cream,
            opacity: title,
            transform: `scale(${interpolate(title, [0, 1], [0.85, 1])})`,
          }}
        >
          CALL <span style={{ color: colors.yellow }}>REWIND</span>
        </div>
        <div
          style={{
            marginTop: 12,
            width: 280,
            height: 8,
            background: colors.yellow,
            borderRadius: 999,
            opacity: title,
          }}
        />

        <div
          style={{
            marginTop: 48,
            fontFamily: monoFont,
            fontSize: 42,
            color: colors.blueDark,
            background: colors.yellow,
            padding: "18px 36px",
            borderRadius: 14,
            fontWeight: 700,
            opacity: url,
            transform: `translateY(${interpolate(url, [0, 1], [24, 0])}px)`,
          }}
        >
          call-rewind.quick.shopify.io
        </div>

        <div
          style={{
            marginTop: 22,
            fontFamily: monoFont,
            fontSize: 28,
            color: colors.cream,
            background: "rgba(255,248,232,.08)",
            border: `2px solid rgba(246,215,66,.45)`,
            padding: "14px 26px",
            borderRadius: 12,
            opacity: skill,
          }}
        >
          Skill: call rewind for deal [ID]
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: monoFont,
            fontSize: 28,
            color: colors.blueDark,
            background: colors.cream,
            padding: "14px 26px",
            borderRadius: 12,
            fontWeight: 700,
            opacity: button,
          }}
        >
          Demo → the-button.flint.shopify.io/?dealId=…
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: sansFont,
            fontSize: 36,
            fontWeight: 700,
            color: colors.cream,
            opacity: wink,
          }}
        >
          You’re welcome,{" "}
          <span style={{ color: colors.yellow }}>future you.</span>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
