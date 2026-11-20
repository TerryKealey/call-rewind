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

export const TheButton: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const bigBtn = spring({
    frame: frame - 35,
    fps,
    config: { damping: 11, stiffness: 170, mass: 0.75 },
  });
  const urlIn = spring({
    frame: frame - 100,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const dealIn = spring({
    frame: frame - 160,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const punch = spring({
    frame: frame - 280,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const pulse = 1 + 0.04 * Math.sin(frame / 8);

  return (
    <SceneShell variant="dark">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 72,
        }}
      >
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 56,
            letterSpacing: "0.08em",
            color: colors.cream,
            opacity: headline,
            marginBottom: 28,
          }}
        >
          AND WHEN YOU NEED A DEMO…
        </div>

        <div
          style={{
            opacity: bigBtn,
            transform: `scale(${interpolate(bigBtn, [0, 1], [0.4, 1]) * pulse}) rotate(${interpolate(bigBtn, [0, 1], [-8, 0])}deg)`,
            background: colors.yellow,
            color: colors.blueDark,
            fontFamily: displayFont,
            fontSize: 72,
            letterSpacing: "0.04em",
            padding: "36px 64px",
            borderRadius: 24,
            border: `6px solid ${colors.cream}`,
            boxShadow: "0 24px 0 rgba(0,0,0,.25), 0 0 0 16px rgba(246,215,66,.18)",
            maxWidth: 1400,
            lineHeight: 1.05,
          }}
        >
          NEED A DEMO?
          <br />
          HIT THE BUTTON!
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: monoFont,
            fontSize: 34,
            color: colors.blueDark,
            background: colors.cream,
            padding: "16px 28px",
            borderRadius: 12,
            fontWeight: 700,
            opacity: urlIn,
            transform: `translateY(${interpolate(urlIn, [0, 1], [20, 0])}px)`,
          }}
        >
          the-button.flint.shopify.io
        </div>

        <div
          style={{
            marginTop: 20,
            fontFamily: monoFont,
            fontSize: 28,
            color: colors.yellow,
            opacity: dealIn,
          }}
        >
          ?dealId=321741-demo{" "}
          <span style={{ color: "rgba(255,248,232,.7)", fontFamily: sansFont, fontSize: 24 }}>
            ← sample deal already filled
          </span>
        </div>

        <div
          style={{
            marginTop: 44,
            fontFamily: sansFont,
            fontSize: 34,
            fontWeight: 700,
            color: colors.cream,
            maxWidth: 1100,
            lineHeight: 1.4,
            opacity: punch,
          }}
        >
          One click from Call Rewind.{" "}
          <span style={{ color: colors.yellow }}>
            Because “I’ll spin up a demo later” is a lie we all tell.
          </span>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
