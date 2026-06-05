import { type DayData, hasData } from '@/lib/storage';
import { isMicroneedleDay, isShampooDay } from '@/constants/schedule';

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return !isNaN(n) && n > 0 ? n : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// A cumulative day score from habits & wellbeing only — deficit is NOT a factor.
// Each applicable factor contributes 0–1; the score is the mean of the applicable
// ones, or null when nothing applies/is logged. Hair-care factors only apply on
// their scheduled days, so a non-shampoo day is never penalised for no shampoo.
export function dayScore(dateKey: string, data: DayData): number | null {
  if (!hasData(data)) return null;

  const factors: number[] = [];

  // Always applicable.
  factors.push(data.sugarFree ? 1 : 0);
  factors.push(data.focusHeld ? 1 : 0);

  // Hair care — only on scheduled days.
  if (isShampooDay(dateKey)) factors.push(data.shampoo ? 1 : 0);
  if (isMicroneedleDay(dateKey)) factors.push(data.microneedle ? 1 : 0);

  // Wellbeing — only when logged.
  const sleep = parseNum(data.sleep);
  if (sleep !== null) factors.push(clamp(sleep / 8, 0, 1));

  if (data.mealQuality > 0) factors.push(data.mealQuality / 5);

  if (factors.length === 0) return null;
  return factors.reduce((s, f) => s + f, 0) / factors.length;
}
