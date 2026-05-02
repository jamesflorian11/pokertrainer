import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { OnboardingScreen } from '@/features/auth/OnboardingScreen';
import { SplashScreen } from '@/features/auth/SplashScreen';
import { HomeScreen } from '@/features/game-core/HomeScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>◎</Text>,
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}
