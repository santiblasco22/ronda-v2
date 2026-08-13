import { forwardRef, useImperativeHandle, useRef } from 'react';
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
import { Radius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.26;
const SWIPE_OUT_DURATION = 220;
/** Devolver la carta al centro con un resorte corto: firme, sin rebote largo. */
const RETURN_SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  /** Hay un swipe viajando al servidor: no se puede empezar otro gesto. */
  isCommitting?: boolean;
  isTop: boolean;
  /** Posición en el mazo: 0 es la carta de arriba. */
  depth?: number;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(function SwipeCard(
  { children, onSwipeLeft, onSwipeRight, disabled, isCommitting, isTop, depth = 0 },
  ref
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // La animación de salida se dispara una sola vez desde los botones: sin
  // esto, dos toques seguidos relanzan withTiming y su callback registra el
  // swipe por duplicado. El gesto también se apaga con disabled (isCommitting
  // en la carta de arriba) para no largar otro swipe mientras viaja el anterior.
  const buttonSwipeFired = useRef(false);

  const finishSwipe = (direction: 'left' | 'right') => {
    const target = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(target, { duration: SWIPE_OUT_DURATION }, () => {
      if (direction === 'right') runOnJS(onSwipeRight)();
      else runOnJS(onSwipeLeft)();
    });
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      if (buttonSwipeFired.current) return;
      buttonSwipeFired.current = true;
      finishSwipe('left');
    },
    swipeRight: () => {
      if (buttonSwipeFired.current) return;
      buttonSwipeFired.current = true;
      finishSwipe('right');
    },
  }));

  const pan = Gesture.Pan()
    .enabled(!disabled && isTop && !isCommitting)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.35;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        finishSwipe('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        finishSwipe('left');
      } else {
        translateX.value = withSpring(0, RETURN_SPRING);
        translateY.value = withSpring(0, RETURN_SPRING);
      }
    });

  // Las cartas de atrás quedan escalonadas: apenas más chicas y corridas
  // hacia abajo, para que se lea que hay más prendas esperando.
  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-11, 0, 11]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + depth * 10 },
        { rotate: `${rotate}deg` },
        { scale: 1 - depth * 0.035 },
      ],
    };
  });

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    transform: [
      { rotate: '-12deg' },
      { scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.85, 1], 'clamp') },
    ],
  }));

  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    transform: [
      { rotate: '12deg' },
      { scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0.85], 'clamp') },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {children}
        {isTop ? (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
              <Text style={styles.likeText}>ME GUSTA</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, passStampStyle]}>
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
    top: Spacing.xxl,
    borderWidth: 3,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  likeStamp: {
    left: Spacing.xl,
    borderColor: Colors.like,
  },
  passStamp: {
    right: Spacing.xl,
    borderColor: Colors.pass,
  },
  likeText: {
    color: Colors.like,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  passText: {
    color: Colors.pass,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
