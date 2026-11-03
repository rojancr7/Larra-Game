import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { loadProfile, PlayerProfile, DEFAULT_PROFILE } from '../services/storage';
import { triggerHaptic } from '../services/audioHaptics';

export default function OnlineMultiplayerScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    async function init() {
      const p = await loadProfile();
      setProfile(p);
    }
    init();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic('selection');
              router.back();
            }}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>🌐 Online Multiplayer</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Coming Soon Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.badgeComingSoon}>
              <Text style={styles.badgeComingSoonText}>UNDER ACTIVE DEVELOPMENT</Text>
            </View>
            <Text style={styles.heroEmoji}>🌐 ⚔️ 👑</Text>
            <Text style={styles.heroTitle}>Real-Time Online Arenas</Text>
            <Text style={styles.heroSubtitle}>
              Prepare to compete with real card masters across the globe in live 4-player Larra matches.
            </Text>
          </View>

          {/* Planned Online Features */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚀 Upcoming Online Architecture</Text>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🚪</Text>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Private Room Matchmaking</Text>
                <Text style={styles.featureDesc}>
                  Create 4-player custom rooms with 6-character invite codes to battle with friends.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Quick Ranked Matchmaking</Text>
                <Text style={styles.featureDesc}>
                  Match with 3 players in your skill bracket with a 60-second partitioning timer.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Global Leaderboards</Text>
                <Text style={styles.featureDesc}>
                  Climb weekly rankings based on wins, clean sweeps, and Grand Straight achievements.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔗</Text>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Profile Compatibility</Text>
                <Text style={styles.featureDesc}>
                  Your existing local player ID ({profile.playerId}) and statistics will seamlessly sync with the online backend upon deployment.
                </Text>
              </View>
            </View>
          </View>

          {/* Action to Play vs AI in the meantime */}
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Ready to Train?</Text>
            <Text style={styles.ctaSubtitle}>
              Hone your card partitioning tactics against our tactical computer AI now!
            </Text>
            <Pressable
              style={styles.btnPlayAI}
              onPress={() => {
                triggerHaptic('selection');
                router.replace('/game');
              }}
            >
              <Text style={styles.btnPlayAIText}>🃏 Play vs Computer AI</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05190d',
  },
  container: {
    flex: 1,
    backgroundColor: '#092514',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.2)',
    backgroundColor: 'rgba(5, 25, 13, 0.8)',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fbbf24',
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeComingSoon: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeComingSoonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  sectionTitle: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  featureDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  ctaBox: {
    backgroundColor: 'rgba(13, 56, 30, 0.85)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#eab308',
    marginTop: 6,
  },
  ctaTitle: {
    color: '#fde047',
    fontSize: 16,
    fontWeight: '900',
  },
  ctaSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  btnPlayAI: {
    backgroundColor: '#ca8a04',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnPlayAIText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

