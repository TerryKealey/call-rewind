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

const OUTPUTS = [
  "SE Next Steps",
  "Merchant follow-up",
  "Next-meeting prep",
  "Scout gap draft",
];

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const typedLen = Math.floor(
    interpolate(frame, [40, 220], [0, 34], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const dealUrl = "vault…/deals/321741-demo".slice(0, typedLen);
  const findPress = spring({
    frame: frame - 240,
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const sourceIn = spring({
    frame: frame - 300,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const caption = spring({
    frame: frame - 540,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <SceneShell variant="cream">
      <AbsoluteFill style={{ padding: 64 }}>
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 56,
            color: colors.blueDark,
            letterSpacing: "0.04em",
            marginBottom: 28,
          }}
        >
          PASTE DEAL → PULL TRANSCRIPT → DONE-ISH
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 28,
            opacity: formIn,
            transform: `translateY(${interpolate(formIn, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              background: colors.white,
              border: `3px solid ${colors.blueDark}`,
              borderRadius: 18,
              padding: 32,
              boxShadow: "0 18px 40px rgba(11,31,77,.12)",
            }}
          >
            <div
              style={{
                fontFamily: sansFont,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.muted,
                marginBottom: 10,
              }}
            >
              Vault deal URL
            </div>
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 28,
                background: colors.soft,
                border: `2px solid ${colors.blue}`,
                borderRadius: 10,
                padding: "16px 18px",
                minHeight: 64,
                color: colors.ink,
              }}
            >
              {dealUrl}
              <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
            </div>
            <div
              style={{
                marginTop: 22,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: colors.blueDark,
                color: colors.cream,
                fontFamily: sansFont,
                fontWeight: 700,
                fontSize: 26,
                padding: "14px 26px",
                borderRadius: 999,
                transform: `scale(${interpolate(findPress, [0, 1], [1, 0.92])})`,
                boxShadow:
                  findPress > 0.2
                    ? `0 0 0 ${8 * findPress}px rgba(246,215,66,.35)`
                    : "none",
              }}
            >
              Find in CRM
            </div>

            <div
              style={{
                marginTop: 28,
                opacity: sourceIn,
                transform: `translateY(${interpolate(sourceIn, [0, 1], [16, 0])}px)`,
                background: "#eef4ff",
                borderRadius: 12,
                padding: 18,
                fontFamily: sansFont,
                fontSize: 22,
                color: colors.ink,
              }}
            >
              <strong>Northstar Ceramics</strong> · Plus + B2B
              <br />
              <span style={{ color: colors.muted }}>
                Technical discovery · Nov 19 · retrieved via CRM
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {OUTPUTS.map((label, i) => {
              const enter = spring({
                frame: frame - (340 + i * 42),
                fps,
                config: { damping: 14, stiffness: 140 },
              });
              return (
                <div
                  key={label}
                  style={{
                    background: colors.blueDark,
                    color: colors.cream,
                    borderLeft: `8px solid ${colors.yellow}`,
                    borderRadius: 12,
                    padding: "18px 22px",
                    fontFamily: sansFont,
                    fontWeight: 700,
                    fontSize: 26,
                    opacity: enter,
                    transform: `translateX(${interpolate(enter, [0, 1], [40, 0])}px)`,
                  }}
                >
                  ✓ {label}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 64,
            fontFamily: displayFont,
            fontSize: 48,
            color: colors.blueDark,
            letterSpacing: "0.03em",
            opacity: caption,
          }}
        >
          Deal URL in.{" "}
          <span style={{ color: colors.blue }}>Memory optional.</span>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
