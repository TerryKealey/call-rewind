import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadDmSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadJetbrains } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: displayFont } = loadBebas();
export const { fontFamily: sansFont } = loadDmSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
export const { fontFamily: monoFont } = loadJetbrains("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
