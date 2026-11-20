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

const TYPING = ["", ".", "..", "...", "uhhhhh", "I'll write this later", "I'll write this later (lying)"];

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelIn = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const cursorBlink = Math.floor(frame / 12) % 2 === 0;
  const typeIdx = Math.min(
    TYPING.length - 1,
    Math.floor(interpolate(frame, [30, 260], [0, TYPING.length - 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })),
  );
  const lowerOpacity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brainOut = interpolate(frame, [280, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell variant="cream">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            width: 1100,
            transform: `translateY(${interpolate(panelIn, [0, 1], [40, 0])}px) scale(${interpolate(panelIn, [0, 1], [0.96, 1])})`,
            opacity: panelIn,
            background: colors.white,
            border: `3px solid ${colors.blueDark}`,
            borderRadius: 18,
            boxShadow: "0 24px 60px rgba(11,31,77,.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: colors.blueDark,
              color: colors.cream,
              padding: "18px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: sansFont,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span>CRM · Opportunity</span>
            <span style={{ color: colors.yellow }}>SE Next Steps</span>
          </div>
          <div style={{ padding: 36 }}>
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 34,
                lineHeight: 1.45,
                color: colors.ink,
                minHeight: 120,
              }}
            >
              {TYPING[typeIdx]}
              <span style={{ opacity: cursorBlink ? 1 : 0, color: colors.blue }}>|</span>
            </div>
            <div
              style={{
                marginTop: 28,
                fontFamily: sansFont,
                fontSize: 22,
                color: colors.muted,
                opacity: lowerOpacity,
              }}
            >
              Call went great. Brain:{" "}
              <span style={{ color: colors.danger, fontWeight: 700 }}>
                404 Not Found
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 80,
            background: colors.yellow,
            color: colors.blueDark,
            fontFamily: displayFont,
            fontSize: 42,
            letterSpacing: "0.06em",
            padding: "12px 22px",
            borderRadius: 8,
            opacity: lowerOpacity,
            transform: `rotate(${interpolate(lowerOpacity, [0, 1], [-4, -2])}deg)`,
          }}
        >
          POST-CALL TAX: COLLECTING
        </div>

        <div
          style={{
            position: "absolute",
            top: 90,
            right: 100,
            fontFamily: displayFont,
            fontSize: 72,
            color: colors.blueDark,
            opacity: brainOut,
            transform: `translateY(${interpolate(brainOut, [0, 1], [20, 0])}px)`,
          }}
        >
          👋🧠💨
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
