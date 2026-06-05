import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

interface MovementCardProps {
  moveMin: string;
  moveNote: string;
  exerciseBurned: number | null;
  passiveCalories: number;
  onMinChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onExerciseBurnedChange: (v: number | null) => void;
  onPassiveCaloriesChange: (v: number) => void;
}

export function MovementCard({
  moveMin,
  moveNote,
  exerciseBurned,
  passiveCalories,
  onMinChange,
  onNoteChange,
  onExerciseBurnedChange,
  onPassiveCaloriesChange,
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

      <View style={styles.kcalRow}>
        <View style={styles.kcalField}>
          <Text style={styles.kcalLabel}>Burned (exercise)</Text>
          <View style={styles.kcalInputRow}>
            <TextInput
              style={styles.kcalInput}
              value={exerciseBurned !== null ? String(exerciseBurned) : ''}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, '');
                onExerciseBurnedChange(clean === '' ? null : parseInt(clean, 10));
              }}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={Colors.line}
              maxLength={5}
              selectTextOnFocus
              returnKeyType="done"
            />
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
        </View>

        <View style={styles.kcalField}>
          <Text style={styles.kcalLabel}>Resting baseline (kcal/day)</Text>
          <View style={styles.kcalInputRow}>
            <TextInput
              style={styles.kcalInput}
              value={String(passiveCalories)}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9]/g, '');
                onPassiveCaloriesChange(clean === '' ? 2000 : parseInt(clean, 10));
              }}
              keyboardType="number-pad"
              placeholder="2000"
              placeholderTextColor={Colors.line}
              maxLength={5}
              selectTextOnFocus
              returnKeyType="done"
            />
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
        </View>
      </View>
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
    marginBottom: Spacing.md,
  },
  kcalRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xs,
  },
  kcalField: {
    flex: 1,
  },
  kcalLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.inkSoft,
    marginBottom: Spacing.xs,
  },
  kcalInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  kcalInput: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    color: Colors.ink,
    minWidth: 48,
    padding: 0,
  },
  kcalUnit: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.inkSoft,
  },
});
