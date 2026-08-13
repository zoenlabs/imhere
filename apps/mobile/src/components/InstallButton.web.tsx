import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

declare global {
  interface Window {
    __imhereInstall: InstallEvent | null;
  }
}

const ua = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '');
const isIOS = () => /iphone|ipad|ipod/i.test(ua());
const isAndroid = () => /android/i.test(ua());
const isInApp = () => /FBAN|FBAV|Instagram|Line|WhatsApp/i.test(ua());

const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Botão de instalar do PWA.
 *
 * O evento de instalação é capturado no HTML, antes do app montar, porque o
 * Chrome só o dispara uma vez, logo no carregamento da página.
 */
export function InstallButton() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());
    setReady(Boolean(window.__imhereInstall));

    const onReady = () => setReady(true);
    const onInstalled = () => setInstalled(true);

    window.addEventListener('imhere-installable', onReady);
    window.addEventListener('imhere-installed', onInstalled);
    return () => {
      window.removeEventListener('imhere-installable', onReady);
      window.removeEventListener('imhere-installed', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    const event = window.__imhereInstall;
    if (event) {
      await event.prompt();
      const choice = await event.userChoice;
      window.__imhereInstall = null;
      setReady(false);
      if (choice.outcome === 'accepted') setInstalled(true);
      return;
    }
    setShowHelp((v) => !v);
  };

  const help = isInApp()
    ? 'Você abriu o link por dentro de outro aplicativo, e aí não dá para instalar. Toque no menu do canto e escolha "Abrir no navegador", depois tente de novo.'
    : isIOS()
      ? 'No iPhone a instalação é manual: toque no botão de compartilhar do Safari, na barra de baixo, role e escolha "Adicionar à Tela de Início".'
      : isAndroid()
        ? 'Toque nos três pontinhos do Chrome, no canto superior direito, e escolha "Adicionar à tela inicial" ou "Instalar app".'
        : 'No computador, clique no ícone de instalação na barra de endereço, ao lado da estrela de favoritos.';

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={install}
      >
        <Feather name="download" size={17} color={colors.coffee} />
        <Text style={styles.text}>{ready ? 'Instalar o app' : 'Como instalar'}</Text>
      </Pressable>

      {showHelp && <Text style={styles.help}>{help}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 15,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  text: { color: colors.coffee, fontSize: 15, fontWeight: '800' },
  help: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
