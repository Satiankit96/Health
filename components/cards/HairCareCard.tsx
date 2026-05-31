import { Pressable, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/Card';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface HairCareCardProps {
  shampoo: boolean;
  microneedle: boolean;
  onShampooChange: (v: boolean) => void;
  onMicroneedleChange: (v: boolean) => void;
}

export function HairCareCard({
  shampoo,
  microneedle,
  onShampooChange,
  onMicroneedleChange,
}: HairCareCardProps) {
  return (
    <Card title="Hair Care">
      <Pressable
        onPress={() => onShampooChange(!shampoo)}
        style={[styles.toggle, shampoo && styles.toggleActive]}
      >
        <Text style={[styles.toggleText, shampoo && styles.toggleTextActive]}>
          {shampoo ? '✓  Ketoconazole shampoo' : 'Ketoconazole shampoo'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onMicroneedleChange(!microneedle)}
        style={[styles.toggle, styles.toggleGap, microneedle && styles.toggleActive]}
      >
        <Text style={[styles.toggleText, microneedle && styles.toggleTextActive]}>
          {microneedle ? '✓  Microneedling' : 'Microneedling'}
        </Text>
      </Pressable>
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
    marginTop: Spacing.sm,
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
