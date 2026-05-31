import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Radius, Spacing } from '@/constants/theme';

const STEP = 0.25;
const GOAL = 2.5;
const TOTAL_DROPS = Math.round(GOAL / STEP); // 10

interface HydrationCardProps {
  water: number;
  sugarFree: boolean;
  onWaterChange: (v: number) => void;
  onSugarFreeChange: (v: boolean) => void;
}

export function HydrationCard({
  water,
  sugarFree,
  onWaterChange,
  onSugarFreeChange,
}: HydrationCardProps) {
  const filledDrops = Math.min(Math.round(water / STEP), TOTAL_DROPS);

  function decrement() {
    onWaterChange(parseFloat(Math.max(0, water - STEP).toFixed(2)));
  }

  function increment() {
    onWaterChange(parseFloat(Math.min(GOAL, water + STEP).toFixed(2)));
  }

  return (
    <Card title="Hydration">
      {/* Drop row */}
      <View style={styles.drops}>
        {Array.from({ length: TOTAL_DROPS }, (_, i) => (
          <View
            key={i}
            style={[styles.drop, i < filledDrops ? styles.dropFilled : styles.dropEmpty]}
          />
        ))}
      </View>

      {/* +/− controls + litre value */}
      <View style={styles.controls}>
        <Pressable
          onPress={decrement}
          disabled={water <= 0}
          hitSlop={8}
          style={({ pressed }) => [
            styles.btn,
            pressed && styles.btnPressed,
            water <= 0 && styles.btnDisabledStyle,
          ]}
        >
          <Text style={[styles.btnText, water <= 0 && styles.btnTextDisabled]}>−</Text>
        </Pressable>

        <Text style={styles.value}>{water.toFixed(2)} L</Text>

        <Pressable
          onPress={increment}
          disabled={water >= GOAL}
          hitSlop={8}
          style={({ pressed }) => [
            styles.btn,
            pressed && styles.btnPressed,
            water >= GOAL && styles.btnDisabledStyle,
          ]}
        >
          <Text style={[styles.btnText, water >= GOAL && styles.btnTextDisabled]}>+</Text>
        </Pressable>
      </View>

      {/* No-sugar toggle */}
      <Pressable
        onPress={() => onSugarFreeChange(!sugarFree)}
        style={[styles.toggle, sugarFree && styles.toggleActive]}
      >
        <Text style={[styles.toggleText, sugarFree && styles.toggleTextActive]}>
          {sugarFree ? '✓  No added sugar today' : 'No added sugar today'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  drops: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  drop: {
    width: 10,
    height: 14,
    borderRadius: 5,
  },
  dropFilled: {
    backgroundColor: Colors.terra,
  },
  dropEmpty: {
    backgroundColor: Colors.line,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: Colors.line,
  },
  btnDisabledStyle: {
    borderColor: Colors.line,
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 22,
    color: Colors.ink,
    lineHeight: 26,
  },
  btnTextDisabled: {
    color: Colors.line,
  },
  value: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 24,
    color: Colors.ink,
    minWidth: 84,
  },
  toggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  toggleActive: {
    backgroundColor: Colors.terra,
    borderColor: Colors.terra,
  },
  toggleText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.inkSoft,
  },
  toggleTextActive: {
    color: '#fff',
  },
});
