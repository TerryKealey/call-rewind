import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VO_CLIPS } from "../voiceover";

/**
 * VO + light upbeat bed (@remotion/media for reliable render downloads).
 */
export const VoiceoverTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const bedVolume = interpolate(
    frame,
    [0, fps * 1.2, durationInFrames - fps * 2, durationInFrames],
    [0, 0.14, 0.14, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Audio
        src={staticFile("music/bed-upbeat.mp3")}
        volume={bedVolume}
        name="Bed · upbeat"
        premountFor={fps}
      />
      {VO_CLIPS.map((clip) => (
        <Sequence
          key={clip.file}
          name={`VO · ${clip.file.replace("voiceover/", "")}`}
          from={clip.from}
          layout="none"
          premountFor={fps}
        >
          <Audio src={staticFile(clip.file)} volume={1} premountFor={fps} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
