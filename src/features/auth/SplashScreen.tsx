import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { initDatabase } from '@/services/storage/db';
import { useAppStore } from '@/store/useAppStore';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const hasCompletedOnboarding = useAppStore(
    (s) => s.hasCompletedOnboarding,
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await initDatabase();
      } finally {
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;
        if (hasCompletedOnboarding) {
          navigation.replace('Main', { screen: 'Home' });
        } else {
          navigation.replace('Onboarding');
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [hasCompletedOnboarding, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skill Trainer</Text>
      <ActivityIndicator size="large" style={styles.spinner} />
      <Text style={styles.caption}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1419',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e8ecf0',
    marginBottom: 24,
  },
  spinner: { marginBottom: 12 },
  caption: { color: '#8b98a5', fontSize: 14 },
});
