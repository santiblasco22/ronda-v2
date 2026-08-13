import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { initialsFromName } from '@/utils/format';

export function Avatar({
  url,
  name,
  size = 44,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={dimensionStyle} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsFromName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
