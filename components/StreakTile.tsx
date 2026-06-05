import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { toDateKey } from '@/lib/storage';
import { Colors, Spacing } from '@/constants/theme';

// Day count is inclusive: start date = day 1, yesterday = day 2, etc.
// Returns 0 when startDate is tomorrow (i.e. just reset — streak resumes from tomorrow).
function computeDays(startDateKey: string): number {
  const [y, m, d] = startDateKey.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const diffMs = todayMidnight.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000) + 1);
}

// Given a desired count, derive the start date that produces it
function backDate(count: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - (count - 1));
  return toDateKey(today);
}

interface StreakTileProps {
  label: string;
  accent: string;
  startDate: string | null;
  onChange: (startDate: string | null) => void;
}

export function StreakTile({ label, accent, startDate, onChange }: StreakTileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const inputRef = useRef<TextInput>(null);

  const count = startDate ? computeDays(startDate) : 0;

  // Auto-focus the edit input once it mounts
  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  function handleStart() {
    onChange(toDateKey(new Date()));
  }

  function handleReset() {
    // Set start to tomorrow so count = 0 right now; increments to 1 from tomorrow.
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    onChange(toDateKey(tomorrow));
  }

  function handleEditPress() {
    setEditVal(String(count));
    setIsEditing(true);
  }

  function handleEditDone() {
    const n = parseInt(editVal, 10);
    if (!isNaN(n) && n >= 1) {
      onChange(backDate(n));
    }
    setIsEditing(false);
  }

  function handleEditCancel() {
    setIsEditing(false);
  }

  return (
    <View style={[styles.tile, { borderLeftColor: accent }]}>
      <Text style={[styles.label, { color: accent }]}>{label}</Text>

      {!startDate ? (
        <Pressable onPress={handleStart} hitSlop={6} style={styles.startBtn}>
          <Text style={[styles.startText, { color: accent }]}>Start counting</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.countRow}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={styles.countInput}
                value={editVal}
                onChangeText={setEditVal}
                keyboardType="number-pad"
                maxLength={4}
                selectTextOnFocus
                onSubmitEditing={handleEditDone}
                returnKeyType="done"
              />
            ) : (
              <Text style={styles.count}>{count}</Text>
            )}
            <Text style={styles.unit}>days</Text>
          </View>

          <View style={styles.controls}>
            {isEditing ? (
              <>
                <Pressable onPress={handleEditCancel} hitSlop={8}>
                  <Text style={styles.ctrlBtn}>cancel</Text>
                </Pressable>
                <Pressable onPress={handleEditDone} hitSlop={8}>
                  <Text style={[styles.ctrlBtn, { color: accent }]}>✓ done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={handleReset} hitSlop={8}>
                  <Text style={styles.ctrlBtn}>reset</Text>
                </Pressable>
                <Pressable onPress={handleEditPress} hitSlop={8}>
                  <Text style={styles.ctrlBtn}>edit</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    borderLeftWidth: 3,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 4,
  },
  count: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    color: Colors.ink,
    lineHeight: 42,
  },
  countInput: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    color: Colors.ink,
    padding: 0,
    minWidth: 52,
    lineHeight: 42,
    borderBottomWidth: 2,
    borderBottomColor: Colors.line,
  },
  unit: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.inkSoft,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  ctrlBtn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.inkSoft,
  },
  startBtn: {
    marginTop: Spacing.xs,
  },
  startText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
});
