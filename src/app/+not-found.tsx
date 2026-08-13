import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Esta pantalla no existe.</Text>
      <Link href="/" style={styles.link}>
        Volver al inicio
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  link: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
