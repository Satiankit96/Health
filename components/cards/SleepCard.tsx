import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

interface SleepCardProps {
  value: string;
  onChange: (v: string) => void;
}

export function SleepCard({ value, onChange }: SleepCardProps) {
  function handleChange(text: string) {
    // Strip everything except digits and the first dot
    let cleaned = text.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      // Remove any extra dots after the first
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
      // Clamp to one decimal place
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > 1) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 1);
      }
    }
    onChange(cleaned);
  }

  return (
    <Card title="Sleep">
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={Colors.line}
          maxLength={4}
          selectTextOnFocus
          returnKeyType="done"
        />
        <Text style={styles.unit}>hrs</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  input: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 32,
    color: Colors.ink,
    minWidth: 64,
    padding: 0,
  },
  unit: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.inkSoft,
  },
});
