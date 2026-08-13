import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Spacing } from '@/constants/theme';
import type { SocialLinks } from '@/types/models';
import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildWhatsAppUrl,
  defaultContactMessage,
  openExternalLink,
} from '@/utils/deepLinks';

export function SocialLinksRow({
  links,
  contactContext,
  size = 22,
}: {
  links: SocialLinks;
  contactContext?: string;
  size?: number;
}) {
  const hasAny = links.instagram || links.whatsapp || links.facebook;
  if (!hasAny) return null;

  return (
    <View style={styles.row}>
      {links.instagram ? (
        <SocialButton
          icon="logo-instagram"
          label="Abrir Instagram del vendedor"
          color={Colors.instagram}
          size={size}
          onPress={() => openExternalLink(buildInstagramUrl(links.instagram!))}
        />
      ) : null}
      {links.whatsapp ? (
        <SocialButton
          icon="logo-whatsapp"
          label="Escribir por WhatsApp al vendedor"
          color={Colors.whatsapp}
          size={size}
          onPress={() =>
            openExternalLink(
              buildWhatsAppUrl(
                links.whatsapp!,
                contactContext ? defaultContactMessage(contactContext) : undefined
              )
            )
          }
        />
      ) : null}
      {links.facebook ? (
        <SocialButton
          icon="logo-facebook"
          label="Abrir Facebook del vendedor"
          color={Colors.facebook}
          size={size}
          onPress={() => openExternalLink(buildFacebookUrl(links.facebook!))}
        />
      ) : null}
    </View>
  );
}

function SocialButton({
  icon,
  label,
  color,
  size,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.iconButton, { backgroundColor: color }, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={size} color={Colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
