import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/Card';
import { type Meal, DEFAULT_MEAL } from '@/lib/storage';
import { Colors, Radius, Spacing } from '@/constants/theme';

type TagKey = 'protein' | 'ironRich' | 'omega3' | 'vegFruit';

const TAGS: Array<{ key: TagKey; label: string; color: string }> = [
  { key: 'protein',  label: 'Protein',   color: Colors.terra },
  { key: 'ironRich', label: 'Iron-rich',  color: Colors.plum },
  { key: 'omega3',   label: 'Omega-3',   color: Colors.sage },
  { key: 'vegFruit', label: 'Veg/fruit', color: Colors.gold },
];

interface NourishmentCardProps {
  meals: Meal[];
  onChange: (meals: Meal[]) => void;
}

export function NourishmentCard({ meals, onChange }: NourishmentCardProps) {
  function addMeal() {
    onChange([...meals, { ...DEFAULT_MEAL, id: Date.now().toString() }]);
  }

  function deleteMeal(id: string) {
    onChange(meals.filter((m) => m.id !== id));
  }

  function updateMeal(id: string, patch: Partial<Meal>) {
    onChange(meals.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  return (
    <Card title="Nourishment">
      {meals.map((meal, idx) => (
        <View
          key={meal.id}
          style={[styles.mealRow, idx > 0 && styles.mealDivider]}
        >
          {/* Dish name + delete */}
          <View style={styles.mealTop}>
            <TextInput
              style={styles.mealInput}
              value={meal.text}
              onChangeText={(t) => updateMeal(meal.id, { text: t })}
              placeholder="What did you eat?"
              placeholderTextColor={Colors.line}
              returnKeyType="done"
            />
            <Pressable onPress={() => deleteMeal(meal.id)} hitSlop={8}>
              <Text style={styles.deleteBtn}>×</Text>
            </Pressable>
          </View>

          {/* Nutrition tags */}
          <View style={styles.tags}>
            {TAGS.map(({ key, label, color }) => {
              const active = meal[key] as boolean;
              return (
                <Pressable
                  key={key}
                  onPress={() =>
                    updateMeal(meal.id, { [key]: !active } as Partial<Meal>)
                  }
                  style={[
                    styles.tag,
                    active && { backgroundColor: color, borderColor: color },
                  ]}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable onPress={addMeal} style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Add a meal</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  mealRow: {
    paddingBottom: Spacing.sm,
  },
  mealDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: Spacing.sm,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mealInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 0,
  },
  deleteBtn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 22,
    color: Colors.inkSoft,
    lineHeight: 26,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  tagText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.inkSoft,
    letterSpacing: 0.2,
  },
  tagTextActive: {
    color: '#fff',
  },
  addBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
  },
  addBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.inkSoft,
  },
});
