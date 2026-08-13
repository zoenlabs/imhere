# I'm Here — Estado atual (retomada em 10/08/2026)

Ponto de parada real: **08/08/2026, 20h24** (última alteração em disco: `apps/mobile/metro.config.js`).

## Onde paramos
App mobile v1 (MVP navegável) construído e sendo emulado localmente para revisão.
O último ajuste feito foi no Metro: o zustand v5 usa `import.meta` nos builds ESM,
que quebra o bundle **web** do Expo. A correção aplicada força os builds CommonJS
via `config.resolver.unstable_conditionNames = ['require', 'react-native', 'default']`.
Ou seja: paramos exatamente no momento de subir o `expo start` e revisar tela a tela.

## O que está pronto (código em `im-here/apps/mobile`)
- `app/index.tsx` — splash (João 14:6)
- `app/onboarding.tsx` — onboarding com nome do usuário
- `app/(tabs)/index.tsx` — home com Saldo de Alegria
- `app/(tabs)/praticar.tsx` — lista das 5 práticas
- `app/respirar/[id].tsx` — motor de respiração (temporizador circular + haptics)
- `app/(tabs)/afirmacoes.tsx` — 3 tipos de afirmação
- `app/(tabs)/perfil.tsx` — perfil e histórico
- `app/paywall.tsx` — trial 7 dias + paywall
- `src/components/BreathingCircle.tsx`, `src/components/JoyMeter.tsx`
- `src/store/useAppStore.ts` (Zustand + AsyncStorage), `src/data/practices.ts`, `src/data/content.ts`, `src/theme/index.ts`

Stack instalada: Expo ~54, React Native 0.81.5, React 19, expo-router 6, Reanimated 4,
react-native-svg, expo-haptics, Zustand 5, TypeScript 5.9.
Bundle IDs já definidos: `com.zoenlabs.imhere` (iOS e Android).

## O que NÃO existe ainda
`apps/api` (NestJS) e `apps/admin` (Next.js) não foram criados — só a pasta `apps/mobile`.
Também faltam: login Google/Apple, notificações, RevenueCat, áudios de respiração,
fontes Cormorant Garamond/Inter e ícone/splash definitivos. Tudo roda com dados locais.

## Como retomar a emulação (PowerShell, Windows)
```
cd "D:\Projetos\APP ImHere\im-here\apps\mobile"
npx expo start
```
Celular: app **Expo Go** + escanear o QR (PC e celular na mesma rede Wi-Fi).
Navegador: apertar `w` no terminal. Android emulador: `a`.
Se der erro de dependência: `npm install --legacy-peer-deps`.
Para limpar cache do bundler: `npx expo start -c`.

## Próximo passo combinado
Revisar o app tela a tela no emulador, listar ajustes de UX/visual, e só então decidir
entre (a) polir a v1 para beta interno ou (b) começar o backend NestJS.

## Pendências de produto (do registro mestre)
Logo/símbolo; escolher tradução bíblica (licença — bloqueante para conteúdo);
revisor teológico; validar preços R$ 19,90 / R$ 149,90.
