import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

interface WeightCardProps {
  value: string;
  onChange: (v: string) => void;
}

export function WeightCard({ value, onChange }: WeightCardProps) {
  function handleChange(text: string) {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > 1) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 1);
      }
    }
    onChange(cleaned);
  }

  return (
    <Card title="Weight">
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={Colors.line}
          maxLength={6}
          selectTextOnFocus
          returnKeyType="done"
        />
        <Text style={styles.unit}>lbs</Text>
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
    minWidth: 72,
    padding: 0,
  },
  unit: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.inkSoft,
  },
});
