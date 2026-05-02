import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setHasCompletedOnboarding = useAppStore(
    (s) => s.setHasCompletedOnboarding,
  );

  function handleContinue() {
    setHasCompletedOnboarding(true);
    navigation.replace('Main', { screen: 'Home' });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.headline}>Train smarter</Text>
      <Text style={styles.body}>
        Practice skill-based games offline-first. Coaching features arrive as you
        progress.
      </Text>
      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonLabel}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#f4f6f8',
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f1419',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3d4f5c',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1a5f4a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
