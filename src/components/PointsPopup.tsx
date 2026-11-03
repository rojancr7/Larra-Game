import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  points: number;
  label: string;
  /** Pass false to turn off motion (Settings > Animations). */
  animations?: boolean;
  size?: number;
}

/** Glowing gold ring with "+5 PTS" and a label, e.g. "Clean Sweep". */
export const PointsPopup: React.FC<Props> = ({ points, label, animations = true, size = 112 }) => {
  const pop = useRef(new Animated.Value(animations ? 0.4 : 1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animations) return;
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animations, pop, pulse]);

  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pop }] }}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <View style={styles.inner}>
        <Text style={[styles.pts, { fontSize: size * 0.25 }]}>+{points} PTS</Text>
        <Text style={[styles.label, { fontSize: size * 0.135 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.goldLight,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
  inner: { alignItems: 'center' },
  pts: { color: '#fff3c4', fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  label: { color: '#fff', fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
});

export default PointsPopup;