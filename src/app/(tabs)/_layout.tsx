import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useNotifications } from '@/features/notifications/useNotifications';
import { useAuthStore } from '@/store/authStore';

export default function TabsLayout() {
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
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color, size }) => <Ionicons name="shuffle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Siguiendo',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
