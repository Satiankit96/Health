import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { isMicroneedleDay, isShampooDay } from '@/constants/schedule';

interface HairCareCardProps {
  dateKey: string;
  shampoo: boolean;
  microneedle: boolean;
  onShampooChange: (v: boolean) => void;
  onMicroneedleChange: (v: boolean) => void;
}

function HairCareToggle({
  label,
  done,
  due,
  onPress,
  style,
}: {
  label: string;
  done: boolean;
  due: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        style={[styles.toggle, due && !done && styles.toggleDue, done && styles.toggleActive]}
      >
        <Text style={[styles.toggleText, done && styles.toggleTextActive]}>
          {done ? `✓  ${label}` : label}
        </Text>
      </Pressable>
      {due && !done && <Text style={styles.dueLabel}>Due today</Text>}
    </View>
  );
}

export function HairCareCard({
  dateKey,
  shampoo,
  microneedle,
  onShampooChange,
  onMicroneedleChange,
}: HairCareCardProps) {
  return (
    <Card title="Hair Care">
      <HairCareToggle
        label="Ketoconazole shampoo"
        done={shampoo}
        due={isShampooDay(dateKey)}
        onPress={() => onShampooChange(!shampoo)}
      />
      <HairCareToggle
        label="Microneedling"
        done={microneedle}
        due={isMicroneedleDay(dateKey)}
        onPress={() => onMicroneedleChange(!microneedle)}
        style={styles.toggleGap}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  toggleGap: {
    marginTop: Spacing.md,
  },
  toggleDue: {
    borderColor: Colors.terra,
    borderWidth: 1.5,
    backgroundColor: Colors.card,
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
  dueLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.terra,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
