import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { DateBar } from '@/components/DateBar';
import { StreakTile } from '@/components/StreakTile';
import { EnergyNotesCard } from '@/components/cards/EnergyNotesCard';
import { HairCareCard } from '@/components/cards/HairCareCard';
import { HydrationCard } from '@/components/cards/HydrationCard';
import { MovementCard } from '@/components/cards/MovementCard';
import { NourishmentCard } from '@/components/cards/NourishmentCard';
import { SleepCard } from '@/components/cards/SleepCard';
import { WeightCard } from '@/components/cards/WeightCard';
import {
  type DayData,
  type Settings,
  DEFAULT_DAY,
  DEFAULT_SETTINGS,
  getDay,
  getSettings,
  saveDay,
  saveSettings,
  toDateKey,
} from '@/lib/storage';
import { Colors, Spacing } from '@/constants/theme';

function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dayData, setDayData] = useState<DayData>({ ...DEFAULT_DAY });
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [savedVisible, setSavedVisible] = useState(false);

  const latestData = useRef<DayData>({ ...DEFAULT_DAY });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDateKey = useRef<string | null>(null);

  // Load settings once on mount
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const flushSave = useCallback(() => {
    if (!saveTimer.current || !pendingDateKey.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    saveDay(pendingDateKey.current, latestData.current);
    pendingDateKey.current = null;
  }, []);

  // Load day data whenever the selected date changes; flush any pending save first
  useEffect(() => {
    flushSave();
    let active = true;
    getDay(toDateKey(selectedDate)).then((data) => {
      if (active) {
        setDayData(data);
        latestData.current = data;
      }
    });
    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Flush + cleanup on unmount
  useEffect(() => {
    return () => {
      flushSave();
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  // Flush when leaving the Today tab so Trends always reads committed data
  useFocusEffect(
    useCallback(() => () => flushSave(), [flushSave])
  );

  function updateDay(patch: Partial<DayData>) {
    const dateKey = toDateKey(selectedDate);
    setDayData((prev) => {
      const next = { ...prev, ...patch };
      latestData.current = next;
      return next;
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingDateKey.current = dateKey;
    saveTimer.current = setTimeout(() => {
      saveDay(dateKey, latestData.current);
      saveTimer.current = null;
      pendingDateKey.current = null;
      setSavedVisible(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedVisible(false), 1500);
    }, 500);
  }

  // Settings writes are discrete actions (no debounce needed)
  function updateSettings(patch: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  return (
    <View style={styles.container}>
      {/* Streak tiles — above the date bar */}
      <View style={styles.streakRow}>
        <StreakTile
          label="Sugar-free"
          accent={Colors.sage}
          startDate={settings.sugarStart}
          onChange={(sugarStart) => updateSettings({ sugarStart })}
        />
        <StreakTile
          label="Focus"
          accent={Colors.plum}
          startDate={settings.focusStart}
          onChange={(focusStart) => updateSettings({ focusStart })}
        />
      </View>

      <DateBar
        date={selectedDate}
        onPrev={() => setSelectedDate((d) => addDays(d, -1))}
        onNext={() => setSelectedDate((d) => addDays(d, 1))}
        onToday={() => setSelectedDate(new Date())}
        saved={savedVisible}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SleepCard
          value={dayData.sleep}
          onChange={(sleep) => updateDay({ sleep })}
        />
        <MovementCard
          moveMin={dayData.moveMin}
          moveNote={dayData.moveNote}
          exerciseBurned={dayData.exerciseBurned}
          passiveCalories={settings.passiveCalories}
          onMinChange={(moveMin) => updateDay({ moveMin })}
          onNoteChange={(moveNote) => updateDay({ moveNote })}
          onExerciseBurnedChange={(exerciseBurned) => updateDay({ exerciseBurned })}
          onPassiveCaloriesChange={(passiveCalories) => updateSettings({ passiveCalories })}
        />
        <NourishmentCard
          calories={dayData.calories}
          mealQuality={dayData.mealQuality}
          onCaloriesChange={(calories) => updateDay({ calories })}
          onMealQualityChange={(mealQuality) => updateDay({ mealQuality })}
        />
        <HydrationCard
          water={dayData.water}
          sugarFree={dayData.sugarFree}
          focusHeld={dayData.focusHeld}
          onWaterChange={(water) => updateDay({ water })}
          onSugarFreeChange={(sugarFree) => updateDay({ sugarFree })}
          onFocusHeldChange={(focusHeld) => updateDay({ focusHeld })}
        />
        <WeightCard
          value={dayData.weight}
          onChange={(weight) => updateDay({ weight })}
        />
        <HairCareCard
          dateKey={toDateKey(selectedDate)}
          shampoo={dayData.shampoo}
          microneedle={dayData.microneedle}
          onShampooChange={(shampoo) => updateDay({ shampoo })}
          onMicroneedleChange={(microneedle) => updateDay({ microneedle })}
        />
        <EnergyNotesCard
          energy={dayData.energy}
          notes={dayData.notes}
          onEnergyChange={(energy) => updateDay({ energy })}
          onNotesChange={(notes) => updateDay({ notes })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  streakRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xl,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
