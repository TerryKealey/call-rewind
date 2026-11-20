import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { ColdOpen } from "./scenes/ColdOpen";
import { TaxMontage } from "./scenes/TaxMontage";
import { TitleSmash } from "./scenes/TitleSmash";
import { HowItWorks } from "./scenes/HowItWorks";
import { SkillPath } from "./scenes/SkillPath";
import { FinePrint } from "./scenes/FinePrint";
import { TheButton } from "./scenes/TheButton";
import { DemoTease } from "./scenes/DemoTease";
import { Cta } from "./scenes/Cta";
import { VoiceoverTrack } from "./components/VoiceoverTrack";
/**
 * 2:15 promo @ 30fps = 4050 frames.
 * Scene sum 4146 − 8×12 transitions = 4050.
 * Studio: VoiceoverTrack. CLI render: mute + scripts/mux-audio.mjs (MDM-safe).
 */
export const CallRewindPromo: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: 12 });

  return (
    <AbsoluteFill>
      <VoiceoverTrack />
      <TransitionSeries>
        <TransitionSeries.Sequence name="ColdOpen" durationInFrames={390} premountFor={fps}>
          <ColdOpen />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="TaxMontage" durationInFrames={480} premountFor={fps}>
          <TaxMontage />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={t} />

        <TransitionSeries.Sequence name="TitleSmash" durationInFrames={360} premountFor={fps}>
          <TitleSmash />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="HowItWorks" durationInFrames={630} premountFor={fps}>
          <HowItWorks />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="SkillPath" durationInFrames={390} premountFor={fps}>
          <SkillPath />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="FinePrint" durationInFrames={360} premountFor={fps}>
          <FinePrint />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="TheButton" durationInFrames={570} premountFor={fps}>
          <TheButton />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={t} />

        <TransitionSeries.Sequence name="DemoTease" durationInFrames={420} premountFor={fps}>
          <DemoTease />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence name="Cta" durationInFrames={546} premountFor={fps}>
          <Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
