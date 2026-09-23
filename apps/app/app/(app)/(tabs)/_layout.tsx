import { Tabs } from 'expo-router';

import { PandamTabBar } from '@/components/nav/PandamTabBar';

/**
 * The five tabs. Rendering is fully custom (`PandamTabBar`: a floating
 * espresso bar with a sliding terracotta pill and a raised create disc); the
 * screens, their order and React Navigation's tab behaviour are unchanged.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PandamTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
