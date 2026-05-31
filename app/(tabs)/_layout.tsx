import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

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
