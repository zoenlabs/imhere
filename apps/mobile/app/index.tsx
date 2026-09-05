import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { permissionsAvailable } from '@/lib/permissions';

// Splash em três tempos: a coroa, o nome, o versículo. Depois entra no app.
export default function Splash() {
  const router = useRouter();
  const rollDay = useAppStore((s) => s.rollDayIfNeeded);
  const hydrated = useAppStore((s) => s.hydrated);
  const finished = useRef(false);

  const crown = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const verse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    rollDay();

    const fade = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });

    Animated.sequence([
      // 1) a coroa sozinha
      fade(crown, 1, 400),
      Animated.delay(1000),
      fade(crown, 0, 400),
      Animated.delay(120),
      // 2) o nome
      fade(logo, 1, 500),
      Animated.delay(700),
      fade(logo, 0, 400),
      Animated.delay(120),
      // 3) o versículo
      fade(verse, 1, 500),
      Animated.delay(2600),
      fade(verse, 0, 400),
    ]).start(() => {
      if (cancelled) return;
      finished.current = true;
      leave();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Só sai do splash quando a animação terminou E os dados salvos já
   * carregaram. Ler `onboarded` cedo demais mandava todo mundo para o
   * onboarding de novo, dando a impressão de que nada era salvo.
   */
  const leave = () => {
    if (!finished.current || !useAppStore.getState().hydrated) return;
    const { onboarded, permissionsReviewed } = useAppStore.getState();
    if (!onboarded) router.replace('/onboarding');
    // Android: quem ainda não passou pela etapa de permissões do alarme vê ela primeiro
    else if (permissionsAvailable && !permissionsReviewed) router.replace('/permissoes');
    else router.replace('/(tabs)');
  };

  useEffect(() => {
    if (hydrated) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.layer, { opacity: crown }]}>
          <Image source={require('../assets/crown.png')} style={styles.crown} resizeMode="contain" />
        </Animated.View>

        <Animated.Text style={[styles.layer, styles.logo, { opacity: logo }]}>
          I'm Here
        </Animated.Text>

        <Animated.View style={[styles.layer, styles.verseBlock, { opacity: verse }]}>
          <Text style={styles.verse}>"Eu sou o caminho, a verdade e a vida."</Text>
          <Text style={styles.ref}>João 14:6</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Palco de altura fixa: os três momentos entram no mesmo ponto da tela
  stage: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: {
    width: 170,
    height: 130,
  },
  logo: {
    fontSize: 58,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  verseBlock: {
    alignItems: 'center',
  },
  verse: {
    fontSize: 17,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  ref: {
    marginTop: 8,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.olive,
  },
});
