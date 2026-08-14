import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { InteractionAction, Listing } from '@/types/models';
import { firebaseErrorCode } from '@/utils/errors';
import { formatPrice } from '@/utils/format';

import { Avatar } from './Avatar';
import { ListingPhoto } from './ListingPhoto';
import { ProBadge } from './StatusBadge';

const SWIPE_DURATION = 240;
const SWIPE_VELOCITY = 800;
const MIN_FAST_SWIPE_DISTANCE = 42;
const RETURN_SPRING = { damping: 20, stiffness: 240, mass: 0.65 };

function isAlreadyRecordedInteraction(error: unknown): boolean {
  const code = firebaseErrorCode(error);
  if (
    code === 'already-exists' ||
    code === 'firestore/already-exists' ||
    code === 'permission-denied' ||
    code === 'firestore/permission-denied'
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : '';
  return /already[ -]?exists|already recorded|immutable|inmutable/i.test(message);
}

export function DiscoveryReel({
  listings,
  onLike,
  onPass,
  onOpenListing,
  isCommitting = false,
}: {
  listings: Listing[];
  onLike: (listing: Listing) => void | Promise<void>;
  onPass: (listing: Listing) => void | Promise<void>;
  onOpenListing: (listing: Listing) => void;
  /** Bloquea el corazón y el paging mientras una interacción viaja al servidor. */
  isCommitting?: boolean;
}) {
  // La cola y el historial viven durante toda la sesión. Un refetch de React
  // Query no reemplaza este snapshot: solo el refresh explícito remonta el reel.
  const [queue, setQueue] = useState(listings);
  const [history, setHistory] = useState<Listing[]>([]);
  const [actions, setActions] = useState<Record<string, InteractionAction>>({});
  const [localCommitPending, setLocalCommitPending] = useState(false);
  const committed = useRef(new Set<string>());
  const interactionLock = useRef(false);

  const current = queue[0];
  const next = queue[1];
  const previous = history[history.length - 1];
  const gesturesLocked = isCommitting || localCommitPending;
  const canSwipeUp = Boolean(current) && !gesturesLocked;
  const canSwipeDown = Boolean(previous) && !gesturesLocked;

  async function commitLike(listing: Listing) {
    if (
      interactionLock.current ||
      isCommitting ||
      committed.current.has(listing.id)
    ) {
      return;
    }

    interactionLock.current = true;
    committed.current.add(listing.id);
    setActions((value) => ({ ...value, [listing.id]: 'like' }));
    setLocalCommitPending(true);

    try {
      await onLike(listing);
    } catch {
      // Rollback visual y del set local: así la persona puede reintentar y la
      // publicación no queda marcada si Firestore rechazó la escritura.
      committed.current.delete(listing.id);
      setActions((value) => {
        const nextActions = { ...value };
        delete nextActions[listing.id];
        return nextActions;
      });
    } finally {
      interactionLock.current = false;
      setLocalCommitPending(false);
    }
  }

  async function commitPass(listing: Listing) {
    if (
      interactionLock.current ||
      isCommitting ||
      committed.current.has(listing.id)
    ) {
      return;
    }

    interactionLock.current = true;
    committed.current.add(listing.id);
    setActions((value) => ({ ...value, [listing.id]: 'pass' }));
    setLocalCommitPending(true);

    try {
      await onPass(listing);
    } catch (error) {
      // Una interacción existente es inmutable. Ese rechazo confirma que la
      // prenda ya fue registrada, así que conservamos el pass optimista.
      if (isAlreadyRecordedInteraction(error)) return;

      // El paging fue optimista. Si falla, devolvemos exactamente la prenda
      // que se intentó pasar al frente sin tocar el resto de la cola.
      committed.current.delete(listing.id);
      setActions((value) => {
        const nextActions = { ...value };
        delete nextActions[listing.id];
        return nextActions;
      });
      setHistory((value) =>
        value[value.length - 1]?.id === listing.id
          ? value.slice(0, -1)
          : value.filter((item) => item.id !== listing.id)
      );
      setQueue((value) => [listing, ...value.filter((item) => item.id !== listing.id)]);
    } finally {
      interactionLock.current = false;
      setLocalCommitPending(false);
    }
  }

  function showNext() {
    if (!current) return;

    setHistory((value) => [...value, current]);
    setQueue((value) =>
      value[0]?.id === current.id
        ? value.slice(1)
        : value.filter((item) => item.id !== current.id)
    );

    // Un corazón ya tocado escribió "like". Solo un item todavía intacto se
    // registra como pass al avanzar; el set evita toda escritura duplicada.
    if (!committed.current.has(current.id)) {
      void commitPass(current);
    }
  }

  function showPrevious() {
    if (!previous) return;
    setHistory((value) => value.slice(0, -1));
    setQueue((value) => [previous, ...value.filter((item) => item.id !== previous.id)]);
  }

  return (
    <View style={styles.container}>
      <VerticalPager
        canSwipeUp={canSwipeUp}
        canSwipeDown={canSwipeDown}
        disabled={gesturesLocked}
        onSwipeUp={showNext}
        onSwipeDown={showPrevious}
        currentPage={
          current ? (
            <ReelListing
              listing={current}
              action={actions[current.id]}
              disabled={gesturesLocked}
              onLike={() => void commitLike(current)}
              onOpen={() => onOpenListing(current)}
            />
          ) : (
            <CompleteReel />
          )
        }
        nextPage={
          current ? (
            next ? (
              <ReelListing listing={next} action={actions[next.id]} />
            ) : (
              <CompleteReel />
            )
          ) : undefined
        }
        previousPage={
          previous ? <ReelListing listing={previous} action={actions[previous.id]} /> : undefined
        }
      />

      <View pointerEvents="none" style={styles.sessionLabel}>
        <View style={styles.liveDot} />
        <Text style={styles.sessionText}>EN TU RONDA</Text>
        <Text style={styles.sessionCount}>{queue.length}</Text>
      </View>

      {gesturesLocked ? (
        <View pointerEvents="none" style={styles.savingPill}>
          <ActivityIndicator size="small" color={Colors.white} />
          <Text style={styles.savingText}>Guardando…</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * El pager solo anima y comunica la dirección. No conoce Firestore, la cola ni
 * refs transaccionales, por lo que el worklet nunca ejecuta lógica de negocio.
 */
function VerticalPager({
  currentPage,
  nextPage,
  previousPage,
  canSwipeUp,
  canSwipeDown,
  disabled,
  onSwipeUp,
  onSwipeDown,
}: {
  currentPage: ReactNode;
  nextPage?: ReactNode;
  previousPage?: ReactNode;
  canSwipeUp: boolean;
  canSwipeDown: boolean;
  disabled: boolean;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}) {
  const [pageHeight, setPageHeight] = useState(1);
  const translateY = useSharedValue(0);
  const paging = useSharedValue(false);
  const panStartedDuringPaging = useSharedValue(false);
  const swipeUpAllowed = useSharedValue(canSwipeUp);
  const swipeDownAllowed = useSharedValue(canSwipeDown);

  function handleLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== pageHeight) setPageHeight(height);
  }

  function finishPageChange(direction: 'up' | 'down') {
    if (direction === 'up') onSwipeUp();
    else onSwipeDown();
    // Los setState del callback se agrupan en este mismo tick; resetear acá
    // evita un frame intermedio en el que se alcanzaría a ver la página +2.
    translateY.value = 0;
  }

  const pan = Gesture.Pan()
    .enabled(!disabled && (canSwipeUp || canSwipeDown))
    .activeOffsetY([-12, 12])
    .failOffsetX([-34, 34])
    .onBegin(() => {
      panStartedDuringPaging.value = paging.value;
      if (panStartedDuringPaging.value) return;
      swipeUpAllowed.value = canSwipeUp;
      swipeDownAllowed.value = canSwipeDown;
    })
    .onUpdate((event) => {
      if (paging.value || panStartedDuringPaging.value) return;

      if (event.translationY < 0) {
        translateY.value = swipeUpAllowed.value
          ? event.translationY
          : event.translationY * 0.12;
      } else {
        translateY.value = swipeDownAllowed.value
          ? event.translationY
          : event.translationY * 0.12;
      }
    })
    .onEnd((event) => {
      if (paging.value || panStartedDuringPaging.value) {
        panStartedDuringPaging.value = false;
        return;
      }

      // Congelamos las direcciones disponibles en el UI thread antes de
      // animar; no dependemos del siguiente render para bloquear la elegida.
      swipeUpAllowed.value = canSwipeUp;
      swipeDownAllowed.value = canSwipeDown;

      const threshold = pageHeight * 0.16;
      const swipedUp =
        swipeUpAllowed.value &&
        (event.translationY < -threshold ||
          (event.translationY < -MIN_FAST_SWIPE_DISTANCE && event.velocityY < -SWIPE_VELOCITY));
      const swipedDown =
        swipeDownAllowed.value &&
        (event.translationY > threshold ||
          (event.translationY > MIN_FAST_SWIPE_DISTANCE && event.velocityY > SWIPE_VELOCITY));

      if (swipedUp) {
        paging.value = true;
        swipeUpAllowed.value = false;
        swipeDownAllowed.value = false;
        translateY.value = withTiming(-pageHeight, { duration: SWIPE_DURATION }, (finished) => {
          paging.value = false;
          if (finished) runOnJS(finishPageChange)('up');
          else {
            swipeUpAllowed.value = canSwipeUp;
            swipeDownAllowed.value = canSwipeDown;
          }
        });
      } else if (swipedDown) {
        paging.value = true;
        swipeUpAllowed.value = false;
        swipeDownAllowed.value = false;
        translateY.value = withTiming(pageHeight, { duration: SWIPE_DURATION }, (finished) => {
          paging.value = false;
          if (finished) runOnJS(finishPageChange)('down');
          else {
            swipeUpAllowed.value = canSwipeUp;
            swipeDownAllowed.value = canSwipeDown;
          }
        });
      } else {
        translateY.value = withSpring(0, RETURN_SPRING);
      }
    });

  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pageHeight + translateY.value }],
  }));
  const previousStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -pageHeight + translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.pages} onLayout={handleLayout}>
        {nextPage ? (
          <Animated.View pointerEvents="none" style={[styles.page, nextStyle]}>
            {nextPage}
          </Animated.View>
        ) : null}
        {previousPage ? (
          <Animated.View pointerEvents="none" style={[styles.page, previousStyle]}>
            {previousPage}
          </Animated.View>
        ) : null}
        <Animated.View style={[styles.page, currentStyle]}>{currentPage}</Animated.View>
      </View>
    </GestureDetector>
  );
}

