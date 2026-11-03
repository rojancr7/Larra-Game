import { Card } from "../engine/deck";
import { evaluateThreeCardHand } from "../engine/handEvaluator";
import {
    evaluateRoundFour,
    getFourCardSequenceRank,
} from "../engine/roundFour";

export const GROUP_SIZES = [3, 3, 3, 4] as const;

export interface GroupTag {
  label: string;
  tone: "good" | "weak" | "bonus";
}

const pretty = (s: string) =>
  s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

/** The colored label under each slot, e.g. "Pure Sequence" or "Quad Aces (+5 PTS)". Null until the slot is full. */
export function tagFor(group: Card[], index: number): GroupTag | null {
  try {
    if (index < 3) {
      if (group.length !== 3) return null;
      const cat = String(evaluateThreeCardHand(group).category);
      return {
        label: pretty(cat),
        tone: cat === "HIGH_CARD" ? "weak" : "good",
      };
    }
    if (group.length !== 4) return null;
    if (group.every((c) => c.rank === group[0].rank)) {
      return group[0].rank === "A"
        ? { label: "Quad Aces (+5 PTS)", tone: "bonus" }
        : { label: `Four ${group[0].rank}s (+4 PTS)`, tone: "bonus" };
    }
    if (getFourCardSequenceRank(group) >= 10)
      return { label: "Instant Win!", tone: "bonus" };
    const cat = String(evaluateRoundFour(group).category);
    return { label: pretty(cat), tone: cat === "HIGH_CARD" ? "weak" : "good" };
  } catch {
    return null;
  }
}
