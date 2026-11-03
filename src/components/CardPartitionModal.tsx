import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Card } from '../engine/deck';
import { HandPartition, validatePartition } from '../engine/partition';
import { evaluateThreeCardHand } from '../engine/handEvaluator';
import { evaluateRoundFour } from '../engine/roundFour';
import { generateAIPartition } from '../ai/computerAI';
import { PlayingCard } from './PlayingCard';

interface CardPartitionModalProps {
  visible: boolean;
  playerIndex: number;
  playerName: string;
  cards: Card[];
  currentPartition: HandPartition | null;
  onClose: () => void;
  onSubmit: (partition: HandPartition) => void;
}

const REQUIRED_SIZES = [3, 3, 3, 4];

export const CardPartitionModal: React.FC<CardPartitionModalProps> = ({
  visible,
  playerIndex,
  playerName,
  cards,
  currentPartition,
  onClose,
  onSubmit,
}) => {
  const [groups, setGroups] = useState<HandPartition>([[], [], [], []]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Initialize or reset when visible
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

  // Handle selecting a card from unassigned
  const handleSelectCard = (card: Card) => {
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  // Add selected card to a group
  const handleAddToGroup = (groupIndex: number) => {
    if (!selectedCardId) return;
    if (groups[groupIndex].length >= REQUIRED_SIZES[groupIndex]) return;

    const cardToAdd = cards.find((c) => c.id === selectedCardId);
    if (!cardToAdd) return;

    setGroups((prev) => {
      const next = prev.map((g) => [...g]) as HandPartition;
      next[groupIndex].push(cardToAdd);
      return next;
    });

    setSelectedCardId(null);
  };

  // Remove a card from a group
  const handleRemoveFromGroup = (groupIndex: number, cardId: string) => {
    setGroups((prev) => {
      const next = prev.map((g) => [...g]) as HandPartition;
      next[groupIndex] = next[groupIndex].filter((c) => c.id !== cardId);
      return next;
    });
  };

  // Auto-arrange all 13 cards into strategic valid groups using AI
  const handleAutoFill = () => {
    try {
      const autoPartition = generateAIPartition(cards);
      setGroups(autoPartition);
      setSelectedCardId(null);
    } catch {
      // Fallback in case of unexpected failure
      const sorted = [...cards];
      const fallbackPartition: HandPartition = [
        sorted.slice(0, 3),
        sorted.slice(3, 6),
        sorted.slice(6, 9),
        sorted.slice(9, 13),
      ];
      setGroups(fallbackPartition);
      setSelectedCardId(null);
    }
  };

  // Clear all assigned groups
  const handleClear = () => {
    setGroups([[], [], [], []]);
    setSelectedCardId(null);
  };

  // Helper to get evaluated label for preview
  const getGroupEvaluationText = (groupIndex: number): string | null => {
    const groupCards = groups[groupIndex];
    if (groupIndex < 3 && groupCards.length === 3) {
      try {
        const evalRes = evaluateThreeCardHand(groupCards);
        return `${evalRes.category.replace('_', ' ')}`;
      } catch {
        return null;
      }
    }
    if (groupIndex === 3 && groupCards.length === 4) {
      try {
        const evalRes = evaluateRoundFour(groupCards);
        return `${evalRes.category.replace('_', ' ')}`;
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Arrange Cards — {playerName}</Text>
            <Text style={styles.headerSubtitle}>
              Partition 13 cards into 3, 3, 3 and 4 for the 4 rounds
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Action helpers row */}
          <View style={styles.toolbarRow}>
            <Pressable onPress={handleAutoFill} style={styles.actionBtnSecondary}>
              <Text style={styles.actionBtnTextSecondary}>⚡ Auto Fill</Text>
            </Pressable>
            <Pressable onPress={handleClear} style={styles.actionBtnSecondary}>
              <Text style={styles.actionBtnTextSecondary}>↺ Clear</Text>
            </Pressable>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                Assigned: {totalAssigned} / 13
              </Text>
            </View>
          </View>

          {/* 4 Partition Groups */}
          <View style={styles.groupsContainer}>
            {groups.map((group, gIdx) => {
              const reqSize = REQUIRED_SIZES[gIdx];
              const isFull = group.length >= reqSize;
              const evalText = getGroupEvaluationText(gIdx);

              return (
                <View key={gIdx} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupTitleRow}>
                      <Text style={styles.groupTitle}>
                        Round {gIdx + 1} Group
                      </Text>
                      <Text style={styles.groupSizeBadge}>
                        {group.length}/{reqSize} cards
                      </Text>
                    </View>

                    {evalText && (
                      <View style={styles.evalBadge}>
                        <Text style={styles.evalBadgeText}>{evalText}</Text>
                      </View>
                    )}

                    {!isFull && selectedCardId && (
                      <Pressable
                        onPress={() => handleAddToGroup(gIdx)}
                        style={styles.addSlotButton}
                      >
                        <Text style={styles.addSlotButtonText}>+ Add Here</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Cards inside this group */}
                  <View style={styles.groupCardsRow}>
                    {group.length === 0 ? (
                      <Pressable
                        onPress={() => handleAddToGroup(gIdx)}
                        style={styles.emptyGroupPlaceholder}
                      >
                        <Text style={styles.emptyGroupText}>
                          {selectedCardId
                            ? 'Tap to assign selected card'
                            : `Select a card below to add (${reqSize} needed)`}
                        </Text>
                      </Pressable>
                    ) : (
                      group.map((card) => (
                        <View key={card.id} style={styles.assignedCardWrapper}>
                          <PlayingCard
                            card={card}
                            size="md"
                            onPress={() => handleRemoveFromGroup(gIdx, card.id)}
                          />
                          <Text style={styles.removeHint}>Tap to return</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Unassigned Cards Shelf */}
          <View style={styles.unassignedSection}>
            <View style={styles.unassignedHeader}>
              <Text style={styles.unassignedTitle}>
                Your Unassigned Cards ({unassignedCards.length})
              </Text>
              {selectedCardId && (
                <Text style={styles.selectionHint}>
                  Card selected. Tap a group above to add it.
                </Text>
              )}
            </View>

            <View style={styles.unassignedGrid}>
              {unassignedCards.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  selected={selectedCardId === card.id}
                  onPress={() => handleSelectCard(card)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Submit Button */}
        <View style={styles.footer}>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.validationStatus,
                isValid ? styles.statusValid : styles.statusInvalid,
              ]}
            >
              {isValid
                ? '✓ Valid Partition [3, 3, 3, 4]'
                : `Incomplete: Need 13 cards partitioned into [3, 3, 3, 4]`}
            </Text>
          </View>

          <Pressable
            disabled={!isValid}
            onPress={() => {
              if (isValid) {
                onSubmit(groups);
              }
            }}
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>Confirm & Submit Partition</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a1d12', // deep table felt dark green
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionBtnTextSecondary: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  counterBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  counterText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  groupsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: 'rgba(15, 45, 25, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
  groupSizeBadge: {
    color: '#cbd5e1',
    fontSize: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  evalBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  evalBadgeText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  addSlotButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSlotButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  groupCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    minHeight: 88,
  },
  emptyGroupPlaceholder: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGroupText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  assignedCardWrapper: {
    alignItems: 'center',
  },
  removeHint: {
    color: '#94a3b8',
    fontSize: 9,
    marginTop: 2,
  },
  unassignedSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  unassignedHeader: {
    marginBottom: 10,
  },
  unassignedTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  selectionHint: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  unassignedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  statusRow: {
    marginBottom: 10,
    alignItems: 'center',
  },
  validationStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusValid: {
    color: '#4ade80',
  },
  statusInvalid: {
    color: '#fb923c',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default CardPartitionModal;

