import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GameState } from '../engine/gameController';

interface GameControlsProps {
  game: GameState;
  onOpenPartition: () => void;
  onAutoPartitionAll: () => void;
  onSettle: () => void;
  onNextDeal: () => void;
  onNewMatch: () => void;
  onViewResults: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  game,
  onOpenPartition,
  onAutoPartitionAll,
  onSettle,
  onNextDeal,
  onNewMatch,
  onViewResults,
}) => {
  const readyCount = game.players.filter((p) => p.partition !== null).length;
  const allReady = readyCount === 4;
  const isSettled = game.isSettled;
  const isGameOver = game.isGameOver;
  const userHasPartition = !!game.players[0]?.partition;

  return (
    <View style={styles.container}>
      {/* Status banner */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {isGameOver
            ? '🏆 Match Finished!'
            : isSettled
            ? 'Deal Complete. Check Showdown results!'
            : allReady
            ? 'All 4 players ready! Tap Settle to reveal showdown.'
            : `Arranging hands: ${readyCount}/4 players ready`}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {!isSettled && (
          <>
            <Pressable
              onPress={onOpenPartition}
              style={[
                styles.actionBtn,
                userHasPartition ? styles.btnSecondary : styles.btnPrimary,
              ]}
            >
              <Text style={styles.btnText}>
                {userHasPartition ? '✓ Edit My Partition' : '🃏 Arrange My Cards'}
              </Text>
            </Pressable>

            {!allReady && (
              <Pressable
                onPress={onAutoPartitionAll}
                style={[styles.actionBtn, styles.btnOutline]}
              >
                <Text style={styles.btnOutlineText}>⚡ Auto-Arrange Others</Text>
              </Pressable>
            )}

            {allReady && (
              <Pressable
                onPress={onSettle}
                style={[styles.actionBtn, styles.btnGold]}
              >
                <Text style={styles.btnGoldText}>⚔️ Showdown & Settle</Text>
              </Pressable>
            )}
          </>
        )}

        {isSettled && (
          <>
            <Pressable
              onPress={onViewResults}
              style={[styles.actionBtn, styles.btnSecondary]}
            >
              <Text style={styles.btnText}>📊 View Results</Text>
            </Pressable>

            {!isGameOver ? (
              <Pressable
                onPress={onNextDeal}
                style={[styles.actionBtn, styles.btnPrimary]}
              >
                <Text style={styles.btnText}>Deal Next Hand →</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onNewMatch}
                style={[styles.actionBtn, styles.btnGold]}
              >
                <Text style={styles.btnGoldText}>🏆 Start New Match</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
  },
  btnSecondary: {
    backgroundColor: '#334155',
  },
  btnOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  btnOutlineText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  btnGold: {
    backgroundColor: '#ca8a04',
    shadowColor: '#eab308',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  btnGoldText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default GameControls;

