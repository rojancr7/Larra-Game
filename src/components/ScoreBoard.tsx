import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerScore } from '../engine/scoring';
import { Player } from '../engine/gameController';

interface ScoreBoardProps {
  players: Player[];
  scores: PlayerScore[];
  matchWinner?: PlayerScore | null;
  targetPoints?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  scores,
  matchWinner,
  targetPoints = 20,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>LARRA SCOREBOARD</Text>
        <Text style={styles.targetBadge}>First to {targetPoints} pts</Text>
      </View>

      <View style={styles.playersGrid}>
        {scores.map((score, index) => {
          const player = players[index];
          const isWinner = matchWinner?.playerId === score.playerId;
          const progress = Math.min(score.points / targetPoints, 1);
          const bonus = player?.instantBonus;

          return (
            <View
              key={score.playerId}
              style={[
                styles.playerCard,
                isWinner && styles.winnerCard,
                index === 0 && styles.localPlayerCard,
              ]}
            >
              <View style={styles.playerInfoRow}>
                <View style={styles.nameContainer}>
                  <Text
                    numberOfLines={1}
                    style={[styles.playerName, isWinner && styles.winnerText]}
                  >
                    {score.name}
                    {index === 0 ? ' (You)' : ''}
                  </Text>
                  {isWinner && <Text style={styles.crown}>👑 WINNER</Text>}
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={[styles.pointsText, isWinner && styles.winnerText]}>
                    {score.points}
                  </Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </View>

              {/* Progress bar towards 20 points */}
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isWinner ? '#eab308' : '#22c55e',
                    },
                  ]}
                />
              </View>

              {/* Instant bonus tags if any */}
              {bonus && bonus.totalPoints > 0 && (
                <View style={styles.bonusRow}>
                  {bonus.sixJute && <Text style={styles.bonusBadge}>+6 Jute</Text>}
                  {bonus.threeTrayel && <Text style={styles.bonusBadge}>+9 Trayel</Text>}
                  {bonus.grandStraight && <Text style={styles.bonusBadge}>+13 Straight</Text>}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  targetBadge: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  playerCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  localPlayerCard: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(30, 58, 138, 0.35)',
  },
  winnerCard: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(113, 63, 18, 0.4)',
  },
  playerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 4,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  crown: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  pointsLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginLeft: 2,
  },
  winnerText: {
    color: '#fde047',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bonusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  bonusBadge: {
    fontSize: 9,
    color: '#38bdf8',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
});

export default ScoreBoard;

