import { type DayData } from '@/lib/storage';

// Calories burned on a day = passive baseline + any logged exercise burn.
export function burnedFor(data: DayData, passiveCalories: number): number {
  return passiveCalories + (data.exerciseBurned ?? 0);
}

// Deficit = burned − consumed (positive = ate under burn; negative = surplus).
// Null when calories are unlogged. Single source of truth for the chart + calendar.
export function deficitFor(data: DayData, passiveCalories: number): number | null {
  return data.calories === null ? null : burnedFor(data, passiveCalories) - data.calories;
}
