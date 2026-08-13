import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { practiceGlyphs } from '@/data/glyphs';
import { practices, totalSeconds } from '@/data/practices';
import { ALWAYS_OPEN_PRACTICE, useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

// Ordem de exibição na grade (a ordem do arquivo de dados segue como está,
// porque a primeira prática da lista é a que fica liberada no plano gratuito).
const order = ['afirmacao', 'pausa-presenca', 'calma', 'oracao', 'palavra', 'ansiedade'];
const ordered = order
  .map((id) => practices.find((p) => p.id === id))
  .filter((p): p is (typeof practices)[number] => Boolean(p));

// 6 práticas em 2 colunas x 3 linhas, ocupando a tela inteira sem rolagem.
const rows = [ordered.slice(0, 2), ordered.slice(2, 4), ordered.slice(4, 6)];

export default function Pausa() {
  const router = useRouter();
  const s = useAppStore();
  const premium = s.hasPremiumAccess();
  // Saldo cheio: só a prática de socorro segue aberta
  const dayFull = s.pointsToday >= 100;

  const open = (id: string, locked: boolean, restedOut: boolean) => {
    if (restedOut) {
      Alert.alert(
        'Jornada de hoje concluída',
        'Seu Saldo de Alegria chegou a 100. Descanse — as práticas voltam amanhã. O Momento de Ansiedade continua disponível sempre que você precisar.'
      );
      return;
    }
    router.push(locked ? '/paywall' : `/respirar/${id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Respiração</Text>
        <Text style={styles.sub}>Escolha a respiração do momento.</Text>

        <View style={styles.grid}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((p) => {
                const always = p.id === ALWAYS_OPEN_PRACTICE;
                const locked = p.premium && !premium && !always;
                const restedOut = dayFull && !always;
                const min = Math.round(totalSeconds(p) / 60) || 1;
                return (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [
                      styles.tile,
                      always && styles.tileAnsiedade,
                      (locked || restedOut) && styles.tileLocked,
                      pressed && styles.tilePressed,
                    ]}
                    onPress={() => open(p.id, locked, restedOut)}
                  >
                    {restedOut ? (
                      <Feather name="check" size={13} color={colors.olive} style={styles.lock} />
                    ) : locked ? (
                      <Feather name="lock" size={13} color={colors.textMuted} style={styles.lock} />
                    ) : null}
                    <MaterialCommunityIcons
                      name={practiceGlyphs[p.id] ?? 'circle-outline'}
                      size={27}
                      color={colors.gold}
                    />
                    <Text style={styles.tileTitle} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <Text style={styles.tileMeta}>
                      ~{min} min{p.points > 0 ? ` · +${p.points} pts` : ' · sem pontos'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
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
  grid: { flex: 1, marginTop: spacing.md, gap: spacing.md },
  row: { flex: 1, flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  // Idêntico aos demais, só o fundo muda: vermelho bem claro.
  // Cor sólida de propósito — no Android, fundo translúcido faz a sombra
  // vazar por trás do card e criar aquela moldura dupla.
  tileAnsiedade: { backgroundColor: '#FBE7E2' },
  tileLocked: { opacity: 0.75 },
  tilePressed: { transform: [{ scale: 0.97 }], elevation: 2, shadowOpacity: 0.07 },
  lock: { position: 'absolute', top: 10, right: 12 },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 19,
  },
  tileMeta: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
