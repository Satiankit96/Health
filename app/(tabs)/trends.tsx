import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import {
  type DayData,
  type DayEntry,
  DEFAULT_SETTINGS,
  getDaysBetween,
  getSettings,
} from '@/lib/storage';
import { Colors, Spacing } from '@/constants/theme';
import { burnedFor, deficitFor } from '@/lib/calories';
import { MonthCalendar } from '@/components/MonthCalendar';
import { TRACKING_START } from '@/constants/schedule';

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

function shiftDate(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
}

// ─── Reusable line renderer ─────────────────────────────────────────────────────
// A single series: polyline through the logged points + a dot per point. Points
// with no data (value === null) are skipped, so a half-logged window never breaks
// the line or throws on empty input. toX/toY map a date / value into pixel space.

interface SeriesPoint {
  dateKey: string;
  value: number | null;
}

function makeToY(min: number, max: number, top: number, usableH: number) {
  const span = max - min || 1;
  return (v: number) => top + ((max - v) / span) * usableH;
}

function LineSeries({
  points,
  toX,
  toY,
  color,
  strokeWidth = 2.5,
  dotR = 3.5,
}: {
  points: SeriesPoint[];
  toX: (dateKey: string) => number;
  toY: (value: number) => number;
  color: string;
  strokeWidth?: number;
  dotR?: number;
}) {
  const valid = points.filter(
    (p): p is { dateKey: string; value: number } => p.value !== null
  );
  if (valid.length === 0) return null;

  const poly = valid
    .map((p) => `${toX(p.dateKey).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(' ');

  return (
    <>
      <Polyline
        points={poly}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {valid.map((p) => (
        <Circle key={p.dateKey} cx={toX(p.dateKey)} cy={toY(p.value)} r={dotR} fill={color} />
      ))}
    </>
  );
}

// Small colour-keyed legend rendered below a chart.
function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: it.color }]} />
          <Text style={styles.legendLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Shared line-chart geometry ─────────────────────────────────────────────────

const L_SVG_H = 180;
const L_TOP = 14;
const L_BOT = 18;
const L_LEFT = 38; // space for left y-axis labels
const L_RIGHT = 38; // space for right y-axis labels (dual-axis chart)
const L_USABLE_H = L_SVG_H - L_TOP - L_BOT;

// X mapper across the full window so every chart shares the same horizontal scale.
function makeToX(days: DayEntry[], left: number, drawW: number) {
  const firstKey = days[0].dateKey;
  const lastKey = days[days.length - 1].dateKey;
  const spanDays = Math.max(1, daysBetween(firstKey, lastKey));
  return (dateKey: string) => left + (daysBetween(firstKey, dateKey) / spanDays) * drawW;
}

// ─── Single-axis line chart (used for Calories + Sleep) ─────────────────────────

interface SingleLineChartProps {
  days: DayEntry[];
  chartWidth: number;
  series: { points: SeriesPoint[]; color: string }[];
  fmtY: (n: number) => string;
  emptyMsg: string;
}

function SingleLineChart({ days, chartWidth, series, fmtY, emptyMsg }: SingleLineChartProps) {
  const allVals = series
    .flatMap((s) => s.points.map((p) => p.value))
    .filter((v): v is number => v !== null);

  if (days.length === 0 || allVals.length === 0) {
    return <Text style={styles.emptyMsg}>{emptyMsg}</Text>;
  }

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const range = Math.max(rawMax - rawMin, 1);
  const pad = range * 0.15;

  const drawW = chartWidth - L_LEFT - 4;
  const toX = makeToX(days, L_LEFT, drawW);
  const toY = makeToY(rawMin - pad, rawMax + pad, L_TOP, L_USABLE_H);

  return (
    <Svg width={chartWidth} height={L_SVG_H}>
      <SvgText x={1} y={L_TOP + 5} fontSize={9} fill={Colors.inkSoft}>
        {fmtY(rawMax)}
      </SvgText>
      <SvgText x={1} y={L_SVG_H - L_BOT + 4} fontSize={9} fill={Colors.inkSoft}>
        {fmtY(rawMin)}
      </SvgText>
      {series.map((s) => (
        <LineSeries key={s.color} points={s.points} toX={toX} toY={toY} color={s.color} />
      ))}
    </Svg>
  );
}

// ─── Weight trend helpers (shared by the dual-axis + standalone weight charts) ──

interface WPoint {
  dateKey: string;
  weight: number;
}

function trailingAvg(pts: WPoint[], idx: number): number {
  const endKey = pts[idx].dateKey;
  // Collect all points within the 7-day window ending on endKey
  const window = pts.filter((p) => {
    const diff = daysBetween(p.dateKey, endKey); // positive = p is before end
    return diff >= 0 && diff <= 6;
  });
  return window.reduce((s, p) => s + p.weight, 0) / window.length;
}

function weightPoints(days: DayEntry[]): WPoint[] {
  return days
    .map((d) => ({ dateKey: d.dateKey, weight: parseNum(d.data.weight) }))
    .filter((d): d is WPoint => d.weight !== null);
}

// Change in the 7-day average over the observed span, expressed as lb/week.
function paceFromAvg(avgValues: number[], spanDays: number): number | null {
  if (spanDays < 7 || avgValues.length < 2) return null;
  return (avgValues[avgValues.length - 1] - avgValues[0]) / (spanDays / 7);
}

const FAST_DROP_CAPTION =
  'Dropping faster than ~1 lb/week — eating a little more protects muscle.';

// ─── Chart 1: Calories (consumed vs burned, shared kcal axis) ───────────────────

function CaloriesChart({
  days,
  passiveCalories,
  chartWidth,
}: {
  days: DayEntry[];
  passiveCalories: number;
  chartWidth: number;
}) {
  const consumed: SeriesPoint[] = days.map((d) => ({
    dateKey: d.dateKey,
    value: d.data.calories,
  }));
  const burned: SeriesPoint[] = days.map((d) => ({
    dateKey: d.dateKey,
    value: burnedFor(d.data, passiveCalories),
  }));
  const deficit: SeriesPoint[] = days.map((d) => ({
    dateKey: d.dateKey,
    value: deficitFor(d.data, passiveCalories),
  }));

  return (
    <View>
      <SingleLineChart
        days={days}
        chartWidth={chartWidth}
        series={[
          { points: consumed, color: Colors.terra },
          { points: burned, color: Colors.sage },
          { points: deficit, color: Colors.plum },
        ]}
        fmtY={(n) => String(Math.round(n))}
        emptyMsg="Log a day's calories to see consumed vs burned."
      />
      <Legend
        items={[
          { color: Colors.terra, label: 'Consumed' },
          { color: Colors.sage, label: 'Burned' },
          { color: Colors.plum, label: 'Deficit' },
        ]}
      />
    </View>
  );
}

// ─── Chart 2: Deficit (left axis) vs Weight 7-day avg (right axis) ──────────────

function DeficitWeightChart({
  days,
  passiveCalories,
  chartWidth,
}: {
  days: DayEntry[];
  passiveCalories: number;
  chartWidth: number;
}) {
  // Deficit — only on days where calories were logged.
  const defPts: SeriesPoint[] = days.map((d) => ({
    dateKey: d.dateKey,
    value: deficitFor(d.data, passiveCalories),
  }));
  const defVals = defPts.map((p) => p.value).filter((v): v is number => v !== null);

  // Weight 7-day trailing average.
  const wPts = weightPoints(days);
  const avgPts: SeriesPoint[] = wPts.map((p, i) => ({
    dateKey: p.dateKey,
    value: trailingAvg(wPts, i),
  }));
  const avgVals = avgPts.map((p) => p.value as number);

  if (days.length === 0 || (defVals.length === 0 && avgVals.length === 0)) {
    return <Text style={styles.emptyMsg}>Log calories and weight to compare them here.</Text>;
  }

  const drawW = chartWidth - L_LEFT - L_RIGHT;
  const toX = makeToX(days, L_LEFT, drawW);

  // Left (deficit) domain: fixed -1000–2000 so the axis is always comparable.
  const toYLeft = makeToY(-1000, 2000, L_TOP, L_USABLE_H);
  const zeroY = toYLeft(0);

  // Right (weight) domain — its own min/max, in lb.
  const wMin = avgVals.length ? Math.min(...avgVals) : 0;
  const wMax = avgVals.length ? Math.max(...avgVals) : 1;
  const wPad = Math.max(wMax - wMin, 1) * 0.2;
  const toYRight = makeToY(wMin - wPad, wMax + wPad, L_TOP, L_USABLE_H);

  // Pace caption (reused weight-trend guardrail) over the weight data span.
  const wSpan =
    wPts.length >= 2
      ? Math.max(1, daysBetween(wPts[0].dateKey, wPts[wPts.length - 1].dateKey))
      : 0;
  const paceVal = paceFromAvg(avgVals, wSpan);
  const showGuardrail = paceVal !== null && paceVal < -1.5;

  return (
    <View>
      <Svg width={chartWidth} height={L_SVG_H}>
        {/* Dashed zero reference (above = deficit, below = surplus) */}
        <Line
          x1={L_LEFT}
          y1={zeroY}
          x2={chartWidth - L_RIGHT}
          y2={zeroY}
          stroke={Colors.line}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <SvgText x={1} y={zeroY + 3} fontSize={9} fill={Colors.inkSoft}>
          0
        </SvgText>

        {/* Left axis labels (deficit kcal) — fixed scale */}
        <SvgText x={1} y={L_TOP + 5} fontSize={9} fill={Colors.plum}>
          2000
        </SvgText>
        <SvgText x={1} y={L_SVG_H - L_BOT + 4} fontSize={9} fill={Colors.plum}>
          -1000
        </SvgText>

        {/* Right axis labels (weight lb) */}
        {avgVals.length > 0 && (
          <>
            <SvgText
              x={chartWidth - 1}
              y={L_TOP + 5}
              fontSize={9}
              textAnchor="end"
              fill={Colors.gold}
            >
              {wMax.toFixed(1)}
            </SvgText>
            <SvgText
              x={chartWidth - 1}
              y={L_SVG_H - L_BOT + 4}
              fontSize={9}
              textAnchor="end"
              fill={Colors.gold}
            >
              {wMin.toFixed(1)}
            </SvgText>
          </>
        )}

        <LineSeries points={defPts} toX={toX} toY={toYLeft} color={Colors.plum} />
        <LineSeries points={avgPts} toX={toX} toY={toYRight} color={Colors.gold} />
      </Svg>

      <Legend
        items={[
          { color: Colors.plum, label: 'Deficit (kcal)' },
          { color: Colors.gold, label: 'Weight 7-day avg (lb)' },
        ]}
      />
      {showGuardrail && <Text style={styles.caption}>{FAST_DROP_CAPTION}</Text>}
    </View>
  );
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

function WeightChart({ days, chartWidth }: { days: DayEntry[]; chartWidth: number }) {
  const wPts = weightPoints(days);

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
  const toY = makeToY(yMin, yMax, W_TOP, W_USABLE_H);
  function fmt(n: number) {
    return n.toFixed(1);
  }

  const rawPts: SeriesPoint[] = wPts.map((p) => ({ dateKey: p.dateKey, value: p.weight }));
  const avgPts: SeriesPoint[] = wPts.map((p, i) => ({
    dateKey: p.dateKey,
    value: trailingAvg(wPts, i),
  }));

  // Pace: change in 7-day average over the full observed span
  const paceVal = paceFromAvg(
    avgPts.map((p) => p.value as number),
    spanDays
  );

  const paceText =
    paceVal === null
      ? null
      : paceVal < 0
      ? `▼ ${Math.abs(paceVal).toFixed(1)} lb / week`
      : `▲ ${paceVal.toFixed(1)} lb / week`;

  const caption =
    paceVal !== null && paceVal < -1.5
      ? FAST_DROP_CAPTION
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
        <LineSeries
          points={rawPts}
          toX={toX}
          toY={toY}
          color="#d4c9b8"
          strokeWidth={1.2}
          dotR={2.5}
        />

        {/* 7-day trailing average — bold gold line + dots */}
        <LineSeries points={avgPts} toX={toX} toY={toY} color={Colors.gold} />
      </Svg>

      {paceText && <Text style={styles.pace}>{paceText}</Text>}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: 7, label: '7D' },
  { value: 31, label: '31D' },
  { value: 90, label: '3M' },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]['value'];

export default function TrendsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 2 * Spacing.md;
  const [days, setDays] = useState<DayEntry[]>([]);
  const [passiveCalories, setPassiveCalories] = useState(DEFAULT_SETTINGS.passiveCalories);
  const [range, setRange] = useState<RangeValue>(31);

  // Reload on focus and whenever the range selector changes.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const tk = todayKey();
      const rangeStart = shiftDate(tk, -(range - 1));
      const startKey = rangeStart < TRACKING_START ? TRACKING_START : rangeStart;
      Promise.all([getDaysBetween(startKey, tk), getSettings()]).then(([d, s]) => {
        if (!active) return;
        setDays(d);
        setPassiveCalories(s.passiveCalories);
      });
      return () => {
        active = false;
      };
    }, [range])
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Range selector */}
      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map(({ value, label }) => {
          const active = range === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.rangePill, active && styles.rangePillActive]}
              onPress={() => setRange(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangePillText, active && styles.rangePillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.section}>Calories</Text>
      <CaloriesChart days={days} passiveCalories={passiveCalories} chartWidth={chartWidth} />

      <View style={styles.divider} />

      <Text style={styles.section}>Deficit vs weight</Text>
      <DeficitWeightChart days={days} passiveCalories={passiveCalories} chartWidth={chartWidth} />

      <View style={styles.divider} />

      <Text style={styles.section}>Sleep</Text>
      <SingleLineChart
        days={days}
        chartWidth={chartWidth}
        series={[
          {
            points: days.map((d) => ({ dateKey: d.dateKey, value: parseNum(d.data.sleep) })),
            color: Colors.terra,
          },
        ]}
        fmtY={(n) => n.toFixed(1)}
        emptyMsg="Log a few nights and your sleep trend will appear here."
      />

      <View style={styles.divider} />

      <Text style={styles.section}>Month</Text>
      <MonthCalendar passiveCalories={passiveCalories} width={chartWidth} />

      <View style={styles.divider} />

      <Text style={styles.section}>This week</Text>
      <Text style={styles.chartLabel}>Active minutes</Text>
      <BarChart
        days={days.slice(-7)}
        getValue={(d) => parseIntNum(d.moveMin)}
        barColor={Colors.sage}
        width={chartWidth}
      />

      <View style={styles.divider} />

      <Text style={styles.section}>Weight</Text>
      <WeightChart days={days} chartWidth={chartWidth} />
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.inkSoft,
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
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rangePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  rangePillActive: {
    backgroundColor: Colors.terra,
    borderColor: Colors.terra,
  },
  rangePillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.inkSoft,
  },
  rangePillTextActive: {
    color: '#fff',
  },
});
