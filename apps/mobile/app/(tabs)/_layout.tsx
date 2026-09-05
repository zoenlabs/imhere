import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ColorValue, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsAvailable, shouldPromptPermissions } from '@/lib/permissions';
import { colors } from '@/theme';

const GOLD_OFF = 'rgba(212, 167, 44, 0.45)';

type IconProps = { color: ColorValue };

const feather =
  (name: React.ComponentProps<typeof Feather>['name'], size = 23) =>
  ({ color }: IconProps) => <Feather name={name} size={size} color={color as string} />;

const material =
  (name: React.ComponentProps<typeof MaterialCommunityIcons>['name'], size = 24) =>
  ({ color }: IconProps) => (
    <MaterialCommunityIcons name={name} size={size} color={color as string} />
  );

// Botão central: círculo marrom com a coroa, sobreposto ao menu.
function PausaButton({ onPress }: { onPress?: (e: any) => void }) {
  return (
    <View style={styles.centerSlot}>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={({ pressed }) => [styles.centerButton, pressed && styles.centerButtonPressed]}
      >
        <Image
          source={require('../../assets/crown.png')}
          style={styles.centerCrown}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Barra de gestos / botões do Android: a barra sobe o quanto for preciso
  const bottom = Math.max(insets.bottom, 10);

  // Android: ao entrar no app, se falta alguma permissão do alarme, abre o
  // assistente. Não insiste se o usuário pediu "deixar para depois" hoje.
  useEffect(() => {
    if (!permissionsAvailable) return;
    const t = setTimeout(() => {
      shouldPromptPermissions()
        .then((missing) => missing && router.push('/permissoes'))
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: GOLD_OFF,
        tabBarStyle: {
          backgroundColor: colors.bgSoft,
          borderTopColor: colors.bg,
          height: 62 + bottom,
          paddingBottom: bottom,
          paddingTop: 8,
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: feather('home') }} />
      <Tabs.Screen
        name="praticar"
        options={{ title: 'Praticar', tabBarIcon: material('star-four-points-outline', 25) }}
      />

      <Tabs.Screen
        name="pausa"
        options={{
          title: '',
          tabBarButton: (props) => <PausaButton onPress={props.onPress} />,
        }}
      />

      <Tabs.Screen
        name="agendamento"
        options={{ title: 'Agenda', tabBarIcon: feather('clock', 27) }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: feather('user', 23) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coffee,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.bgSoft,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  centerButtonPressed: {
    transform: [{ scale: 0.94 }],
    elevation: 6,
    shadowOpacity: 0.2,
  },
  centerCrown: {
    width: 31,
    height: 25,
    tintColor: colors.gold,
  },
});
