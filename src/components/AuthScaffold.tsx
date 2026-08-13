import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Spacing, Typography } from '@/constants/theme';

import { BrandMark, WardrobeMotif } from './BrandMark';

export function AuthScaffold({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  showBack = false,
  showMotif = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  showMotif?: boolean;
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            {showBack ? (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
              >
                <Ionicons name="arrow-back" size={21} color={Colors.text} />
              </Pressable>
            ) : (
              <BrandMark compact />
            )}
            {showBack ? <BrandMark compact /> : null}
          </View>

          {showMotif ? <WardrobeMotif /> : null}

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <View style={styles.thread} />
              <Text style={styles.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.formCard}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backPressed: { backgroundColor: Colors.primarySoft },
  intro: { marginTop: Spacing.xxl, marginBottom: Spacing.xl, gap: Spacing.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  thread: { width: 24, height: 3, borderRadius: Radius.pill, backgroundColor: Colors.primary },
  eyebrow: { ...Typography.micro, color: Colors.primaryInk },
  title: { ...Typography.display },
  subtitle: { ...Typography.body, color: Colors.textMuted, maxWidth: 360 },
  formCard: {
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  footer: { marginTop: Spacing.xl, alignItems: 'center' },
});
