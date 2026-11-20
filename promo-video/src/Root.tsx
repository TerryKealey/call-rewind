import React from "react";
import { Composition, Folder } from "remotion";
import { CallRewindPromo } from "./CallRewindPromo";
import { ColdOpen } from "./scenes/ColdOpen";
import { TaxMontage } from "./scenes/TaxMontage";
import { TitleSmash } from "./scenes/TitleSmash";
import { HowItWorks } from "./scenes/HowItWorks";
import { SkillPath } from "./scenes/SkillPath";
import { FinePrint } from "./scenes/FinePrint";
import { TheButton } from "./scenes/TheButton";
import { DemoTease } from "./scenes/DemoTease";
import { Cta } from "./scenes/Cta";
import { FPS, HEIGHT, PROMO_DURATION, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CallRewindPromo"
        component={CallRewindPromo}
        durationInFrames={PROMO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Scenes">
        <Composition id="ColdOpen" component={ColdOpen} durationInFrames={390} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="TaxMontage" component={TaxMontage} durationInFrames={480} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="TitleSmash" component={TitleSmash} durationInFrames={360} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="HowItWorks" component={HowItWorks} durationInFrames={630} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="SkillPath" component={SkillPath} durationInFrames={390} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="FinePrint" component={FinePrint} durationInFrames={360} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="TheButton" component={TheButton} durationInFrames={570} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="DemoTease" component={DemoTease} durationInFrames={420} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="Cta" component={Cta} durationInFrames={546} fps={FPS} width={WIDTH} height={HEIGHT} />
      </Folder>
    </>
  );
};