function ReelListing({
  listing,
  action,
  disabled = true,
  onLike,
  onOpen,
}: {
  listing: Listing;
  action?: InteractionAction;
  disabled?: boolean;
  onLike?: () => void;
  onOpen?: () => void;
}) {
  const liked = action === 'like';
  const passed = action === 'pass';
  const heartDisabled = disabled || Boolean(action) || !onLike;
  const accessibilityLabel = passed
    ? 'Ya pasaste esta prenda'
    : liked
      ? 'Te gusta esta prenda'
      : `Me gusta ${listing.title}`;

  return (
    <View style={styles.listingPage}>
      <Pressable
        style={StyleSheet.absoluteFill}
        disabled={!onOpen}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${listing.title}, ${formatPrice(listing.price)}, de @${listing.sellerUsername}`}
      >
        <ListingPhoto
          uri={listing.photos[0]}
          style={styles.photo}
          iconSize={62}
          label="Esta prenda todavía no tiene foto"
        />
        <View style={styles.topShade} />
        <View style={styles.bottomScrim}>
          <View style={styles.sellerRow}>
            <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={30} />
            <Text style={styles.sellerName} numberOfLines={1}>
              @{listing.sellerUsername}
            </Text>
            {listing.sellerIsPro ? <ProBadge /> : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Talle {listing.size}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{listing.condition}</Text>
            </View>
            {listing.city ? (
              <View style={styles.location}>
                <Ionicons name="location-outline" size={13} color={Colors.white} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {listing.city}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.swipeHint}>Deslizá hacia arriba para seguir</Text>
        </View>
      </Pressable>

      <View pointerEvents="box-none" style={styles.actionRail}>
        <Pressable
          disabled={heartDisabled}
          onPress={onLike}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled: heartDisabled, selected: liked }}
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.heartButton,
            liked && styles.heartButtonLiked,
            passed && styles.heartButtonPassed,
            pressed && !heartDisabled && styles.heartButtonPressed,
            disabled && !action && styles.heartButtonDisabled,
          ]}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? Colors.white : passed ? 'rgba(255,255,255,0.5)' : Colors.white}
          />
        </Pressable>
        <Text style={styles.heartLabel}>{liked ? 'Te gusta' : passed ? 'Pasada' : 'Me gusta'}</Text>
      </View>
    </View>
  );
}

function CompleteReel() {
  return (
    <View style={styles.complete}>
      <View style={styles.completeIcon}>
        <Ionicons name="checkmark" size={32} color={Colors.successInk} />
      </View>
      <Text style={styles.completeEyebrow}>RONDA COMPLETA</Text>
      <Text style={styles.completeTitle}>Viste todas las prendas.</Text>
      <Text style={styles.completeBody}>
        Actualizá para buscar una tanda nueva o deslizá hacia abajo para volver a una anterior.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.black,
  },
  pages: {
    flex: 1,
    overflow: 'hidden',
  },
  page: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.black,
  },
  listingPage: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 116,
    backgroundColor: 'rgba(25, 13, 22, 0.22)',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 250,
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingTop: Spacing.xxl,
    paddingRight: 86,
    paddingBottom: Spacing.xl,
    paddingLeft: Spacing.lg,
    backgroundColor: 'rgba(30, 16, 27, 0.72)',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sellerName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.45,
  },
  price: {
    color: Colors.primarySoft,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaPill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  metaText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 150,
  },
  locationText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  swipeHint: {
    ...Typography.micro,
    color: 'rgba(255,255,255,0.72)',
    marginTop: Spacing.md,
  },
  actionRail: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 48,
    alignItems: 'center',
    gap: 5,
  },
  heartButton: {
    width: 58,
    height: 58,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(35,18,31,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...Shadows.floating,
  },
  heartButtonLiked: {
    backgroundColor: Colors.like,
    borderColor: Colors.white,
  },
  heartButtonPassed: {
    backgroundColor: 'rgba(35,18,31,0.48)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heartButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
  heartButtonDisabled: {
    opacity: 0.55,
  },
  heartLabel: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: Colors.overlayStrong,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sessionLabel: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(35,18,31,0.65)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  sessionText: {
    ...Typography.micro,
    color: Colors.white,
  },
  sessionCount: {
    ...Typography.micro,
    color: Colors.primarySoft,
  },
  savingPill: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(35,18,31,0.76)',
  },
  savingText: {
    ...Typography.micro,
    color: Colors.white,
  },
  complete: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.backgroundDeep,
  },
  completeIcon: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successSoft,
    marginBottom: Spacing.sm,
  },
  completeEyebrow: {
    ...Typography.micro,
    color: Colors.successInk,
  },
  completeTitle: {
    ...Typography.heading,
    textAlign: 'center',
  },
  completeBody: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 330,
  },
});
