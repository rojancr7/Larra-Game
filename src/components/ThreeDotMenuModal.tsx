import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { GameState } from '../engine/gameController';
import { triggerHaptic } from '../services/audioHaptics';
import { AIDifficulty } from '../services/storage';

interface ThreeDotMenuModalProps {
  visible: boolean;
  game: GameState;
  difficulty?: AIDifficulty;
  onChangeDifficulty?: (d: AIDifficulty) => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onExitGame: () => void;
  onViewScoreboard: () => void;
}

export const ThreeDotMenuModal: React.FC<ThreeDotMenuModalProps> = ({
  visible,
  game,
  difficulty = 'easy',
  onChangeDifficulty,
  onClose,
  onOpenSettings,
  onExitGame,
  onViewScoreboard,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderTitle}>⚙️ Match Options</Text>
            <Text style={styles.menuHeaderSubtitle}>Target: 20 Points to Win</Text>
          </View>

          {/* Quick Score Snippet */}
          <View style={styles.quickScoresBox}>
            <Text style={styles.quickScoresTitle}>CURRENT POINTS</Text>
            <View style={styles.scoreRow}>
              {game.players.map((p, i) => (
                <View key={p.id} style={styles.playerScoreItem}>
                  <Text style={styles.playerNameText} numberOfLines={1}>
                    {i === 0 ? '👤 You' : `🤖 ${p.name}`}
                  </Text>
                  <Text style={styles.playerPointsText}>
                    {game.scores[i]?.points ?? 0} pts
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Difficulty Selector */}
          {onChangeDifficulty && (
            <View style={styles.diffBox}>
              <Text style={styles.diffLabel}>AI DIFFICULTY</Text>
              <View style={styles.diffRow}>
                {(['easy', 'med', 'hard'] as AIDifficulty[]).map((d) => {
                  const active = difficulty === d;
                  const label =
                    d === 'easy' ? '🟢 Easy' : d === 'med' ? '🟡 Medium' : '🔴 Hard';
                  return (
                    <Pressable
                      key={d}
                      style={[styles.diffBtn, active && styles.diffBtnActive]}
                      onPress={() => {
                        triggerHaptic('selection');
                        onChangeDifficulty(d);
                      }}
                    >
                      <Text
                        style={[
                          styles.diffText,
                          active && styles.diffTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Menu Items */}
          <Pressable
            style={styles.menuButton}
            onPress={() => {
              triggerHaptic('selection');
              onClose();
              onViewScoreboard();
            }}
          >
            <Text style={styles.menuButtonIcon}>📊</Text>
            <Text style={styles.menuButtonText}>View Full Scoreboard</Text>
          </Pressable>

          <Pressable
            style={styles.menuButton}
            onPress={() => {
              triggerHaptic('selection');
              onClose();
              onOpenSettings();
            }}
          >
            <Text style={styles.menuButtonIcon}>🎨</Text>
            <Text style={styles.menuButtonText}>Game Settings</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={[styles.menuButton, styles.exitButton]}
            onPress={() => {
              triggerHaptic('warning');
              onClose();
              onExitGame();
            }}
          >
            <Text style={styles.menuButtonIcon}>🚪</Text>
            <Text style={[styles.menuButtonText, styles.exitButtonText]}>
              Exit Match & Return Home
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    width: '100%',
    maxWidth: 340,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  menuHeaderTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800',
  },
  menuHeaderSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  quickScoresBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  diffBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    marginBottom: 12,
  },
  diffLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 6,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
    borderWidth: 1,
  },
  diffText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  diffTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  quickScoresTitle: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerScoreItem: {
    alignItems: 'center',
  },
  playerNameText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 60,
  },
  playerPointsText: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuButtonIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  menuButtonText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  exitButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  exitButtonText: {
    color: '#f87171',
  },
});

export default ThreeDotMenuModal;

