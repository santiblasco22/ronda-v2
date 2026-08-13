import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Radius, Typography } from '@/constants/theme';
import { useNotifications } from '@/features/notifications/useNotifications';
import { useAuthStore } from '@/store/authStore';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const profile = useAuthStore((s) => s.profile);
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (!firebaseUid) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!profile) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryInk,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: Typography.micro.fontWeight },
        tabBarBadgeStyle: {
          backgroundColor: Colors.plum,
          color: Colors.textOnDark,
          fontSize: 11,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Siguiendo',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="people" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="notifications" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <View
      style={
        focused
          ? {
              backgroundColor: Colors.plum,
              borderRadius: Radius.pill,
              paddingHorizontal: 13,
              paddingVertical: 5,
              overflow: 'hidden',
            }
          : undefined
      }
    >
      <Ionicons name={name} size={21} color={focused ? Colors.textOnDark : color} />
    </View>
  );
}
