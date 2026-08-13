import { forwardRef, useImperativeHandle } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DURATION = 220;

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  isTop: boolean;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(function SwipeCard(
  { children, onSwipeLeft, onSwipeRight, disabled, isTop },
  ref
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const finishSwipe = (direction: 'left' | 'right') => {
    const target = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(target, { duration: SWIPE_OUT_DURATION }, () => {
      if (direction === 'right') runOnJS(onSwipeRight)();
      else runOnJS(onSwipeLeft)();
    });
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => finishSwipe('left'),
    swipeRight: () => finishSwipe('right'),
  }));

  const pan = Gesture.Pan()
    .enabled(!disabled && isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        finishSwipe('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        finishSwipe('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-12, 0, 12]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {children}
        {isTop ? (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
              <Text style={styles.likeText}>ME GUSTA</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, passOpacity]}>
              <Text style={styles.passText}>PASO</Text>
            </Animated.View>
          </>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeStamp: {
    left: 20,
    borderColor: Colors.like,
    transform: [{ rotate: '-14deg' }],
  },
  passStamp: {
    right: 20,
    borderColor: Colors.pass,
    transform: [{ rotate: '14deg' }],
  },
  likeText: {
    color: Colors.like,
    fontWeight: '800',
    fontSize: 20,
  },
  passText: {
    color: Colors.pass,
    fontWeight: '800',
    fontSize: 20,
  },
});
