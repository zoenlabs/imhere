import { Linking } from 'react-native';

/**
 * Páginas legais exigidas pelas lojas.
 *
 * Os arquivos ficam na pasta `site/` na raiz do repositório e são publicados
 * no GitHub Pages automaticamente a cada push na main
 * (.github/workflows/pages.yml).
 */
const BASE = 'https://zoenlabs.github.io/imhere';

export const LEGAL = {
  privacidade: `${BASE}/privacidade.html`,
  termos: `${BASE}/termos.html`,
};

export const openPrivacy = () => Linking.openURL(LEGAL.privacidade).catch(() => {});
export const openTerms = () => Linking.openURL(LEGAL.termos).catch(() => {});
