import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface CardProps {
  title: string;
  children?: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children ?? <Text style={styles.placeholder}>—</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.inkSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  placeholder: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.inkSoft,
  },
});
