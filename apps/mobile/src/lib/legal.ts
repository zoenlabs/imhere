import { Linking } from 'react-native';

/**
 * Páginas legais exigidas pelas lojas.
 *
 * Os arquivos ficam em `public/` e são publicados junto com a versão web
 * (`npx expo export --platform web` + `eas deploy`). O domínio abaixo é o
 * da hospedagem da Expo para o projeto `im-here`; se o primeiro deploy
 * receber outro nome, ajustar aqui e nas fichas das lojas.
 */
const BASE = 'https://im-here.expo.app';

export const LEGAL = {
  privacidade: `${BASE}/privacidade.html`,
  termos: `${BASE}/termos.html`,
};

export const openPrivacy = () => Linking.openURL(LEGAL.privacidade).catch(() => {});
export const openTerms = () => Linking.openURL(LEGAL.termos).catch(() => {});
