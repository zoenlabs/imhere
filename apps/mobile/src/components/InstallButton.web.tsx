import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

const isIOS = () =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    // Safari usa uma propriedade própria
    (navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Botão de instalar do PWA.
 *
 * No Android o navegador entrega um evento que abre a caixa nativa de
 * instalação. No iPhone esse evento não existe: a Apple exige que o usuário
 * use o botão de compartilhar, então mostramos as instruções.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setShowHelp((v) => !v);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={install}>
        <Feather name="download" size={17} color={colors.coffee} />
        <Text style={styles.text}>Instalar o app</Text>
      </Pressable>

      {showHelp && (
        <Text style={styles.help}>
          {isIOS()
            ? 'No iPhone: toque no botão de compartilhar do Safari, na barra de baixo, e escolha "Adicionar à Tela de Início".'
            : 'Abra o menu do navegador e escolha "Instalar app" ou "Adicionar à tela inicial".'}
        </Text>
      )}
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
