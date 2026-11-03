import { useCallback, useEffect, useMemo, useState } from "react";
import { generateAIPartition } from "../ai/computerAI";
import { Card } from "../engine/deck";
import { evaluateThreeCardHand } from "../engine/handEvaluator";
import { HandPartition, validatePartition } from "../engine/partition";
import { evaluateRoundFour } from "../engine/roundFour";

export const GROUP_SIZES = [3, 3, 3, 4] as const;

export interface GroupTag {
  label: string;
  tone: "good" | "weak" | "bonus";
  bonusPts?: number;
}

const pretty = (s: string) =>
  s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

function tagFor(group: Card[], index: number): GroupTag | null {
  try {
    if (index < 3) {
      if (group.length !== 3) return null;
      const cat = String(evaluateThreeCardHand(group).category);
      return { label: pretty(cat), tone: /HIGH/i.test(cat) ? "weak" : "good" };
    }
    if (group.length !== 4) return null;
    if (group.every((c) => c.rank === group[0].rank)) {
      const aces = group[0].rank === "A";
      return {
        label: aces ? "Quad Aces (+5 PTS)" : `Four ${group[0].rank}s (+4 PTS)`,
        tone: "bonus",
        bonusPts: aces ? 5 : 4,
      };
    }
    const cat = String(evaluateRoundFour(group).category);
    return { label: pretty(cat), tone: /HIGH/i.test(cat) ? "weak" : "good" };
  } catch {
    return null;
  }
}

function buildInitial(
  cards: Card[],
  current: HandPartition | null,
): HandPartition {
  if (current && validatePartition(cards, current)) {
    return current.map((g) => [...g]) as unknown as HandPartition;
  }
  try {
    return generateAIPartition(cards);
  } catch {
    return [
      cards.slice(0, 3),
      cards.slice(3, 6),
      cards.slice(6, 9),
      cards.slice(9, 13),
    ] as unknown as HandPartition;
  }
}

/**
 * Inline hand arranging logic used by HandTray.
 * Tap a card to select it, then tap another card to swap, or tap a slot that has room to move it there.
 */
export function usePartition(
  cards: Card[],
  currentPartition: HandPartition | null,
) {
  const cardsKey = cards.map((c) => c.id).join(",");
  const [groups, setGroups] = useState<HandPartition>(() =>
    buildInitial(cards, currentPartition),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setGroups(buildInitial(cards, currentPartition));
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsKey, currentPartition]);

  const assigned = new Set(groups.flat().map((c) => c.id));
  const unassigned = cards.filter((c) => !assigned.has(c.id));
  const isValid = cards.length === 13 && validatePartition(cards, groups);
  const tags = useMemo(() => groups.map((g, i) => tagFor(g, i)), [groups]);

  const locate = (g: HandPartition, id: string) => {
    for (let gi = 0; gi < 4; gi++) {
      const ci = g[gi].findIndex((c) => c.id === id);
      if (ci >= 0) return { gi, ci };
    }
    return null; // in the unassigned pool
  };

  const selectedGroup = selectedId
    ? (locate(groups, selectedId)?.gi ?? -1)
    : -1;

  const tapCard = useCallback(
    (id: string) => {
      if (!selectedId) return setSelectedId(id);
      if (selectedId === id) return setSelectedId(null);

      const a = locate(groups, selectedId);
      const b = locate(groups, id);
      const cardA = cards.find((c) => c.id === selectedId);
      const cardB = cards.find((c) => c.id === id);
      if (!cardA || !cardB) return;

      if (!a && !b) return setSelectedId(id); // both in pool: just move the selection

      const next = groups.map((g) => [...g]) as unknown as HandPartition;
      if (a) next[a.gi][a.ci] = cardB;
      if (b) next[b.gi][b.ci] = cardA;
      setGroups(next);
      setSelectedId(null);
    },
    [groups, selectedId, cards],
  );

  const tapSlot = useCallback(
    (gi: number) => {
      if (!selectedId) return;
      if (groups[gi].length >= GROUP_SIZES[gi]) return;
      const card = cards.find((c) => c.id === selectedId);
      if (!card) return;
      const next = groups.map((g) =>
        g.filter((c) => c.id !== selectedId),
      ) as unknown as HandPartition;
      next[gi] = [...next[gi], card];
      setGroups(next);
      setSelectedId(null);
    },
    [groups, selectedId, cards],
  );

  const autoArrange = useCallback(() => {
    setGroups(buildInitial(cards, null));
    setSelectedId(null);
  }, [cards]);

  const clear = useCallback(() => {
    setGroups([[], [], [], []] as unknown as HandPartition);
    setSelectedId(null);
  }, []);

  return {
    groups,
    selectedId,
    selectedGroup,
    unassigned,
    isValid,
    tags,
    tapCard,
    tapSlot,
    autoArrange,
    clear,
  };
}
