import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimeField } from '@/components/TimeField';
import { alarmsAvailable } from '@/lib/alarms';
import { practiceGlyphs, practiceShort } from '@/data/glyphs';
import { practices } from '@/data/practices';
import { ALL_DAYS, dayLabels, daysSummary, FREE, useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

const atTime = (hour: number, minute: number) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

export default function Agendamento() {
  const router = useRouter();
  const s = useAppStore();
  const premium = s.premium;

  // Plano Essencial: só a Afirmação, e um único agendamento
  const limitReached = !premium && s.schedules.length >= FREE.maxSchedules;

  const [practiceId, setPracticeId] = useState(premium ? practices[0].id : FREE.practiceId);
  const [time, setTime] = useState(() => atTime(7, 0));
  const [days, setDays] = useState<number[]>(ALL_DAYS);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
    Haptics.selectionAsync();
  };

  const add = () => {
    if (limitReached) {
      router.push('/paywall');
      return;
    }
    s.addSchedule(practiceId, time.getHours(), time.getMinutes(), days);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agendamento</Text>
        <Text style={styles.sub}>Escolha o que praticar e em que horário.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Prática</Text>
          <View style={styles.chips}>
            {practices.map((p) => {
              const active = p.id === practiceId;
              const locked = !premium && p.id !== FREE.practiceId;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.chip, active && styles.chipActive, locked && styles.chipLocked]}
                  onPress={() => {
                    if (locked) {
                      router.push('/paywall');
                      return;
                    }
                    setPracticeId(p.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <MaterialCommunityIcons
                    name={locked ? 'lock-outline' : practiceGlyphs[p.id] ?? 'circle-outline'}
                    size={16}
                    color={active ? colors.coffee : locked ? colors.textMuted : colors.gold}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {practiceShort[p.id] ?? p.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Horário</Text>
          <TimeField value={time} onChange={setTime} />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Repetir</Text>
          <View style={styles.days}>
            {dayLabels.map((letter, index) => {
              const active = days.includes(index);
              return (
                <Pressable
                  key={index}
                  style={[styles.day, active && styles.dayActive]}
                  onPress={() => toggleDay(index)}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{letter}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.daysSummary}>{daysSummary(days)}</Text>

          <Pressable
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
            onPress={add}
          >
            <Text style={styles.addText}>
              {limitReached ? 'Mais agendamentos — Premium' : 'Agendar prática'}
            </Text>
          </Pressable>

          {!premium && (
            <Text style={styles.freeNote}>
              No plano Essencial você tem um agendamento da Afirmação, uma vez ao dia.
            </Text>
          )}
        </View>

        <Text style={styles.label}>Meus agendamentos</Text>

        {s.schedules.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={22} color={colors.sage} />
            <Text style={styles.emptyText}>
              Nenhuma prática agendada ainda. Escolha uma acima e defina o horário.
            </Text>
          </View>
        ) : (
          // Agrupado por prática: cada bloco reúne todos os horários daquela prática
          practices
            .map((p) => ({ p, items: s.schedules.filter((x) => x.practiceId === p.id) }))
            .filter((g) => g.items.length > 0)
            .map(({ p, items }) => (
              <View key={p.id} style={styles.group}>
                <View style={styles.groupHead}>
                  <MaterialCommunityIcons
                    name={practiceGlyphs[p.id] ?? 'circle-outline'}
                    size={18}
                    color={colors.gold}
                  />
                  <Text style={styles.groupTitle}>{p.title}</Text>
                  <Text style={styles.groupCount}>
                    {items.length} {items.length === 1 ? 'horário' : 'horários'}
                  </Text>
                </View>

                {items.map((item) => {
                  const done = s.doneToday.includes(item.id);
                  return (
                  <View key={item.id} style={[styles.row, !item.enabled && styles.rowOff]}>
                    <Text style={styles.rowTime}>
                      {pad(item.hour)}:{pad(item.minute)}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowSub}>
                        {item.enabled ? daysSummary(item.days ?? []) : 'Pausado'}
                      </Text>
                      {done && (
                        <View style={styles.doneTag}>
                          <Feather name="check" size={11} color={colors.olive} />
                          <Text style={styles.doneText}>feita hoje</Text>
                        </View>
                      )}
                    </View>

                    <Switch
                      value={item.enabled}
                      onValueChange={() => {
                        s.toggleSchedule(item.id);
                        Haptics.selectionAsync();
                      }}
                      trackColor={{ false: '#DCD3C4', true: colors.gold }}
                      thumbColor={colors.bgSoft}
                    />

                    <Pressable
                      hitSlop={8}
                      style={styles.remove}
                      onPress={() => s.removeSchedule(item.id)}
                    >
                      <Feather name="trash-2" size={17} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  );
                })}
              </View>
            ))
        )}

        <Text style={styles.note}>
          {alarmsAvailable
            ? 'No horário marcado o alarme toca e chama a prática. Um lembrete chega 5 minutos antes. Se não tocar, revise "Alarmes e permissões" no Perfil.'
            : 'Nesta versão os agendamentos ficam salvos, mas o alarme não toca. Instale o app pela loja para receber a chamada no horário.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 2 },

  form: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    color: colors.olive,
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  // Cada balão ocupa só a largura do próprio texto e quebra a linha quando enche
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.gold },
  chipLocked: { opacity: 0.55 },
  freeNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.coffee, fontWeight: '700' },


  days: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 42,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: { backgroundColor: colors.gold },
  dayText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  dayTextActive: { color: colors.coffee },
  daysSummary: { fontSize: 12, color: colors.textMuted },


  add: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  addPressed: { transform: [{ scale: 0.98 }], elevation: 3, shadowOpacity: 0.14 },
  addText: { color: colors.coffee, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  emptyText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  group: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  groupTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  groupCount: { fontSize: 11, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bg,
    paddingVertical: 6,
  },
  rowOff: { opacity: 0.55 },
  rowTime: { fontSize: 20, fontWeight: '800', color: colors.olive, minWidth: 60 },
  rowSub: { fontSize: 12, color: colors.textMuted },
  doneTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  doneText: { fontSize: 11, color: colors.olive, fontWeight: '700' },
  remove: { paddingLeft: 2 },

  note: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: spacing.xs },
});
