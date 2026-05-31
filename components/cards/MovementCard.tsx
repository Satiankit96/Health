import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

interface MovementCardProps {
  moveMin: string;
  moveNote: string;
  onMinChange: (v: string) => void;
  onNoteChange: (v: string) => void;
}

export function MovementCard({
  moveMin,
  moveNote,
  onMinChange,
  onNoteChange,
}: MovementCardProps) {
  return (
    <Card title="Movement">
      <View style={styles.minRow}>
        <TextInput
          style={styles.minInput}
          value={moveMin}
          onChangeText={(t) => onMinChange(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={Colors.line}
          maxLength={3}
          selectTextOnFocus
          returnKeyType="done"
        />
        <Text style={styles.unit}>min</Text>
      </View>
      <TextInput
        style={styles.noteInput}
        value={moveNote}
        onChangeText={onNoteChange}
        placeholder="e.g. walk, strength, swim"
        placeholderTextColor={Colors.line}
        maxLength={120}
        returnKeyType="done"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  minRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  minInput: {
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
  noteInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
});
