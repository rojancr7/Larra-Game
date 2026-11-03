import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
} from 'react-native';
import { Card } from '../engine/deck';
import { triggerHaptic } from '../services/audioHaptics';

interface VirtualCardJoystickProps {
  selectedCard: Card | null;
  targetRound: number; // 0, 1, 2, 3
  roundCounts: [number, number, number, number]; // e.g. [0, 0, 0, 0]
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSelectTargetRound: (roundIdx: number) => void;
}

const REQUIRED_SIZES = [3, 3, 3, 4];
const STICK_MAX_RADIUS = 26;
const DRAG_THRESHOLD = 18;

export const VirtualCardJoystick: React.FC<VirtualCardJoystickProps> = ({
  selectedCard,
  targetRound,
  roundCounts,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onSelectTargetRound,
}) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const hasTriggeredRef = useRef<boolean>(false);
  const [activeDirection, setActiveDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        hasTriggeredRef.current = false;
        triggerHaptic('selection');
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Constrain stick movement inside max radius
        let stickX = dx;
        let stickY = dy;
        if (dist > STICK_MAX_RADIUS) {
          const angle = Math.atan2(dy, dx);
          stickX = Math.cos(angle) * STICK_MAX_RADIUS;
          stickY = Math.sin(angle) * STICK_MAX_RADIUS;
        }
        pan.setValue({ x: stickX, y: stickY });

        // Check if movement threshold crossed
        if (!hasTriggeredRef.current && dist >= DRAG_THRESHOLD) {
          hasTriggeredRef.current = true;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);

          if (absY > absX) {
            if (dy < 0) {
              setActiveDirection('UP');
              triggerHaptic('impactLight');
              onMoveUp();
            } else {
              setActiveDirection('DOWN');
              triggerHaptic('impactLight');
              onMoveDown();
            }
          } else {
            if (dx < 0) {
              setActiveDirection('LEFT');
              triggerHaptic('impactLight');
              onMoveLeft();
            } else {
              setActiveDirection('RIGHT');
              triggerHaptic('impactLight');
              onMoveRight();
            }
          }
        }
      },
      onPanResponderRelease: () => {
        hasTriggeredRef.current = false;
        setActiveDirection(null);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      {/* Target Round Selectors */}
      <View style={styles.targetRoundTabs}>
        {[0, 1, 2, 3].map((rIdx) => {
          const isTarget = targetRound === rIdx;
          const count = roundCounts[rIdx];
          const max = REQUIRED_SIZES[rIdx];
          const isFull = count >= max;

          return (
            <Pressable
              key={rIdx}
              onPress={() => {
                triggerHaptic('selection');
                onSelectTargetRound(rIdx);
              }}
              style={[
                styles.targetTab,
                isTarget && styles.targetTabActive,
                isFull && styles.targetTabFull,
              ]}
            >
              <Text
                style={[
                  styles.targetTabText,
                  isTarget && styles.targetTabTextActive,
                ]}
              >
                R{rIdx + 1} ({count}/{max})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main D-Pad & Analog Joystick Area */}
      <View style={styles.dpadOuterRing}>
        {/* UP Direction Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onMoveUp();
          }}
          style={({ pressed }) => [
            styles.arrowButton,
            styles.arrowUp,
            (pressed || activeDirection === 'UP') && styles.arrowActive,
          ]}
        >
          <Text style={styles.arrowIcon}>▲</Text>
          <Text style={styles.arrowLabel}>TO ROUND</Text>
        </Pressable>

        {/* LEFT Direction Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onMoveLeft();
          }}
          style={({ pressed }) => [
            styles.arrowButton,
            styles.arrowLeft,
            (pressed || activeDirection === 'LEFT') && styles.arrowActive,
          ]}
        >
          <Text style={styles.arrowIcon}>◀</Text>
          <Text style={styles.arrowLabel}>LEFT</Text>
        </Pressable>

        {/* RIGHT Direction Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onMoveRight();
          }}
          style={({ pressed }) => [
            styles.arrowButton,
            styles.arrowRight,
            (pressed || activeDirection === 'RIGHT') && styles.arrowActive,
          ]}
        >
          <Text style={styles.arrowIcon}>▶</Text>
          <Text style={styles.arrowLabel}>RIGHT</Text>
        </Pressable>

        {/* DOWN Direction Button */}
        <Pressable
          onPress={() => {
            triggerHaptic('impactLight');
            onMoveDown();
          }}
          style={({ pressed }) => [
            styles.arrowButton,
            styles.arrowDown,
            (pressed || activeDirection === 'DOWN') && styles.arrowActive,
          ]}
        >
          <Text style={styles.arrowIcon}>▼</Text>
          <Text style={styles.arrowLabel}>TO HAND</Text>
        </Pressable>

        {/* Center Draggable Analog Stick */}
        <View style={styles.stickCenterBase}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.analogStickKnob,
              {
                transform: pan.getTranslateTransform(),
              },
            ]}
          >
            <View style={styles.stickInnerPip} />
          </Animated.View>
        </View>
      </View>

      {/* Selected Card Status Indicator */}
      <View style={styles.statusPill}>
        {selectedCard ? (
          <Text style={styles.statusTextActive} numberOfLines={1}>
            🃏 {selectedCard.rank}{selectedCard.suit.charAt(0).toUpperCase()} selected • Use D-Pad / Stick
          </Text>
        ) : (
          <Text style={styles.statusTextIdle} numberOfLines={1}>
            👆 Tap any card to steer with Joystick
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  targetRoundTabs: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
    justifyContent: 'center',
  },
  targetTab: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  targetTabActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
  },
  targetTabFull: {
    borderColor: '#22c55e',
  },
  targetTabText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  targetTabTextActive: {
    color: '#facc15',
    fontWeight: '900',
  },
  dpadOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 2,
    borderColor: '#ca8a04',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ca8a04',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  arrowButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  arrowUp: {
    top: 2,
    width: 60,
    height: 26,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  arrowDown: {
    bottom: 2,
    width: 60,
    height: 26,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  arrowLeft: {
    left: 2,
    width: 26,
    height: 60,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  arrowRight: {
    right: 2,
    width: 26,
    height: 60,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  arrowActive: {
    backgroundColor: '#ca8a04',
    borderColor: '#fde047',
  },
  arrowIcon: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
  },
  arrowLabel: {
    color: '#cbd5e1',
    fontSize: 6,
    fontWeight: '800',
  },
  stickCenterBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  analogStickKnob: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#93c5fd',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  stickInnerPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  statusPill: {
    marginTop: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusTextActive: {
    color: '#facc15',
    fontSize: 8,
    fontWeight: '800',
  },
  statusTextIdle: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '600',
  },
});

