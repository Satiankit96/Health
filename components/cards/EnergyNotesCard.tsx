import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

const ENERGY_LABELS = ['rough', 'low', 'okay', 'good', 'great'];

interface EnergyNotesCardProps {
  energy: number;
  notes: string;
  onEnergyChange: (v: number) => void;
  onNotesChange: (v: string) => void;
}

export function EnergyNotesCard({
  energy,
  notes,
  onEnergyChange,
  onNotesChange,
}: EnergyNotesCardProps) {
  return (
    <Card title="Energy & Notes">
      {/* 1–5 dot selector: dots 1..energy are filled */}
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onEnergyChange(energy === n ? 0 : n)}
            hitSlop={6}
          >
            <View style={[styles.dot, n <= energy && styles.dotFilled]} />
          </Pressable>
        ))}
        {energy > 0 && (
          <Text style={styles.energyLabel}>{ENERGY_LABELS[energy - 1]}</Text>
        )}
      </View>

      {/* Freeform notes */}
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={onNotesChange}
        placeholder="How was your day?"
        placeholderTextColor={Colors.line}
        multiline
        textAlignVertical="top"
        returnKeyType="default"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.line,
  },
  dotFilled: {
    backgroundColor: Colors.terra,
  },
  energyLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.inkSoft,
    marginLeft: Spacing.xs,
  },
  notesInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    padding: Spacing.sm,
    minHeight: 80,
  },
});
