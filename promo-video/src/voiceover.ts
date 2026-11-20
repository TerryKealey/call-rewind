/**
 * VO clip schedule aligned to TransitionSeries starts
 * (each prior scene duration minus 12f transition overlap).
 */
export type VoClip = {
  readonly file: string;
  readonly from: number;
};

export const VO_CLIPS: readonly VoClip[] = [
  { file: "voiceover/01-cold-open.mp3", from: 0 },
  { file: "voiceover/02-tax-montage.mp3", from: 378 },
  { file: "voiceover/03-title-smash.mp3", from: 846 },
  { file: "voiceover/04-how-it-works.mp3", from: 1194 },
  { file: "voiceover/05-skill-path.mp3", from: 1812 },
  { file: "voiceover/06-fine-print.mp3", from: 2190 },
  { file: "voiceover/07-the-button.mp3", from: 2538 },
  { file: "voiceover/08-demo-tease.mp3", from: 3096 },
  { file: "voiceover/09-cta.mp3", from: 3504 },
];
