import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * Seletor de horário no aparelho: abre o relógio nativo do sistema.
 * A versão web fica em TimeField.web.tsx.
 */
export function TimeField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const label = value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && selected) onChange(selected);
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => {
          setOpen(true);
          Haptics.selectionAsync();
        }}
      >
        <Text style={styles.time}>{label}</Text>
        <View style={styles.hint}>
          <Feather name="clock" size={16} color={colors.olive} />
          <Text style={styles.hintText}>tocar para escolher</Text>
        </View>
      </Pressable>

      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={handle}
            textColor={colors.text}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.done} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Pronto</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPressed: { opacity: 0.75 },
  time: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: 1 },
  hint: { alignItems: 'flex-end', gap: 3 },
  hintText: { fontSize: 11, color: colors.textMuted },
  pickerWrap: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  done: { alignSelf: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  doneText: { color: colors.olive, fontWeight: '700', fontSize: 15 },
});
