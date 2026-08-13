import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { HitSlop, Spacing, Typography } from '@/constants/theme';

export function RatingStars({
  value,
  size = 16,
  showValue = false,
  count,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  const hasRatings = (count ?? 0) > 0;

  return (
    <View
      style={styles.row}
      accessibilityLabel={
        hasRatings
          ? `Calificación ${value.toFixed(1)} de 5, ${count} ${count === 1 ? 'opinión' : 'opiniones'}`
          : 'Todavía sin calificaciones'
      }
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={hasRatings ? Colors.gold : Colors.borderStrong}
        />
      ))}
      {showValue ? (
        <Text style={styles.value}>
          {hasRatings ? `${value.toFixed(1)} (${count})` : 'Sin calificaciones'}
        </Text>
      ) : null}
    </View>
  );
}

export function RatingStarsInput({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={HitSlop.small}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === star }}
          accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
        >
          <Ionicons name={value >= star ? 'star' : 'star-outline'} size={size} color={Colors.gold} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  value: {
    ...Typography.micro,
    marginLeft: Spacing.xs + 2,
  },
});
