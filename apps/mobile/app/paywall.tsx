import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openPrivacy, openTerms } from '@/lib/legal';
import { buy, loadOffers, PlanOffer, redeemCode, restore } from '@/lib/purchases';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type PlanId = 'mensal' | 'anual';

// Identificadores que serão os mesmos cadastrados no RevenueCat
const plans = [
  {
    id: 'mensal' as PlanId,
    name: 'Mensal',
    price: 'R$ 19,90',
    note: 'por mês',
    tag: null as string | null,
  },
  {
    id: 'anual' as PlanId,
    name: 'Anual',
    price: 'R$ 149,90',
    note: '≈ R$ 12,49/mês',
    tag: '37% OFF',
  },
];

// No MVP final, esta tela integra com RevenueCat (react-native-purchases).
// Aqui a estrutura está pronta; a compra real entra na fase de assinaturas.
const perks = [
  'Todas as práticas de respiração',
  'Afirmações e versículos ilimitados',
  'Alarmes e agendamentos sem limite',
  'Histórico completo',
];

export default function Paywall() {
  const router = useRouter();
  const s = useAppStore();
  const [selected, setSelected] = useState<PlanId>('anual');
  const [offers, setOffers] = useState<PlanOffer[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Preço real das lojas quando houver oferta publicada; senão, o preço da tela
  useEffect(() => {
    loadOffers().then(setOffers).catch(() => setOffers(null));
  }, []);

  const priceOf = (id: PlanId) =>
    offers?.find((o) => o.id === id)?.priceLabel ?? plans.find((p) => p.id === id)!.price;

  const plan = plans.find((p) => p.id === selected)!;
  const offer = offers?.find((o) => o.id === selected) ?? null;

  const checkout = async () => {
    if (!offer) {
      Alert.alert(
        'Assinatura ainda não publicada',
        `Plano escolhido: ${plan.name} — ${priceOf(selected)}.\n\nA cobrança acontece na folha de pagamento da ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'}. Falta cadastrar os produtos na loja e conectar o RevenueCat.`
      );
      return;
    }

    setBusy(true);
    const result = await buy(offer.packageRef);
    setBusy(false);

    if (result === 'ok') {
      Alert.alert('Bem-vindo ao Premium', 'Todas as práticas estão liberadas.');
      router.back();
    } else if (result === 'erro') {
      Alert.alert('Não foi possível concluir', 'Tente novamente em instantes.');
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    Alert.alert(
      ok ? 'Assinatura restaurada' : 'Nada para restaurar',
      ok
        ? 'Seu Premium está ativo neste aparelho.'
        : 'Não encontramos uma assinatura ativa nesta conta da loja.'
    );
  };

  const onCoupon = async () => {
    const where = await redeemCode();
    if (where === 'play') {
      Alert.alert(
        'Resgate na Google Play',
        'Abrimos a página de resgate da Play Store. Você também pode inserir o código na hora da compra: na folha de pagamento, toque na setinha ao lado da forma de pagamento e escolha "Resgatar código".'
      );
    } else if (where === 'indisponivel') {
      Alert.alert(
        'Cupom',
        'O resgate de cupom abre uma tela da própria loja e só funciona no aplicativo instalado.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable style={styles.back} hitSlop={12} onPress={() => router.back()}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.logo}>I'm Here Premium</Text>
        <Text style={styles.sub}>
          {s.premium
            ? 'Sua assinatura está ativa. Obrigado por caminhar com a gente.'
            : 'Presença completa para a sua rotina com Deus. 7 dias grátis.'}
        </Text>

        <View style={styles.card}>
          {perks.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Text style={styles.perkIcon}>✦</Text>
              <Text style={styles.perk}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {plans.map((item) => {
            const active = item.id === selected;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.plan,
                  active && styles.planActive,
                  pressed && styles.planPressed,
                ]}
                onPress={() => {
                  setSelected(item.id);
                  Haptics.selectionAsync();
                }}
              >
                {item.tag && (
                  <View style={styles.planTag}>
                    <Text style={styles.planTagText}>{item.tag}</Text>
                  </View>
                )}

                <View style={[styles.planCheck, active && styles.planCheckOn]}>
                  {active && <Feather name="check" size={12} color={colors.coffee} />}
                </View>

                <Text style={styles.planName}>{item.name}</Text>
                <Text style={styles.planPrice}>{priceOf(item.id)}</Text>
                <Text style={styles.planNote}>{item.note}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            busy && styles.buttonBusy,
          ]}
          onPress={checkout}
        >
          <Text style={styles.buttonText}>
            {busy ? 'Aguarde...' : s.premium ? 'Assinatura ativa' : 'Começar 7 dias grátis'}
          </Text>
          <Text style={styles.buttonSub}>
            {plan.name} · {priceOf(selected)}
            {plan.id === 'anual' ? '/ano' : '/mês'}
          </Text>
        </Pressable>

        <View style={styles.links}>
          <Pressable onPress={onCoupon} disabled={busy}>
            <Text style={styles.link}>Tenho um cupom</Text>
          </Pressable>
          <Text style={styles.linkDivider}>·</Text>
          <Pressable onPress={onRestore} disabled={busy}>
            <Text style={styles.link}>Restaurar compras</Text>
          </Pressable>
        </View>

        {/* Exigido pelas lojas na tela de assinatura: renovação automática,
            cancelamento e links para Termos e Privacidade. */}
        <Text style={styles.legal}>
          O teste grátis de 7 dias começa ao assinar. Ao final, a cobrança do plano escolhido é
          feita automaticamente pela {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} e se renova
          a cada período, a menos que você cancele nas configurações da loja com pelo menos 24 horas
          de antecedência.
        </Text>

        <View style={styles.links}>
          <Pressable onPress={openTerms}>
            <Text style={styles.legalLink}>Termos de uso</Text>
          </Pressable>
          <Text style={styles.linkDivider}>·</Text>
          <Pressable onPress={openPrivacy}>
            <Text style={styles.legalLink}>Política de privacidade</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  // Tela única, sem rolagem
  container: { flex: 1, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.md },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  logo: { fontSize: 27, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  perkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  perkIcon: { color: colors.gold, fontSize: 13 },
  perk: { fontSize: 14, color: colors.text },
  // Os dois cards têm a mesma estrutura interna, então nome, preço e nota
  // ficam na mesma linha nos dois. A tag flutua sobre a borda do anual.
  plans: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch', marginTop: spacing.xs },
  plan: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planActive: { borderColor: colors.gold, backgroundColor: '#FDF3DC' },
  planPressed: { transform: [{ scale: 0.98 }] },
  planCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  planCheckOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  planTag: {
    position: 'absolute',
    top: -11,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  planTagText: { fontSize: 10, fontWeight: '800', color: colors.coffee, letterSpacing: 1 },
  planName: { fontSize: 16, fontWeight: '700', color: colors.text },
  planPrice: { fontSize: 22, color: colors.text, fontWeight: '800' },
  planNote: { fontSize: 12, color: colors.textMuted },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    gap: 2,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  buttonPressed: { transform: [{ scale: 0.98 }], elevation: 4, shadowOpacity: 0.15 },
  buttonBusy: { opacity: 0.6 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  link: { color: colors.olive, fontSize: 13, fontWeight: '700' },
  linkDivider: { color: colors.sage, fontSize: 13 },
  buttonText: { color: colors.coffee, fontSize: 17, fontWeight: '800' },
  buttonSub: { color: colors.coffee, fontSize: 12, opacity: 0.8, fontWeight: '600' },
  legal: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  legalLink: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'underline' },
});
