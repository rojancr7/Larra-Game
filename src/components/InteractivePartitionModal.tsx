import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  PanResponder,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Card, Suit, Rank } from '../engine/deck';
import { HandPartition, validatePartition } from '../engine/partition';
import { evaluateThreeCardHand, RANK_VALUES } from '../engine/handEvaluator';
import { evaluateRoundFour, getFourCardSequenceRank } from '../engine/roundFour';
import { generateAIPartition } from '../ai/computerAI';
import { PlayingCard } from './PlayingCard';
import { CardBackColor } from '../services/storage';
import { triggerHaptic } from '../services/audioHaptics';

interface InteractivePartitionModalProps {
  visible: boolean;
  cards: Card[];
  currentPartition: HandPartition | null;
  cardBack?: CardBackColor;
  onClose: () => void;
  onSubmit: (partition: HandPartition) => void;
}

const REQUIRED_SIZES = [3, 3, 3, 4] as const;

export const InteractivePartitionModal: React.FC<InteractivePartitionModalProps> = ({
  visible,
  cards,
  currentPartition,
  cardBack = 'gold-luxury',
  onClose,
  onSubmit,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [groups, setGroups] = useState<HandPartition>([[], [], [], []]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Initialize with current partition or empty
  useEffect(() => {
    if (visible) {
      if (currentPartition && validatePartition(cards, currentPartition)) {
        setGroups([
          [...currentPartition[0]],
          [...currentPartition[1]],
          [...currentPartition[2]],
          [...currentPartition[3]],
        ]);
      } else {
        setGroups([[], [], [], []]);
      }
      setSelectedCardId(null);
    }
  }, [visible, currentPartition, cards]);

  const assignedCardIds = new Set(groups.flat().map((c) => c.id));
  const unassignedCards = cards.filter((c) => !assignedCardIds.has(c.id));
  const isValid = validatePartition(cards, groups);
  const totalAssigned = groups.flat().length;

  // -------------------------------------------------------------------------
  // CARD SELECTION & DIRECT MOVE / SWAP
  // -------------------------------------------------------------------------
  const handleCardPress = (card: Card, sourceGroupIdx?: number) => {
    triggerHaptic('selection');

    if (!selectedCardId) {
      // Select this card
      setSelectedCardId(card.id);
      return;
    }

    if (selectedCardId === card.id) {
      // Deselect
      setSelectedCardId(null);
      return;
    }

    // A card is already selected; if tapping another card, SWAP them!
    const targetCardId = card.id;
    swapOrMoveCards(selectedCardId, targetCardId);
    setSelectedCardId(null);
  };

  const handleGroupSlotPress = (targetGroupIdx: number) => {
    if (!selectedCardId) return;
    triggerHaptic('selection');

    // Move selectedCardId into targetGroupIdx if it has space
    const targetGroup = groups[targetGroupIdx];
    if (targetGroup.length >= REQUIRED_SIZES[targetGroupIdx]) {
      triggerHaptic('warning');
      return;
    }

    // Find the card object
    const cardToMove = cards.find((c) => c.id === selectedCardId);
    if (!cardToMove) return;

    // Remove from existing group if present
    const updatedGroups = groups.map((g) =>
      g.filter((c) => c.id !== selectedCardId),
    ) as HandPartition;

    // Add to target group
    updatedGroups[targetGroupIdx].push(cardToMove);
    setGroups(updatedGroups);
    setSelectedCardId(null);
  };

  const swapOrMoveCards = (idA: string, idB: string) => {
    // Find where both cards are
    let groupIdxA = -1;
    let groupIdxB = -1;

    for (let i = 0; i < 4; i++) {
      if (groups[i].some((c) => c.id === idA)) groupIdxA = i;
      if (groups[i].some((c) => c.id === idB)) groupIdxB = i;
    }

    const cardA = cards.find((c) => c.id === idA);
    const cardB = cards.find((c) => c.id === idB);
    if (!cardA || !cardB) return;

    const newGroups = groups.map((g) => [...g]) as HandPartition;

    if (groupIdxA !== -1 && groupIdxB !== -1) {
      // Both in groups: Swap their places!
      const idxInA = newGroups[groupIdxA].findIndex((c) => c.id === idA);
      const idxInB = newGroups[groupIdxB].findIndex((c) => c.id === idB);
      newGroups[groupIdxA][idxInA] = cardB;
      newGroups[groupIdxB][idxInB] = cardA;
    } else if (groupIdxA !== -1 && groupIdxB === -1) {
      // A is in group, B is unassigned: Swap B into A's position
      const idxInA = newGroups[groupIdxA].findIndex((c) => c.id === idA);
      newGroups[groupIdxA][idxInA] = cardB;
    } else if (groupIdxA === -1 && groupIdxB !== -1) {
      // B is in group, A is unassigned: Swap A into B's position
      const idxInB = newGroups[groupIdxB].findIndex((c) => c.id === idB);
      newGroups[groupIdxB][idxInB] = cardA;
    }

    setGroups(newGroups);
    triggerHaptic('impactLight');
  };

  const handleRemoveFromGroup = (groupIdx: number, cardId: string) => {
    triggerHaptic('selection');
    setGroups((prev) => {
      const next = prev.map((g) => [...g]) as HandPartition;
      next[groupIdx] = next[groupIdx].filter((c) => c.id !== cardId);
      return next;
    });
    if (selectedCardId === cardId) setSelectedCardId(null);
  };

  // -------------------------------------------------------------------------
  // AUTO STRATEGY & SORTING
  // -------------------------------------------------------------------------
  const handleAutoStrategy = () => {
    triggerHaptic('success');
    try {
      const strategic = generateAIPartition(cards);
      setGroups(strategic);
      setSelectedCardId(null);
    } catch (err) {
      console.warn('Auto strategy error:', err);
    }
  };

  const handleClear = () => {
    triggerHaptic('warning');
    setGroups([[], [], [], []]);
    setSelectedCardId(null);
  };

  // -------------------------------------------------------------------------
  // EVALUATION BADGES
  // -------------------------------------------------------------------------
  const getGroupBadge = (groupIdx: number) => {
    const current = groups[groupIdx];
    const targetSize = REQUIRED_SIZES[groupIdx];

    if (current.length < targetSize) {
      return {
        label: `${current.length}/${targetSize} cards`,
        color: '#64748b',
        bg: 'rgba(51, 65, 85, 0.4)',
      };
    }

    if (groupIdx < 3) {
      try {
        const res = evaluateThreeCardHand(current);
        const colorMap: Record<string, { label: string; color: string; bg: string }> = {
          TRAIL: { label: '🔥 TRAIL', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
          PURE_SEQUENCE: { label: '✨ PURE SEQ', color: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
          SEQUENCE: { label: '⚡ SEQUENCE', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.25)' },
          COLOR: { label: '🎨 COLOR', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.25)' },
          PAIR: { label: '👥 PAIR', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
          HIGH_CARD: { label: '🃏 HIGH CARD', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' },
        };
        return colorMap[res.category] || { label: res.category, color: '#94a3b8', bg: 'rgba(0,0,0,0.3)' };
      } catch {
        return { label: 'Invalid Hand', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
      }
    } else {
      // Round 4
      try {
        const res = evaluateRoundFour(current);
        const seqRank = getFourCardSequenceRank(current);
        if (seqRank >= 10) {
          return { label: '🏆 INSTANT VICTORY!', color: '#eab308', bg: 'rgba(234, 179, 8, 0.35)' };
        }
        const colorMap: Record<string, { label: string; color: string; bg: string }> = {
          TRAIL: { label: '🔥 4-OF-A-KIND', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.3)' },
          REAL_LARRA: { label: '💎 REAL LARRA', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.3)' },
          PURE_SEQUENCE: { label: '✨ PURE SEQ', color: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
          SEQUENCE: { label: '⚡ SEQUENCE', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.25)' },
          COLOR: { label: '🎨 COLOR (3+1)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.25)' },
          TWO_PAIR: { label: '👥 TWO PAIR', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
          ONE_PAIR: { label: '👥 ONE PAIR', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
          HIGH_CARD: { label: '🃏 HIGH CARD', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' },
        };
        return colorMap[res.category] || { label: res.category, color: '#94a3b8', bg: 'rgba(0,0,0,0.3)' };
      } catch {
        return { label: 'Invalid Hand', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
      }
    }
  };

  const handleConfirm = () => {
    if (!isValid) return;
    triggerHaptic('success');
    onSubmit(groups);
  };

  const cardSize = isLandscape ? 'sm' : 'md';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>🃏 Partition Your 13 Cards</Text>
            <Text style={styles.modalSubtitle}>
              Tap a card to select, then tap a group or another card to swap • [3, 3, 3, 4]
            </Text>
          </View>

          <View style={styles.headerActionRow}>
            <Pressable onPress={handleAutoStrategy} style={styles.btnGoldSmall}>
              <Text style={styles.btnGoldSmallText}>⚡ Auto-Strategy (AI)</Text>
            </Pressable>
            <Pressable onPress={handleClear} style={styles.btnOutlineSmall}>
              <Text style={styles.btnOutlineSmallText}>Clear</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.btnClose}>
              <Text style={styles.btnCloseText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 Partition Groups */}
          <View style={[styles.groupsGrid, isLandscape && styles.groupsGridLandscape]}>
            {[0, 1, 2, 3].map((groupIdx) => {
              const badge = getGroupBadge(groupIdx);
              const groupCards = groups[groupIdx];
              const targetSize = REQUIRED_SIZES[groupIdx];
              const isFull = groupCards.length >= targetSize;

              return (
                <Pressable
                  key={groupIdx}
                  onPress={() => handleGroupSlotPress(groupIdx)}
                  style={[
                    styles.groupContainer,
                    isFull && styles.groupContainerFull,
                    selectedCardId && !isFull && styles.groupContainerDropReady,
                  ]}
                >
                  <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupTitle}>
                      Round {groupIdx + 1} ({targetSize} Cards)
                    </Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.groupSlotsRow}>
                    {groupCards.map((card) => (
                      <View key={card.id} style={styles.cardWrapper}>
                        <PlayingCard
                          card={card}
                          size={cardSize}
                          selected={selectedCardId === card.id}
                          onPress={() => handleCardPress(card, groupIdx)}
                        />
                        <Pressable
                          onPress={() => handleRemoveFromGroup(groupIdx, card.id)}
                          style={styles.removeCardBadge}
                        >
                          <Text style={styles.removeCardText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}

                    {/* Empty Slots Indicator */}
                    {Array.from({ length: targetSize - groupCards.length }).map(
                      (_, slotIdx) => (
                        <View key={`slot-${slotIdx}`} style={styles.emptyCardSlot}>
                          <Text style={styles.emptyCardSlotText}>+</Text>
                        </View>
                      ),
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Unassigned Cards Tray */}
          <View style={styles.unassignedSection}>
            <View style={styles.unassignedHeader}>
              <Text style={styles.unassignedTitle}>
                Available Cards ({unassignedCards.length}/13 unassigned)
              </Text>
            </View>

            {unassignedCards.length === 0 ? (
              <View style={styles.allAssignedBanner}>
                <Text style={styles.allAssignedText}>
                  ✨ All 13 cards assigned! Tap Confirm below to play.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unassignedCardsRow}
              >
                {unassignedCards.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    size={cardSize}
                    selected={selectedCardId === card.id}
                    onPress={() => handleCardPress(card)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Bottom Submission Bar */}
        <View style={styles.modalFooter}>
          <View style={styles.footerStatus}>
            <Text style={styles.footerStatusText}>
              Assigned: {totalAssigned}/13 • {isValid ? '✅ Valid Partition' : '⚠️ Need [3, 3, 3, 4]'}
            </Text>
          </View>

          <Pressable
            disabled={!isValid}
            onPress={handleConfirm}
            style={[styles.btnConfirm, !isValid && styles.btnConfirmDisabled]}
          >
            <Text style={styles.btnConfirmText}>
              {isValid ? '⚔️ Confirm & Battle' : 'Arrange All 13 Cards'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeContainer: {
    flex: 1,
    backgroundColor: '#05190d',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.25)',
  },
  modalTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnGoldSmall: {
    backgroundColor: '#ca8a04',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnGoldSmallText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  btnOutlineSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnOutlineSmallText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  btnClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 12,
  },
  groupsGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  groupsGridLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  groupContainer: {
    backgroundColor: 'rgba(13, 56, 30, 0.85)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 8,
  },
  groupContainerFull: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  groupContainerDropReady: {
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(14, 116, 144, 0.25)',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  groupSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 70,
  },
  cardWrapper: {
    position: 'relative',
  },
  removeCardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeCardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyCardSlot: {
    width: 50,
    height: 70,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardSlotText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 20,
    fontWeight: '700',
  },
  unassignedSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unassignedHeader: {
    marginBottom: 8,
  },
  unassignedTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  unassignedCardsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  allAssignedBanner: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 8,
  },
  allAssignedText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerStatus: {
    flex: 1,
  },
  footerStatusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  btnConfirm: {
    backgroundColor: '#ca8a04',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 4,
  },
  btnConfirmDisabled: {
    backgroundColor: '#475569',
    elevation: 0,
    opacity: 0.6,
  },
  btnConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default InteractivePartitionModal;

