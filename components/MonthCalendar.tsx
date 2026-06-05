import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  type DayData,
  type DayEntry,
  DEFAULT_DAY,
  getDaysBetween,
  toDateKey,
} from '@/lib/storage';
import { deficitFor } from '@/lib/calories';
import { dayScore } from '@/lib/score';
import { isMicroneedleDay, isShampooDay } from '@/constants/schedule';

// Lighter → darker = lower → higher score. Neutral when no data.
const SCORE_SHADES = ['#d8ddcc', '#b3bd9f', '#96a37b', Colors.sage];

function shadeFor(score: number | null): string {
  if (score === null) return Colors.line;
  const idx = Math.min(SCORE_SHADES.length - 1, Math.floor(score * SCORE_SHADES.length));
  return SCORE_SHADES[idx];
}

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return !isNaN(n) && n > 0 ? n : null;
}

function todayKey(): string {
  return toDateKey(new Date());
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Cell {
  dateKey: string;
  dayNum: number;
}

// Done if logged; otherwise Due on its scheduled day; otherwise not applicable.
function routineState(done: boolean, scheduled: boolean): 'Done' | 'Due' | '—' {
  if (done) return 'Done';
  return scheduled ? 'Due' : '—';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function MonthCalendar({
  passiveCalories,
  width,
}: {
  passiveCalories: number;
  width: number;
}) {
  // First-of-month anchor for the currently displayed month.
  const [monthDate, setMonthDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [byDate, setByDate] = useState<Map<string, DayData>>(new Map());
  const [selected, setSelected] = useState<{ dateKey: string; data: DayData } | null>(null);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  useEffect(() => {
    let active = true;
    const monthStart = toDateKey(new Date(year, month, 1));
    const monthEnd = toDateKey(new Date(year, month + 1, 0));
    getDaysBetween(monthStart, monthEnd).then((entries: DayEntry[]) => {
      if (!active) return;
      setByDate(new Map(entries.map((e) => [e.dateKey, e.data])));
    });
    return () => {
      active = false;
    };
  }, [year, month]);

  // Build the grid: leading blanks for weekday alignment, then each day, then
  // trailing blanks to complete the final row.
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Cell | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateKey: toDateKey(new Date(year, month, d)), dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Cell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = todayKey();
  const gap = 4;
  const cellSize = Math.floor((width - gap * 6) / 7);

  function openDay(dateKey: string) {
    setSelected({ dateKey, data: byDate.get(dateKey) ?? { ...DEFAULT_DAY } });
  }

  return (
    <View>
      {/* Month nav */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => setMonthDate(new Date(year, month - 1, 1))}
          hitSlop={10}
          style={styles.navBtn}
        >
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Pressable
          onPress={() => setMonthDate(new Date(year, month + 1, 1))}
          hitSlop={10}
          style={styles.navBtn}
        >
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      {/* Weekday header */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ width: cellSize }}>
            <Text style={styles.weekdayLabel}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {weeks.map((wk, wi) => (
        <View key={wi} style={[styles.weekRow, { marginBottom: gap }]}>
          {wk.map((cell, ci) => {
            if (!cell) {
              return <View key={ci} style={{ width: cellSize, height: cellSize }} />;
            }
            const data = byDate.get(cell.dateKey);
            const score = data ? dayScore(cell.dateKey, data) : null;
            const isToday = cell.dateKey === today;
            return (
              <Pressable
                key={ci}
                onPress={() => openDay(cell.dateKey)}
                style={[
                  styles.dayCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: shadeFor(score),
                  },
                  isToday && styles.dayCellToday,
                ]}
              >
                <Text style={[styles.dayNum, score !== null && score >= 0.5 && styles.dayNumDark]}>
                  {cell.dayNum}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Day detail */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selected && <DayDetail dateKey={selected.dateKey} data={selected.data} passiveCalories={passiveCalories} />}
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DayDetail({
  dateKey,
  data,
  passiveCalories,
}: {
  dateKey: string;
  data: DayData;
  passiveCalories: number;
}) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const heading = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const sleep = parseNum(data.sleep);
  const weight = parseNum(data.weight);
  const deficit = deficitFor(data, passiveCalories);
  const score = dayScore(dateKey, data);

  const deficitText =
    deficit === null
      ? '—'
      : deficit >= 0
      ? `+${Math.round(deficit)} deficit`
      : `−${Math.round(-deficit)} surplus`;

  return (
    <View>
      <Text style={styles.detailHeading}>{heading}</Text>
      {score !== null && (
        <Text style={styles.detailScore}>Day score {Math.round(score * 100)}</Text>
      )}

      <DetailRow label="Sleep" value={sleep === null ? '—' : `${sleep} h`} />
      <DetailRow label="Calories" value={deficitText} />
      <DetailRow label="Weight" value={weight === null ? '—' : `${weight} lb`} />

      <View style={styles.detailDivider} />

      <DetailRow
        label="Shampoo"
        value={routineState(data.shampoo, isShampooDay(dateKey))}
      />
      <DetailRow
        label="Microneedling"
        value={routineState(data.microneedle, isMicroneedleDay(dateKey))}
      />

      <View style={styles.detailDivider} />

      <DetailRow label="Sugar-free" value={data.sugarFree ? '✓' : '✗'} />
      <DetailRow label="Focus" value={data.focusHeld ? '✓' : '✗'} />
      <DetailRow
        label="Meal quality"
        value={data.mealQuality > 0 ? `${data.mealQuality}/5` : '—'}
      />
      <DetailRow label="Energy" value={data.energy > 0 ? String(data.energy) : '—'} />
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  navArrow: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: Colors.ink,
  },
  navTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: Colors.ink,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.inkSoft,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  dayCell: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  dayNum: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.ink,
  },
  dayNumDark: {
    color: '#fff',
  },
  // Detail modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(46, 40, 35, 0.4)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  detailHeading: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: Colors.ink,
    marginBottom: 2,
  },
  detailScore: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.sage,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.inkSoft,
  },
  detailValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacing.sm,
  },
  closeBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.terra,
  },
});
