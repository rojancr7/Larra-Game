import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GameTable } from '../components/GameTable';
import { AIDifficulty } from '../services/storage';

export default function GameScreen() {
  const params = useLocalSearchParams<{ difficulty?: AIDifficulty }>();
  const difficulty = params.difficulty || 'easy';

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <GameTable key={difficulty} initialDifficulty={difficulty} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05190d',
  },
});
