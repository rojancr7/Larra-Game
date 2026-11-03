import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { GameState } from '../engine/gameController';
import { evaluateThreeCardHand } from '../engine/handEvaluator';
import { evaluateRoundFour } from '../engine/roundFour';
import { PlayingCard } from './PlayingCard';

interface RoundResultViewProps {
  game: GameState;
  onNextDeal: () => void;
  onNewMatch: () => void;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({
  game,
  onNextDeal,
  onNewMatch,
}) => {
  if (!game.isSettled) return null;

  const roundResults = game.roundResults || [];
  const cleanSweepWinnerIndex = game.cleanSweepWinner;
  const matchWinner = game.matchWinner;
  const isInstantVictory = game.instantVictoryWinner !== null;

  return (
    <View style={styles.overlay}>
      <View style={styles.cardContainer}>
        {/* Banner Headers */}
        {matchWinner ? (
          <View style={styles.matchWinnerBanner}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.matchWinnerTitle}>
              MATCH CHAMPION: {matchWinner.name}!
            </Text>
            <Text style={styles.matchWinnerSubtitle}>
              {isInstantVictory
                ? 'Round 4 Instant Victory Achieved!'
                : `Reached ${matchWinner.points} points (Target: 20 pts)`}
            </Text>
          </View>
        ) : cleanSweepWinnerIndex !== null ? (
          <View style={styles.cleanSweepBanner}>
            <Text style={styles.cleanSweepTitle}>⚡ CLEAN SWEEP! ⚡</Text>
            <Text style={styles.cleanSweepSubtitle}>
              {game.players[cleanSweepWinnerIndex]?.name} won all 4 rounds (+1
              bonus point)!
            </Text>
          </View>
        ) : (
          <View style={styles.normalBanner}>
            <Text style={styles.bannerTitle}>SHOWDOWN RESULTS</Text>
          </View>
        )}

        <ScrollView style={styles.scrollArea}>
          {/* If instant victory occurred */}
          {isInstantVictory && (
            <View style={styles.instantVictoryCard}>
              <Text style={styles.instantVictoryHeading}>
                🌟 Instant Victory Triggered!
              </Text>
              <Text style={styles.instantVictoryDesc}>
                {game.players[game.instantVictoryWinner!]?.name} held a qualifying
                high 4-card sequence in Round 4 to seal the match!
              </Text>
            </View>
          )}

          {/* 4 Rounds breakdown */}
          {roundResults.map((roundRes, rIdx) => {
            const isRound4 = rIdx === 3;
            const isFire = roundRes.outcome === 'FIRE';
            const winner =
              roundRes.winnerIndex !== null
                ? game.players[roundRes.winnerIndex]
                : null;

            return (
              <View key={rIdx} style={styles.roundBlock}>
                {/* Round Header */}
                <View style={styles.roundHeaderRow}>
                  <Text style={styles.roundNumberTitle}>
                    Round {rIdx + 1} ({isRound4 ? '4 Cards' : '3 Cards'})
                  </Text>
                  {isFire ? (
                    <View style={styles.fireBadge}>
                      <Text style={styles.fireText}>🔥 FIRE (Tie — 0 pts)</Text>
                    </View>
                  ) : (
                    <View style={styles.winnerBadge}>
                      <Text style={styles.winnerText}>
                        Winner: {winner?.name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Show each player's hand for this round */}
                <View style={styles.playersRow}>
                  {game.players.map((player, pIdx) => {
                    const partition = player.partition;
                    if (!partition) return null;
                    const handCards = partition[rIdx];
                    const isRoundWinner = roundRes.winnerIndex === pIdx;

                    let handEvalLabel = '';
                    try {
                      if (isRound4) {
                        const ev = evaluateRoundFour(handCards);
                        handEvalLabel = ev.category.replace('_', ' ');
                      } else {
                        const ev = evaluateThreeCardHand(handCards);
                        handEvalLabel = ev.category.replace('_', ' ');
                      }
                    } catch {
                      handEvalLabel = '';
                    }

                    return (
                      <View
                        key={player.id}
                        style={[
                          styles.playerHandColumn,
                          isRoundWinner && styles.winningHandHighlight,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pName,
                            isRoundWinner && styles.pNameWinning,
                          ]}
                          numberOfLines={1}
                        >
                          {player.name}
                        </Text>
                        <Text style={styles.evalLabel}>{handEvalLabel}</Text>

                        <View style={styles.miniCardsRow}>
                          {handCards.map((c) => (
                            <PlayingCard key={c.id} card={c} size="sm" />
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Action Controls */}
        <View style={styles.actionsFooter}>
          {game.isGameOver ? (
            <Pressable onPress={onNewMatch} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Start New Match</Text>
            </Pressable>
          ) : (
            <View style={styles.dualActionRow}>
              <Pressable onPress={onNextDeal} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Deal Next Hand →</Text>
              </Pressable>
              <Pressable onPress={onNewMatch} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Restart</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    zIndex: 100,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  matchWinnerBanner: {
    backgroundColor: '#713f12',
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eab308',
  },
  trophyIcon: {
    fontSize: 26,
  },
  matchWinnerTitle: {
    color: '#fef08a',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  matchWinnerSubtitle: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cleanSweepBanner: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#60a5fa',
  },
  cleanSweepTitle: {
    color: '#bfdbfe',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cleanSweepSubtitle: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  normalBanner: {
    backgroundColor: '#1e293b',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollArea: {
    padding: 10,
  },
  instantVictoryCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  instantVictoryHeading: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: 13,
  },
  instantVictoryDesc: {
    color: '#fef3c7',
    fontSize: 11,
    marginTop: 2,
  },
  roundBlock: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roundHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roundNumberTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '800',
  },
  fireBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fireText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
  },
  winnerBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  winnerText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  playerHandColumn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
  },
  winningHandHighlight: {
    borderColor: '#22c55e',
    borderWidth: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  pName: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  pNameWinning: {
    color: '#4ade80',
  },
  evalLabel: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '600',
    marginVertical: 2,
  },
  miniCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: -14, // fan effect
    marginTop: 2,
  },
  actionsFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default RoundResultView;
