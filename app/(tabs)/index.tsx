import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DateBar } from '@/components/DateBar';
import { EnergyNotesCard } from '@/components/cards/EnergyNotesCard';
import { HairCareCard } from '@/components/cards/HairCareCard';
import { HydrationCard } from '@/components/cards/HydrationCard';
import { MovementCard } from '@/components/cards/MovementCard';
import { NourishmentCard } from '@/components/cards/NourishmentCard';
import { SleepCard } from '@/components/cards/SleepCard';
import { WeightCard } from '@/components/cards/WeightCard';
import { type DayData, DEFAULT_DAY, getDay, saveDay, toDateKey } from '@/lib/storage';
import { Colors, Spacing } from '@/constants/theme';

function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dayData, setDayData] = useState<DayData>({ ...DEFAULT_DAY });
  const [savedVisible, setSavedVisible] = useState(false);

  const latestData = useRef<DayData>({ ...DEFAULT_DAY });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
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

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function updateDay(patch: Partial<DayData>) {
    const dateKey = toDateKey(selectedDate);
    setDayData((prev) => {
      const next = { ...prev, ...patch };
      latestData.current = next;
      return next;
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDay(dateKey, latestData.current);
      setSavedVisible(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedVisible(false), 1500);
    }, 500);
  }

  return (
    <View style={styles.container}>
      <DateBar
        date={selectedDate}
        onPrev={() => setSelectedDate((d) => addDays(d, -1))}
        onNext={() => setSelectedDate((d) => addDays(d, 1))}
        onToday={() => setSelectedDate(new Date())}
        saved={savedVisible}
      />
      <ScrollView
        contentContainerStyle={styles.content}
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
          onMinChange={(moveMin) => updateDay({ moveMin })}
          onNoteChange={(moveNote) => updateDay({ moveNote })}
        />
        <NourishmentCard
          meals={dayData.meals}
          onChange={(meals) => updateDay({ meals })}
        />
        <HydrationCard
          water={dayData.water}
          sugarFree={dayData.sugarFree}
          onWaterChange={(water) => updateDay({ water })}
          onSugarFreeChange={(sugarFree) => updateDay({ sugarFree })}
        />
        <WeightCard
          value={dayData.weight}
          onChange={(weight) => updateDay({ weight })}
        />
        <HairCareCard
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
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
