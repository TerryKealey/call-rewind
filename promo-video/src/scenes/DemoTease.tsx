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

export const DemoTease: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panel = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const btn = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 160 },
  });
  const fill = spring({
    frame: frame - 120,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const tag = spring({
    frame: frame - 280,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <SceneShell variant="cream">
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 72,
        }}
      >
        <div
          style={{
            width: 1280,
            opacity: panel,
            transform: `translateY(${interpolate(panel, [0, 1], [30, 0])}px)`,
            background: colors.white,
            border: `3px solid ${colors.blueDark}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 50px rgba(11,31,77,.16)",
          }}
        >
          <div
            style={{
              background: colors.blueDark,
              color: colors.cream,
              padding: "20px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: sansFont,
              fontWeight: 700,
            }}
          >
            <span style={{ fontFamily: displayFont, fontSize: 36, letterSpacing: "0.06em" }}>
              CALL REWIND · LOCAL DEMO
            </span>
            <span style={{ color: colors.yellow }}>No CRM required</span>
          </div>
          <div style={{ padding: 40 }}>
            <div
              style={{
                fontFamily: sansFont,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.muted,
                marginBottom: 10,
              }}
            >
              Deal ID
            </div>
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 34,
                background: colors.soft,
                border: `2px solid ${colors.blue}`,
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 24,
              }}
            >
              321741-demo
            </div>
            <div
              style={{
                display: "inline-flex",
                background: colors.blueDark,
                color: colors.cream,
                fontFamily: sansFont,
                fontWeight: 700,
                fontSize: 28,
                padding: "14px 28px",
                borderRadius: 999,
                transform: `scale(${interpolate(btn, [0, 1], [1, 1.06])})`,
                boxShadow: `0 0 0 ${12 * btn}px rgba(246,215,66,.3)`,
              }}
            >
              Find deal
            </div>

            <div
              style={{
                marginTop: 32,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                opacity: fill,
              }}
            >
              {["SE Next Steps", "HTML follow-up", "Meeting prep", "Scout draft"].map(
                (label, i) => {
                  const enter = spring({
                    frame: frame - (130 + i * 16),
                    fps,
                    config: { damping: 14, stiffness: 150 },
                  });
                  return (
                    <div
                      key={label}
                      style={{
                        background: "#eef4ff",
                        borderLeft: `6px solid ${colors.yellow}`,
                        borderRadius: 10,
                        padding: "14px 18px",
                        fontFamily: sansFont,
                        fontWeight: 700,
                        fontSize: 24,
                        color: colors.blueDark,
                        opacity: enter,
                        transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
                      }}
                    >
                      ✓ {label}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 64,
            fontFamily: displayFont,
            fontSize: 48,
            color: colors.blueDark,
            letterSpacing: "0.03em",
            opacity: tag,
          }}
        >
          THEN OPEN THE BUTTON — sample deal already filled.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
