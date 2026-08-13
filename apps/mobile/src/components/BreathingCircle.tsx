import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme';
import type { BreathPhase } from '@/data/practices';

const SIZE = 300;
const RING = 6;
// A bolha cheia encosta na parte de dentro do anel
const BALL = SIZE - RING * 2;
const R = (SIZE - RING) / 2;
const CIRC = 2 * Math.PI * R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const phaseLabel: Record<BreathPhase['kind'], string> = {
  inhale: 'INSPIRE',
  hold: 'SEGURE',
  exhale: 'EXPIRE',
};

interface Props {
  phase: BreathPhase;
  secondsLeft: number;
  progress: number; // 0..1 da sessão inteira (anel externo)
}

export function BreathingCircle({ phase, secondsLeft, progress }: Props) {
  const scale = useSharedValue(0.6);
  const ring = useSharedValue(0);

  useEffect(() => {
    // Cheio na inspiração, recolhido na expiração, parado nas retenções
    const target = phase.kind === 'inhale' ? 1 : phase.kind === 'exhale' ? 0.42 : scale.value;
    if (phase.kind !== 'hold') {
      scale.value = withTiming(target, {
        duration: phase.seconds * 1000,
        easing: Easing.inOut(Easing.quad),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    ring.value = withTiming(progress, { duration: 900, easing: Easing.linear });
  }, [progress, ring]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringProps = useAnimatedStyle(() => ({}));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.sage}
          strokeOpacity={0.35}
          strokeWidth={RING}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.gold}
          strokeWidth={RING}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={CIRC * (1 - progress)}
          rotation={-90}
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>

      <Animated.View style={[styles.ball, ballStyle, ringProps]} />

      {/* A frase da fase fica fora do círculo, logo abaixo dele */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.instruction}>{phaseLabel[phase.kind]}</Text>
        <Text style={styles.seconds}>{secondsLeft}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ball: {
    width: BALL,
    height: BALL,
    borderRadius: BALL / 2,
    backgroundColor: colors.olive,
    opacity: 0.28,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  instruction: {
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: '700',
    color: colors.coffee,
  },
  seconds: {
    fontSize: 44,
    fontWeight: '300',
    color: colors.text,
    marginVertical: 4,
  },
});
