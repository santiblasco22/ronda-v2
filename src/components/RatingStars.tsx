import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

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
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={Colors.gold}
        />
      ))}
      {showValue ? (
        <Text style={styles.value}>
          {value.toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

export function RatingStarsInput({
  value,
  onChange,
  size = 32,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={8}>
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
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
