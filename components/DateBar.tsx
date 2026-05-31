import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

interface DateBarProps {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  saved: boolean;
}

export function DateBar({ date, onPrev, onNext, onToday, saved }: DateBarProps) {
  const atToday = isToday(date);

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <Pressable onPress={onToday} style={styles.center}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        hitSlop={12}
        style={styles.arrow}
        disabled={atToday}
      >
        <Text style={[styles.arrowText, atToday && styles.arrowDim]}>›</Text>
      </Pressable>

      <View style={styles.savedSlot}>
        {saved && <Text style={styles.savedText}>✓</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  arrow: {
    padding: Spacing.xs,
  },
  arrowText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 28,
    color: Colors.ink,
    lineHeight: 34,
  },
  arrowDim: {
    color: Colors.line,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 17,
    color: Colors.ink,
  },
  savedSlot: {
    width: 20,
    alignItems: 'center',
  },
  savedText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.sage,
  },
});
