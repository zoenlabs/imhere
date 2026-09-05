import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initPurchases } from '@/lib/purchases';
import { usePracticeFlow } from '@/lib/usePracticeFlow';
import { colors } from '@/theme';

export default function RootLayout() {
  // Lembretes, toque na notificação e tela cheia do horário agendado
  usePracticeFlow();

  // Assinatura: o acesso Premium vem do entitlement do RevenueCat
  useEffect(() => {
    initPurchases().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="respirar/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="pratica-agora"
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
