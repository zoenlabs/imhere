import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';
import { Goal, useAppStore } from '@/store/useAppStore';

const goals: { key: Goal; label: string; desc: string }[] = [
  { key: 'conexao', label: 'Conexão com Deus', desc: 'Pausas para reconhecer a presença de Deus' },
  { key: 'calma', label: 'Calma', desc: 'Desacelerar o corpo e a mente' },
  { key: 'ansiedade', label: 'Momentos de ansiedade', desc: 'Apoio para os momentos difíceis' },
  { key: 'oracao', label: 'Oração', desc: 'Preparar o coração para orar' },
  { key: 'palavra', label: 'Meditação na Palavra', desc: 'Respirar com um versículo' },
];

export default function Onboarding() {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);

  const finish = () => {
    setProfile(name.trim() || 'amigo', goal ?? 'conexao');
    // As permissões do alarme são pedidas automaticamente ao entrar nas abas
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step === 0 && (
          <View style={styles.step}>
            <Text style={styles.title}>Uma pausa para respirar, ouvir e permanecer.</Text>
            <Text style={styles.body}>
              O I'm Here ajuda você a interromper o ruído do dia, respirar, meditar na Palavra e
              retornar à presença de Deus — alguns minutos de cada vez.
            </Text>
            <Pressable style={styles.button} onPress={() => setStep(1)}>
              <Text style={styles.buttonText}>Começar</Text>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.title}>Como podemos te chamar?</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Pressable style={styles.button} onPress={() => setStep(2)}>
              <Text style={styles.buttonText}>Continuar</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.title}>O que você mais busca hoje?</Text>
            <View style={{ gap: spacing.sm }}>
              {goals.map((g) => (
                <Pressable
                  key={g.key}
                  style={[styles.option, goal === g.key && styles.optionActive]}
                  onPress={() => setGoal(g.key)}
                >
                  <Text style={styles.optionLabel}>{g.label}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.button, !goal && styles.buttonDisabled]}
              disabled={!goal}
              onPress={finish}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  step: { gap: spacing.lg },
  title: { fontSize: 26, fontWeight: '600', color: colors.text, lineHeight: 34 },
  body: { fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  input: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
  },
  option: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: { borderColor: colors.gold },
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  optionDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  button: {
    backgroundColor: colors.coffee,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.bgSoft, fontSize: 16, fontWeight: '600' },
});
