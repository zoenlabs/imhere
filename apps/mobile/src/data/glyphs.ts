import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type Glyph = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Ícone de cada prática — usado na grade de Respiração e no Agendamento.
// Nome curto para seletores compactos (chips do Agendamento)
export const practiceShort: Record<string, string> = {
  'pausa-presenca': 'Presença',
  calma: 'Calma',
  ansiedade: 'Ansiedade',
  oracao: 'Pré Oração',
  palavra: 'Meditação',
  afirmacao: 'Afirmação',
};

export const practiceGlyphs: Record<string, Glyph> = {
  'pausa-presenca': 'hands-pray',
  calma: 'spa-outline',
  ansiedade: 'heart-pulse',
  oracao: 'candle',
  palavra: 'book-open-outline',
  afirmacao: 'star-four-points-outline',
};
