import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Card } from '../engine/deck';
import { PlayingCard } from './PlayingCard';
import { triggerHaptic } from '../services/audioHaptics';

interface InteractiveTableCardProps {
  card: Card;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  onTap?: (card: Card) => void;
  onDragStart?: (card: Card) => void;
  onDragMove?: (card: Card, moveX: number, moveY: number) => void;
  onDragEnd?: (card: Card, releaseX: number, releaseY: number, dx: number, dy: number) => void;
  disabled?: boolean;
}

export const InteractiveTableCard: React.FC<InteractiveTableCardProps> = ({
  card,
  size = 'sm',
  selected = false,
  onTap,
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled = false,
}) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const liftAnim = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        // Start dragging if moved more than 4px
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        triggerHaptic('selection');
        onDragStart?.(card);

        // Smooth lift animation
        Animated.parallel([
          Animated.spring(liftAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }),
        ]).start();
      },
      onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        onDragMove?.(card, gestureState.moveX, gestureState.moveY);
      },
      onPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, dy, moveX, moveY } = gestureState;
        const wasDragged = Math.abs(dx) > 8 || Math.abs(dy) > 8;

        if (wasDragged) {
          onDragEnd?.(card, moveX, moveY, dx, dy);
        } else {
          onTap?.(card);
        }

        // Snap back animation
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.spring(liftAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setIsDragging(false);
        });
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.spring(liftAnim, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setIsDragging(false);
        });
      },
    }),
  ).current;

  // Lift interpolations
  const translateY = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const scale = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cardContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: Animated.add(pan.y, translateY) },
            { scale },
          ],
          zIndex: isDragging ? 9999 : selected ? 100 : 1,
          elevation: isDragging ? 24 : selected ? 8 : 2,
        },
      ]}
    >
      <PlayingCard
        card={card}
        size={size}
        selected={selected || isDragging}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    margin: 2,
  },
});

export default InteractiveTableCard;

