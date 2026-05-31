import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { type DayData, type DayEntry, getRecentDays } from '@/lib/storage';
import { Colors, Spacing } from '@/constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return !isNaN(n) && n > 0 ? n : null;
}

function parseIntNum(s: string): number | null {
  const n = parseInt(s, 10);
  return !isNaN(n) && n > 0 ? n : null;
}

// Positive = b is after a, negative = b is before a
function daysBetween(a: string, b: string): number {
  const ms = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((ms(b) - ms(a)) / 86_400_000);
}

function weekdayInitial(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return 'SMTWTFS'[new Date(y, m - 1, d).getDay()];
}

function todayKey(): string {
  const t = new Date();
  return [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, '0'),
    String(t.getDate()).padStart(2, '0'),
  ].join('-');
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

const BAR_SVG_H = 96;
const BAR_LABEL_H = 18;
const BAR_USABLE_H = BAR_SVG_H - BAR_LABEL_H;
const BAR_TOP_PAD = 6;

interface BarChartProps {
  days: DayEntry[];
  getValue: (data: DayData) => number | null;
  barColor: string;
  width: number;
}

function BarChart({ days, getValue, barColor, width }: BarChartProps) {
  const values = days.map((d) => getValue(d.data) ?? 0);
  const maxVal = Math.max(...values, 1);
  const slotW = width / days.length;
  const barW = Math.max(slotW * 0.55, 6);
  const barPad = (slotW - barW) / 2;
  const today = todayKey();

  return (
    <Svg width={width} height={BAR_SVG_H}>
      {days.map((day, i) => {
        const v = getValue(day.data);
        const hasData = v !== null;
        const bh = hasData
          ? Math.max(3, (v! / maxVal) * (BAR_USABLE_H - BAR_TOP_PAD))
          : 3;
        const isToday = day.dateKey === today;
        return (
          <Rect
            key={day.dateKey}
            x={i * slotW + barPad}
            y={BAR_USABLE_H - bh}
            width={barW}
            height={bh}
            rx={3}
            fill={hasData ? barColor : Colors.line}
            stroke={isToday ? Colors.ink : 'none'}
            strokeWidth={isToday ? 1.5 : 0}
          />
        );
      })}
      {days.map((day, i) => {
        const isToday = day.dateKey === today;
        return (
          <SvgText
            key={`lbl-${day.dateKey}`}
            x={i * slotW + slotW / 2}
            y={BAR_SVG_H - 3}
            fontSize={10}
            textAnchor="middle"
            fill={isToday ? Colors.ink : Colors.inkSoft}
            fontWeight={isToday ? '600' : '400'}
          >
            {weekdayInitial(day.dateKey)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Weight trend chart ───────────────────────────────────────────────────────

const W_SVG_H = 180;
const W_TOP = 14;
const W_BOT = 18;
const W_LEFT = 34; // space for y-axis labels
const W_USABLE_H = W_SVG_H - W_TOP - W_BOT;

interface WPoint { dateKey: string; weight: number }
interface APoint { dateKey: string; avg: number }

function trailingAvg(pts: WPoint[], idx: number): number {
  const endKey = pts[idx].dateKey;
  // Collect all points within the 7-day window ending on endKey
  const window = pts.filter((p) => {
    const diff = daysBetween(p.dateKey, endKey); // positive = p is before end
    return diff >= 0 && diff <= 6;
  });
  return window.reduce((s, p) => s + p.weight, 0) / window.length;
}

function WeightChart({ days, chartWidth }: { days: DayEntry[]; chartWidth: number }) {
  const wPts: WPoint[] = days
    .map((d) => ({ dateKey: d.dateKey, weight: parseNum(d.data.weight) }))
    .filter((d): d is WPoint => d.weight !== null);

  if (wPts.length < 2) {
    return (
      <Text style={styles.emptyMsg}>
        Log a couple of mornings and your trend will appear here.
      </Text>
    );
  }

  const weights = wPts.map((p) => p.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const yRange = Math.max(rawMax - rawMin, 2);
  const yPad = yRange * 0.22;
  const yMin = rawMin - yPad;
  const yMax = rawMax + yPad;

  const firstKey = wPts[0].dateKey;
  const lastKey = wPts[wPts.length - 1].dateKey;
  const spanDays = Math.max(1, daysBetween(firstKey, lastKey));
  const drawW = chartWidth - W_LEFT - 4;

  function toX(dk: string) {
    return W_LEFT + (daysBetween(firstKey, dk) / spanDays) * drawW;
  }
  function toY(w: number) {
    return W_TOP + ((yMax - w) / (yMax - yMin)) * W_USABLE_H;
  }
  function fmt(n: number) {
    return n.toFixed(1);
  }

  const aPts: APoint[] = wPts.map((p, i) => ({
    dateKey: p.dateKey,
    avg: trailingAvg(wPts, i),
  }));

  const rawPoly = wPts
    .map((p) => `${toX(p.dateKey).toFixed(1)},${toY(p.weight).toFixed(1)}`)
    .join(' ');
  const avgPoly = aPts
    .map((p) => `${toX(p.dateKey).toFixed(1)},${toY(p.avg).toFixed(1)}`)
    .join(' ');

  // Pace: change in 7-day average over the full observed span
  const paceVal =
    spanDays >= 7
      ? (aPts[aPts.length - 1].avg - aPts[0].avg) / (spanDays / 7)
      : null;

  const paceText =
    paceVal === null
      ? null
      : paceVal < 0
      ? `▼ ${Math.abs(paceVal).toFixed(1)} lb / week`
      : `▲ ${paceVal.toFixed(1)} lb / week`;

  const caption =
    paceVal !== null && paceVal < -1.5
      ? 'Dropping faster than ~1 lb/week — eating a little more protects muscle.'
      : 'Aim: about 1 lb/week. A steady pace beats a fast one.';

  return (
    <View>
      <Svg width={chartWidth} height={W_SVG_H}>
        {/* Y-axis labels */}
        <SvgText x={1} y={W_TOP + 5} fontSize={9} fill={Colors.inkSoft}>
          {fmt(rawMax)}
        </SvgText>
        <SvgText x={1} y={W_SVG_H - W_BOT + 4} fontSize={9} fill={Colors.inkSoft}>
          {fmt(rawMin)}
        </SvgText>

        {/* Raw data — faint warm-grey line + small dots */}
        <Polyline
          points={rawPoly}
          fill="none"
          stroke="#d4c9b8"
          strokeWidth={1.2}
        />
        {wPts.map((p) => (
          <Circle
            key={p.dateKey}
            cx={toX(p.dateKey)}
            cy={toY(p.weight)}
            r={2.5}
            fill="#d4c9b8"
          />
        ))}

        {/* 7-day trailing average — bold gold line + dots */}
        <Polyline
          points={avgPoly}
          fill="none"
          stroke={Colors.gold}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {aPts.map((p) => (
          <Circle
            key={`avg-${p.dateKey}`}
            cx={toX(p.dateKey)}
            cy={toY(p.avg)}
            r={3.5}
            fill={Colors.gold}
          />
        ))}
      </Svg>

      {paceText && <Text style={styles.pace}>{paceText}</Text>}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrendsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 2 * Spacing.md;
  const [days28, setDays28] = useState<DayEntry[]>([]);

  // Reload whenever this tab comes into focus so new Today entries appear immediately
  useFocusEffect(
    useCallback(() => {
      getRecentDays(28).then(setDays28);
    }, [])
  );

  const days7 = days28.slice(-7);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.section}>This week</Text>

      <Text style={styles.chartLabel}>Sleep</Text>
      <BarChart
        days={days7}
        getValue={(d) => parseNum(d.sleep)}
        barColor={Colors.terra}
        width={chartWidth}
      />

      <Text style={[styles.chartLabel, styles.chartLabelSpaced]}>Active minutes</Text>
      <BarChart
        days={days7}
        getValue={(d) => parseIntNum(d.moveMin)}
        barColor={Colors.sage}
        width={chartWidth}
      />

      <View style={styles.divider} />

      <Text style={styles.section}>Weight</Text>
      <WeightChart days={days28} chartWidth={chartWidth} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  section: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: Colors.ink,
    marginBottom: Spacing.md,
  },
  chartLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.inkSoft,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  chartLabelSpaced: {
    marginTop: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacing.xl,
  },
  emptyMsg: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.inkSoft,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  pace: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: Colors.gold,
    marginTop: Spacing.md,
    marginBottom: 2,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.inkSoft,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});
