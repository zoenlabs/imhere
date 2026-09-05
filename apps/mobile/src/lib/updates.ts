import { usePathname } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

// Telas em que uma janela de atualização atrapalharia: espera sair delas
const BUSY = ['/respirar', '/pratica-agora', '/onboarding', '/permissoes'];

/**
 * "Atualizar agora": o app já baixa a atualização em segundo plano na
 * abertura (configuração nativa). Este hook avisa assim que o download
 * termina e oferece recarregar na hora, em vez de esperar a próxima
 * abertura. Também verifica ao voltar ao primeiro plano.
 */
export function useUpdatePrompt() {
  const { isUpdatePending } = Updates.useUpdates();
  const pathname = usePathname();
  const asked = useRef(false);

  // O nativo só checa na abertura; ao voltar ao app, checa de novo
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const check = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // sem rede ou servidor indisponível: tenta na próxima vez
      }
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isUpdatePending || asked.current) return;
    if (BUSY.some((p) => pathname.startsWith(p))) return;
    asked.current = true;
    Alert.alert(
      'Nova versão pronta',
      "Uma atualização do I'm Here já foi baixada. Atualizar leva só alguns segundos.",
      [
        { text: 'Depois', style: 'cancel' },
        { text: 'Atualizar agora', onPress: () => Updates.reloadAsync().catch(() => {}) },
      ]
    );
  }, [isUpdatePending, pathname]);
}
