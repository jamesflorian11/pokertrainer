import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import type { MainTabParamList } from '@/types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const trainingMode = useAppStore((s) => s.settings.trainingModeEnabled);
  const offline = useAppStore((s) => s.offline);
  const setSettings = useAppStore((s) => s.setSettings);
  const setOffline = useAppStore((s) => s.setOffline);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user.name ?? '—'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Skill level</Text>
        <Text style={styles.value}>{user.skillLevel ?? '—'}</Text>
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Training mode</Text>
        <Switch
          value={trainingMode}
          onValueChange={(v) => setSettings({ trainingModeEnabled: v })}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Offline flag</Text>
        <Switch value={offline} onValueChange={setOffline} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20, color: '#0f1419' },
  row: { marginBottom: 14 },
  label: { fontSize: 13, color: '#7a8a99', marginBottom: 4 },
  value: { fontSize: 16, color: '#0f1419' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
});
