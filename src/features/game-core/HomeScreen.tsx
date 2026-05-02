import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHealth } from '@/services/api/health';
import { useAppStore } from '@/store/useAppStore';
import type { MainTabParamList } from '@/types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function HomeScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const offline = useAppStore((s) => s.offline);
  const trainingMode = useAppStore((s) => s.settings.trainingModeEnabled);
  const [healthLabel, setHealthLabel] = useState<string>('not checked');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await getHealth();
        if (!cancelled) setHealthLabel(res.ok ? 'ok' : 'unexpected');
      } catch {
        if (!cancelled) setHealthLabel('unreachable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.line}>
        Training mode: {trainingMode ? 'on' : 'off'}
      </Text>
      <Text style={styles.line}>
        Offline (local flag): {offline ? 'yes' : 'no'}
      </Text>
      <Text style={styles.line}>GET /health: {healthLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12, color: '#0f1419' },
  line: { fontSize: 15, color: '#3d4f5c', marginBottom: 6 },
});
