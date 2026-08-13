import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { buildFacebookUrl, buildInstagramUrl, buildWhatsAppUrl, defaultContactMessage, openExternalLink } from '@/utils/deepLinks';
import type { SocialLinks } from '@/types/models';

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
        <Pressable
          style={[styles.iconButton, { backgroundColor: Colors.instagram }]}
          onPress={() => openExternalLink(buildInstagramUrl(links.instagram!))}
        >
          <Ionicons name="logo-instagram" size={size} color={Colors.white} />
        </Pressable>
      ) : null}
      {links.whatsapp ? (
        <Pressable
          style={[styles.iconButton, { backgroundColor: Colors.whatsapp }]}
          onPress={() =>
            openExternalLink(
              buildWhatsAppUrl(links.whatsapp!, contactContext ? defaultContactMessage(contactContext) : undefined)
            )
          }
        >
          <Ionicons name="logo-whatsapp" size={size} color={Colors.white} />
        </Pressable>
      ) : null}
      {links.facebook ? (
        <Pressable
          style={[styles.iconButton, { backgroundColor: Colors.facebook }]}
          onPress={() => openExternalLink(buildFacebookUrl(links.facebook!))}
        >
          <Ionicons name="logo-facebook" size={size} color={Colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
