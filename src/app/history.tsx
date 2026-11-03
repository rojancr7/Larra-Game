import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadHistory, clearHistory, MatchHistoryItem } from '../services/storage';
import { triggerHaptic } from '../services/audioHaptics';
import { C, shared } from './theme';

const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

export default function HistoryScreen() {
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [selected, setSelected] = useState<MatchHistoryItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadHistory().then((list) => active && setHistory(list));
      return () => {
        active = false;
      };
    }, [])
  );

  const handleClear = async () => {
    triggerHaptic('warning');
    await clearHistory();
    setHistory([]);
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={styles.headRow}>
        <View>
          <Text style={shared.pageTitle}>🕘 Match history</Text>
          <Text style={shared.pageSub}>Your last 20 completed matches</Text>
        </View>
        {history.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={[shared.card, styles.empty]}>
          <Text style={{ fontSize: 40 }}>🃏</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Finish a match against the computer and it will show up here.</Text>
        </View>
      ) : (
        history.map((m, idx) => {
          const win = m.isHumanWinner;
          const accent = win ? C.emerald : C.rose;
          return (
            <Pressable
              key={m.id || idx}
              onPress={() => {
                triggerHaptic('selection');
                setSelected(m);
              }}
              style={({ pressed }) => [shared.card, styles.match, { borderLeftColor: accent }, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.matchTop}>
                <View style={[styles.badge, { backgroundColor: win ? C.emeraldSoft : C.roseSoft }]}>
                  <Text style={[styles.badgeText, { color: win ? C.emeraldLight : '#fda4af' }]}>
                    {win ? 'VICTORY' : 'DEFEAT'}
                  </Text>
                </View>
                <Text style={styles.date}>{m.date}</Text>
              </View>

              <Text style={styles.scoreLine}>
                You <Text style={{ color: accent, fontWeight: '800' }}>{m.finalScores[0]?.points ?? 0} pts</Text>
                {'  ·  '}Winner: <Text style={styles.white}>{m.winnerName}</Text>
              </Text>

              {m.cleanSweepWinner === 0 && <Text style={[styles.highlight, { color: C.emerald }]}>⚡ Clean sweep in Round 1</Text>}
              {m.instantVictoryWinner === 0 && <Text style={[styles.highlight, { color: C.purple }]}>⭐ Instant victory declared</Text>}

              <View style={styles.matchBottom}>
                <Text style={styles.duration}>Duration {fmtDuration(m.durationSeconds)}</Text>
                <Text style={styles.link}>View scorecard</Text>
              </View>
            </Pressable>
          );
        })
      )}

      {/* Scorecard modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          {selected && (
            <View style={styles.sheet}>
              <View style={styles.sheetHead}>
                <View>
                  <Text style={styles.sheetTitle}>📊 Match scorecard</Text>
                  <Text style={shared.pageSub}>{selected.date}</Text>
                </View>
                <Pressable style={styles.closeBtn} onPress={() => setSelected(null)} hitSlop={8}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <Text style={shared.sectionLabel}>Final scores</Text>
                <View style={styles.table}>
                  {selected.finalScores.map((s, i) => (
                    <View key={s.playerId || i} style={[styles.row, selected.winnerIndex === i && styles.rowWin]}>
                      <Text style={styles.rowName}>
                        {i === 0 ? '👤 You' : `🤖 ${s.name}`}
                        {selected.winnerIndex === i ? ' 🏆' : ''}
                      </Text>
                      <Text style={styles.rowPts}>{s.points} pts</Text>
                    </View>
                  ))}
                </View>

                {selected.rounds && selected.rounds.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={shared.sectionLabel}>Round breakdown</Text>
                    <View style={styles.rounds}>
                      {selected.rounds.map((r) => (
                        <View key={r.round} style={styles.round}>
                          <Text style={styles.roundTitle}>Round {r.round}</Text>
                          <Text style={styles.roundWinner}>{r.winnerName}</Text>
                          <Text style={styles.roundOutcome}>{r.outcome === 'FIRE' ? '🔥 Tie (Fire)' : '+1 pt'}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selected.bonuses && selected.bonuses.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={shared.sectionLabel}>Bonuses awarded</Text>
                    {selected.bonuses.map((b, i) => (
                      <View key={i} style={styles.bonusRow}>
                        <Text style={styles.bonusName}>
                          {b.bonusType} ({b.playerName})
                        </Text>
                        <Text style={styles.bonusPts}>+{b.points} pts</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.meta}>
                  <Text style={styles.metaText}>Match ID: {selected.id}</Text>
                  <Text style={styles.metaText}>Duration: {fmtDuration(selected.durationSeconds)}</Text>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearBtn: {
    backgroundColor: C.roseSoft,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  clearText: { color: '#fda4af', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 6 },
  emptyTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  emptyText: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  match: { borderLeftWidth: 4, padding: 14, gap: 6 },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  date: { color: C.dim, fontSize: 11 },
  scoreLine: { color: '#cbd5e1', fontSize: 12 },
  white: { color: C.white, fontWeight: '800' },
  highlight: { fontSize: 11, fontWeight: '700' },
  matchBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  duration: { color: C.dim, fontSize: 10 },
  link: { color: C.amberLight, fontSize: 11, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', padding: 16 },
  sheet: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: { color: C.amber, fontSize: 16, fontWeight: '800' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: C.white, fontSize: 14 },
  table: { backgroundColor: 'rgba(2, 6, 23, 0.8)', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowWin: { backgroundColor: C.amberSoft },
  rowName: { color: C.white, fontSize: 13, fontWeight: '700' },
  rowPts: { color: C.amberLight, fontSize: 13, fontWeight: '800' },
  rounds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  round: { width: '48%', backgroundColor: 'rgba(2, 6, 23, 0.8)', borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 10 },
  roundTitle: { color: C.amber, fontSize: 11, fontWeight: '800' },
  roundWinner: { color: C.white, fontSize: 12, fontWeight: '700', marginTop: 2 },
  roundOutcome: { color: C.muted, fontSize: 10, marginTop: 2 },
  bonusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  bonusName: { color: '#cbd5e1', fontSize: 12 },
  bonusPts: { color: C.emerald, fontSize: 12, fontWeight: '800' },
  meta: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 16, marginBottom: 12 },
  metaText: { color: C.dim, fontSize: 10, lineHeight: 16 },
});