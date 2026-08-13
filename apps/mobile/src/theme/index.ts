export const colors = {
  bg: '#F2E8D8', // bege areia — fundo principal
  bgSoft: '#FFF9EF', // marfim quente — fundo secundário
  gold: '#D4A72C', // amarelo dourado — destaques
  text: '#4B382F', // marrom profundo — textos
  olive: '#788247', // verde oliva — elementos naturais
  sage: '#A7AD7A', // verde sálvia — elementos suaves
  coffee: '#2E2925', // café escuro — contraste
  textMuted: '#8A7360',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
};

export const type = {
  // Serifada para títulos (espiritualidade e elegância), sans para interface.
  // No dispositivo usa as fontes do sistema; Cormorant Garamond entra via expo-font depois.
  title: { fontFamily: undefined as string | undefined, fontWeight: '600' as const },
};
