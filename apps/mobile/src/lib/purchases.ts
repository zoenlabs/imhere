import { Linking, Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

/**
 * Camada de assinatura (RevenueCat).
 *
 * Como o react-native-purchases é módulo nativo, ele não existe no Expo Go.
 * O require é protegido: sem o módulo, o app continua rodando com os preços
 * estáticos da tela e nada quebra.
 *
 * Regra de ouro do produto: quem libera o Premium é o entitlement vindo do
 * RevenueCat, nunca a palavra do app.
 */
// Tipagem mínima e estrutural: o app compila mesmo antes da biblioteca
// estar instalada, e continua compilando depois.
type CustomerInfo = { entitlements: { active: Record<string, unknown> } };

interface PurchasesApi {
  setLogLevel: (level: unknown) => void;
  configure: (opts: { apiKey: string }) => Promise<void>;
  getCustomerInfo: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<{
    current: {
      monthly?: { product: { priceString: string } } | null;
      annual?: { product: { priceString: string } } | null;
    } | null;
  }>;
  purchasePackage: (pkg: unknown) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
  presentCodeRedemptionSheet: () => void;
  addCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
}

type PurchasesModule = { default: PurchasesApi; LOG_LEVEL: Record<string, unknown> };

let mod: PurchasesModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('react-native-purchases') as PurchasesModule;
} catch {
  mod = null;
}

const Purchases: PurchasesApi | null = mod?.default ?? null;

export const purchasesAvailable = Boolean(Purchases);

/** Identificador do acesso liberado — precisa ser igual no painel do RevenueCat */
export const ENTITLEMENT = 'premium';

/** Identificadores dos produtos nas lojas */
export const PRODUCTS = {
  mensal: 'imhere_premium_mensal',
  anual: 'imhere_premium_anual',
};

/** Chaves públicas do RevenueCat — preencher no painel do projeto */
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};

let started = false;

export async function initPurchases() {
  if (!Purchases || !mod || started) return;
  const key = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
  if (!key) return; // ainda sem chave configurada

  started = true;
  Purchases.setLogLevel(mod.LOG_LEVEL.WARN);
  await Purchases.configure({ apiKey: key });
  await refreshEntitlement();

  Purchases.addCustomerInfoUpdateListener((info) => {
    applyCustomerInfo(info);
  });
}

function applyCustomerInfo(info: CustomerInfo) {
  const active = Boolean(info.entitlements.active[ENTITLEMENT]);
  useAppStore.getState().setPremium(active);
}

export async function refreshEntitlement() {
  if (!Purchases) return;
  try {
    const info = await Purchases.getCustomerInfo();
    applyCustomerInfo(info);
  } catch {
    // sem rede: mantém o último estado conhecido
  }
}

export type PlanOffer = {
  id: 'mensal' | 'anual';
  priceLabel: string;
  packageRef: unknown | null;
};

/** Busca os planos publicados nas lojas. Retorna null se ainda não houver oferta. */
export async function loadOffers(): Promise<PlanOffer[] | null> {
  if (!Purchases || !mod) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;

    const monthly = current.monthly ?? null;
    const annual = current.annual ?? null;
    if (!monthly && !annual) return null;

    const list: PlanOffer[] = [];
    if (monthly) {
      list.push({
        id: 'mensal',
        priceLabel: monthly.product.priceString,
        packageRef: monthly,
      });
    }
    if (annual) {
      list.push({
        id: 'anual',
        priceLabel: annual.product.priceString,
        packageRef: annual,
      });
    }
    return list;
  } catch {
    return null;
  }
}

export type PurchaseResult = 'ok' | 'cancelado' | 'indisponivel' | 'erro';

/** Abre a folha de pagamento nativa da loja. Não existe checkout próprio. */
export async function buy(packageRef: unknown): Promise<PurchaseResult> {
  if (!Purchases || !packageRef) return 'indisponivel';
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageRef as never);
    applyCustomerInfo(customerInfo);
    return 'ok';
  } catch (e) {
    const err = e as { userCancelled?: boolean };
    return err?.userCancelled ? 'cancelado' : 'erro';
  }
}

export async function restore(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return Boolean(info.entitlements.active[ENTITLEMENT]);
  } catch {
    return false;
  }
}

/**
 * Resgate de cupom.
 * iOS: a Apple abre uma folha nativa dentro do app.
 * Android: o resgate acontece na Play Store, ou na própria folha de compra,
 * na setinha ao lado da forma de pagamento.
 */
export async function redeemCode(): Promise<'sheet' | 'play' | 'indisponivel'> {
  if (Platform.OS === 'ios') {
    if (!Purchases) return 'indisponivel';
    Purchases.presentCodeRedemptionSheet();
    return 'sheet';
  }
  await Linking.openURL('https://play.google.com/redeem');
  return 'play';
}
