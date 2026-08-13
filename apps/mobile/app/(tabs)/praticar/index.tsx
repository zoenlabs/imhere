import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type Glyph = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Tile = {
  key: string;
  glyph: Glyph;
  title: string;
  sub: string;
  path: string;
  premium: boolean;
};

// No plano Essencial só a Respiração fica aberta.
const tiles: Tile[] = [
  {
    key: 'respiracao',
    glyph: 'lungs',
    title: 'Respiração',
    sub: '6 práticas guiadas',
    path: '/pausa',
    premium: false,
  },
  {
    key: 'motivacao',
    glyph: 'star-four-points-outline',
    title: 'Motivação',
    sub: 'Frases para o seu dia',
    path: '/praticar/motivacional',
    premium: true,
  },
  {
    key: 'fe',
    glyph: 'hand-heart-outline',
    title: 'Declaração de Fé',
    sub: 'Declare em voz alta',
    path: '/praticar/fe',
    premium: true,
  },
  {
    key: 'palavra',
    glyph: 'book-open-outline',
    title: 'Palavra',
    sub: 'Versículos para meditar',
    path: '/praticar/palavra',
    premium: true,
  },
];

export default function Praticar() {
  const router = useRouter();
  const premium = useAppStore((s) => s.premium);
  // Saldo cheio: só Respiração segue aberta, para chegar ao Momento de Ansiedade
  const dayFull = useAppStore((s) => s.pointsToday) >= 100;

  // Os tipos de rota do expo-router são gerados quando o bundler roda;
  // este atalho evita depender desse arquivo estar atualizado.
  const go = (path: string) => router.push(path as never);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Praticar</Text>
        <Text style={styles.sub}>Escolha por onde começar hoje.</Text>

        <View style={styles.list}>
          {tiles.map((t) => {
            const locked = t.premium && !premium;
            const restedOut = dayFull && t.key !== 'respiracao';
            return (
              <Pressable
                key={t.key}
                style={({ pressed }) => [
                  styles.card,
                  (locked || restedOut) && styles.cardLocked,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  if (restedOut) {
                    Alert.alert(
                      'Jornada de hoje concluída',
                      'Seu Saldo de Alegria chegou a 100. Descanse — volte amanhã. O Momento de Ansiedade continua em Respiração, sempre que precisar.'
                    );
                    return;
                  }
                  go(locked ? '/paywall' : t.path);
                }}
              >
                {restedOut ? (
                  <Feather name="check" size={13} color={colors.olive} style={styles.lock} />
                ) : locked ? (
                  <Feather name="lock" size={13} color={colors.textMuted} style={styles.lock} />
                ) : null}
                <MaterialCommunityIcons name={t.glyph} size={28} color={colors.gold} />
                <Text style={styles.cardTitle}>{t.title}</Text>
                <Text style={styles.cardSub}>
                  {restedOut ? 'Concluído hoje' : locked ? 'Premium' : t.sub}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  // 4 cards em coluna única, centralizados no espaço restante da tela
  list: { flex: 1, justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  cardLocked: { opacity: 0.75 },
  cardPressed: { transform: [{ scale: 0.98 }], elevation: 2, shadowOpacity: 0.07 },
  lock: { position: 'absolute', top: 12, right: 14 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  cardSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
