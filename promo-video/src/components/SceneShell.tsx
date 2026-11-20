import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../theme";
import { sansFont } from "../fonts";

type Props = {
  readonly children: React.ReactNode;
  readonly variant?: "dark" | "light" | "cream";
};

export const SceneShell: React.FC<Props> = ({ children, variant = "dark" }) => {
  const background =
    variant === "dark"
      ? `radial-gradient(circle at 80% 10%, rgba(246,215,66,.22), transparent 42%), linear-gradient(160deg, ${colors.blueDark} 0%, #071433 55%, ${colors.blue} 100%)`
      : variant === "cream"
        ? `radial-gradient(circle at top right, rgba(246,215,66,.2), transparent 40%), linear-gradient(180deg, ${colors.soft} 0%, ${colors.cream} 55%, #fff 100%)`
        : colors.soft;

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: sansFont,
        color: variant === "dark" ? colors.cream : colors.ink,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
