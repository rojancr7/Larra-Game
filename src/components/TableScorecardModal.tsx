import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { GameState } from '../engine/gameController';
import { triggerHaptic } from '../services/audioHaptics';

interface TableScorecardModalProps {
  visible: boolean;
  game: GameState;
  humanPlayerName?: string;
  onClose: () => void;
}

export const TableScorecardModal: React.FC<TableScorecardModalProps> = ({
  visible,
  game,
  humanPlayerName = 'You',
  onClose,
}) => {
  // Compute point breakdown per player across rounds & bonuses
  const playerRows = game.players.map((p, pIdx) => {
    const isHuman = pIdx === 0;
    const name = isHuman ? humanPlayerName : p.name;
    const isWinner = game.matchWinner?.playerId === p.id;

    // Check round points
    const r1Win = game.roundResults && game.roundResults[0]?.winnerIndex === pIdx;
    const r2Win = game.roundResults && game.roundResults[1]?.winnerIndex === pIdx;
    const r3Win = game.roundResults && game.roundResults[2]?.winnerIndex === pIdx;
    const r4Win = game.roundResults && game.roundResults[3]?.winnerIndex === pIdx;

    const r1Pts = r1Win ? 1 : (game.roundResults && game.roundResults[0]?.outcome === 'FIRE' ? '🔥 0' : 0);
    const r2Pts = r2Win ? 1 : (game.roundResults && game.roundResults[1]?.outcome === 'FIRE' ? '🔥 0' : 0);
    const r3Pts = r3Win ? 1 : (game.roundResults && game.roundResults[2]?.outcome === 'FIRE' ? '🔥 0' : 0);

    let r4Pts: number | string = 0;
    if (r4Win && p.partition) {
      const isTrail = p.partition[3]?.every((c) => c.rank === p.partition![3][0]?.rank);
      const isAces = isTrail && p.partition[3][0]?.rank === 'A';
      r4Pts = isAces ? 5 : isTrail ? 4 : 1;
    } else if (game.roundResults && game.roundResults[3]?.outcome === 'FIRE') {
      r4Pts = '🔥 0';
    }

    const bonusPts = p.instantBonus.totalPoints;
    const csPts = game.cleanSweepWinner === pIdx ? 1 : 0;
    const totalPts = game.scores[pIdx]?.points ?? 0;

    return {
      pIdx,
      name,
      isHuman,
      isWinner,
      r1Pts,
      r2Pts,
      r3Pts,
      r4Pts,
      bonusPts,
      csPts,
      totalPts,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.tableCard} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📊 Official Match Scorecard</Text>
              <Text style={styles.headerSubtitle}>
                Target: 20 Points • Individual Player Win Condition
              </Text>
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={() => {
                triggerHaptic('selection');
                onClose();
              }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Table Container */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableWrapper}>
              {/* Table Column Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.thPlayer]}>Player</Text>
                <Text style={styles.th}>Round 1</Text>
                <Text style={styles.th}>Round 2</Text>
                <Text style={styles.th}>Round 3</Text>
                <Text style={styles.th}>Round 4</Text>
                <Text style={styles.th}>Bonus</Text>
                <Text style={styles.th}>Clean Sweep</Text>
                <Text style={[styles.th, styles.thTotal]}>Total Score</Text>
              </View>

              {/* Player Rows */}
              {playerRows.map((row) => (
                <View
                  key={row.pIdx}
                  style={[
                    styles.tableRow,
                    row.isWinner && styles.winningRow,
                    row.isHuman && styles.humanRow,
                  ]}
                >
                  <View style={[styles.td, styles.thPlayer, styles.playerCell]}>
                    <Text style={[styles.playerName, row.isWinner && styles.winnerNameText]}>
                      {row.isHuman ? '👤 ' : '🤖 '}
                      {row.name}
                      {row.isWinner ? ' 🏆' : ''}
                    </Text>
                  </View>

                  <Text style={[styles.td, row.r1Pts === 1 && styles.winPtText]}>
                    {row.r1Pts}
                  </Text>
                  <Text style={[styles.td, row.r2Pts === 1 && styles.winPtText]}>
                    {row.r2Pts}
                  </Text>
                  <Text style={[styles.td, row.r3Pts === 1 && styles.winPtText]}>
                    {row.r3Pts}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      typeof row.r4Pts === 'number' && row.r4Pts > 0 && styles.winPtText,
                      typeof row.r4Pts === 'number' && row.r4Pts > 1 && styles.trailPtText,
                    ]}
                  >
                    {row.r4Pts}
                  </Text>

                  <Text style={[styles.td, row.bonusPts > 0 && styles.bonusPtText]}>
                    {row.bonusPts > 0 ? `+${row.bonusPts}` : '-'}
                  </Text>

                  <Text style={[styles.td, row.csPts > 0 && styles.csPtText]}>
                    {row.csPts > 0 ? '+1' : '-'}
                  </Text>

                  <Text
                    style={[
                      styles.td,
                      styles.thTotal,
                      styles.totalScoreText,
                      row.totalPts >= 20 && styles.targetReachedText,
                    ]}
                  >
                    {row.totalPts} pts
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Status */}
          <View style={styles.tableFooter}>
            <Text style={styles.footerLegend}>
              🔥 FIRE = 0 pts (Tied Hand) • R4 Trail = +4 pts • Four Aces = +5 pts • Win = ≥ 20 pts
            </Text>
            {game.matchWinner && (
              <View style={styles.winnerAlert}>
                <Text style={styles.winnerAlertText}>
                  🎉 {game.matchWinner.name} won the match with {game.matchWinner.points} points!
                  {game.winningEvent ? ` (${game.winningEvent})` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  tableCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eab308',
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  tableWrapper: {
    minWidth: 580,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ca8a04',
    paddingVertical: 8,
  },
  th: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: 65,
  },
  thPlayer: {
    width: 130,
    textAlign: 'left',
    paddingLeft: 10,
  },
  thTotal: {
    width: 85,
    textAlign: 'right',
    paddingRight: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  humanRow: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  winningRow: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  td: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: 65,
  },
  playerCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  winnerNameText: {
    color: '#facc15',
    fontWeight: '900',
  },
  winPtText: {
    color: '#4ade80',
    fontWeight: '800',
  },
  trailPtText: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  bonusPtText: {
    color: '#a78bfa',
    fontWeight: '800',
  },
  csPtText: {
    color: '#f472b6',
    fontWeight: '800',
  },
  totalScoreText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  targetReachedText: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '900',
  },
  tableFooter: {
    marginTop: 10,
  },
  footerLegend: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
  },
  winnerAlert: {
    marginTop: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  winnerAlertText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default TableScorecardModal;

