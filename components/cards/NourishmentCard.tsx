import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Spacing } from '@/constants/theme';

interface NourishmentCardProps {
  calories: number | null;
  mealQuality: number;
  onCaloriesChange: (v: number | null) => void;
  onMealQualityChange: (v: number) => void;
}

export function NourishmentCard({
  calories,
  mealQuality,
  onCaloriesChange,
  onMealQualityChange,
}: NourishmentCardProps) {
  function handleCaloriesChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    onCaloriesChange(digits === '' ? null : parseInt(digits, 10));
  }

  return (
    <Card title="Nourishment">
      <View style={styles.calRow}>
        <TextInput
          style={styles.calInput}
          value={calories !== null ? String(calories) : ''}
          onChangeText={handleCaloriesChange}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={Colors.line}
          maxLength={5}
          selectTextOnFocus
          returnKeyType="done"
        />
        <Text style={styles.unit}>kcal</Text>
      </View>

      <View style={styles.qualityRow}>
        <Text style={styles.qualityLabel}>Meal quality</Text>
        <View style={styles.dots}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => onMealQualityChange(mealQuality === n ? 0 : n)}
              hitSlop={6}
            >
              <View style={[styles.dot, n <= mealQuality && styles.dotFilled]} />
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  calRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  calInput: {
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
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qualityLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.inkSoft,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
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
});
