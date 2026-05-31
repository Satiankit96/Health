import { ScrollView, StyleSheet, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

const LOG_SECTIONS = [
  'Sleep',
  'Movement',
  'Nourishment',
  'Hydration',
  'Weight',
  'Hair Care',
  'Energy & Notes',
];

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {LOG_SECTIONS.map((section) => (
          <Card key={section} title={section} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
