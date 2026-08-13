# I'm Here — Monorepo

App de rotina espiritual e emocional: respiração guiada, Palavra, oração e gamificação de presença.
Documentação de produto: pasta `docs/`.

## Estrutura

```
im-here/
  apps/
    mobile/   # App Expo (React Native + TypeScript) — pronto
    api/      # Backend NestJS — próxima fase
    admin/    # Painel de gestão Next.js — próxima fase
  docs/       # Desenho do produto e decisões
```

## Como rodar o app no seu celular (Windows)

Pré-requisito: Node.js LTS instalado (https://nodejs.org).

1. Abra o terminal (PowerShell) na pasta `apps\mobile`
2. Rode: `npm install --legacy-peer-deps`
3. Rode: `npx expo start`
4. Instale o app **Expo Go** no seu celular (App Store / Play Store)
5. Escaneie o QR Code que aparece no terminal (celular e PC na mesma rede Wi-Fi)

O app abre no Expo Go com: splash, onboarding, home com Saldo de Alegria,
5 práticas de respiração com temporizador circular, afirmações (3 tipos),
perfil com histórico, trial de 7 dias e paywall.

## Estado atual (MVP em construção)

Pronto: app completo navegável com dados locais e gamificação funcionando.
Próximas fases: backend NestJS + PostgreSQL (VPS), painel de gestão,
login Google/Apple, notificações de rotina, assinatura via RevenueCat,
áudios de respiração, fontes Cormorant Garamond/Inter e ícone/splash definitivos.
