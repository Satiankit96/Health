import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/constants/theme';

function SignOutButton() {
  return (
    <Pressable
      onPress={() => supabase.auth.signOut()}
      hitSlop={8}
      style={{ marginRight: Spacing.md }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_500Medium',
          fontSize: 14,
          color: Colors.inkSoft,
        }}
      >
        Sign out
      </Text>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.terra,
        tabBarInactiveTintColor: Colors.inkSoft,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: Colors.bg,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.ink,
        headerTitleStyle: {
          fontFamily: 'Fraunces_700Bold',
          fontSize: 20,
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'The Daily Log',
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'sun.max', android: 'wb_sunny', web: 'wb_sunny' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          headerRight: () => <SignOutButton />,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
