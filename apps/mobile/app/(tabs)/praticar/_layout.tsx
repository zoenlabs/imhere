import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/theme';

// Pilha dentro da aba Praticar: as telas de frases abrem por cima da grade
// e o menu inferior continua visível. O voltar retorna para a grade.
export default function PraticarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
