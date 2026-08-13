# 05 — Arquitetura e Decisões Técnicas

> Revisado em 04/08/2026 após análise crítica (ver 06-analise-decisoes.md). Mudanças: RevenueCat no lugar de expo-iap; Redis/BullMQ e MinIO adiados; dev+prod (sem homologação no início); backup e monitoramento obrigatórios desde a semana 1; painel reduzido a gestão de conteúdo; monorepo simplificado.

## Decisões fechadas

| Item | Decisão |
|---|---|
| App mobile | React Native + Expo + TypeScript (Development Build + EAS Build) |
| Desenvolvimento | Claude Code |
| Backend | Node.js + NestJS + TypeScript |
| Banco | PostgreSQL próprio (na VPS do Edson) + **backup automatizado e testado desde a semana 1** |
| ORM | Prisma |
| Assinaturas | **RevenueCat** (SDK react-native-purchases) sobre StoreKit e Play Billing |
| Arquivos (áudios, imagens) | Bucket S3-compatível gerenciado (ex.: Cloudflare R2, gratuito até 10 GB) ou estáticos atrás do Traefik |
| Painel de gestão | Next.js + shadcn/ui — **somente gestão de conteúdos e padrões de respiração no MVP** |
| Login | Google e Apple (Sign in with Apple obrigatório no iOS) + modo visitante |
| Infra | Docker Compose + Traefik na VPS — **dev + prod** (homologação só quando houver beta) |
| Monitoramento | Uptime + alerta básico desde o início |
| Repositório | Monorepo pnpm workspaces simples, um package `shared` (Turborepo só se o build ficar lento) |

**Adiados (entram quando houver necessidade concreta):** Redis + BullMQ (não há fila real no MVP — lembretes são notificações locais no telefone), MinIO, ambiente de homologação, Turborepo, painéis financeiro e de métricas (financeiro vem do App Store Connect, Play Console e RevenueCat).

**Não usar:** Pagar.me (removido do escopo), site/landing page, Supabase, FlutterFlow, Lovable para o app principal, expo-iap direto (substituído por RevenueCat — revisitar só se o custo incomodar no futuro).

## Bibliotecas-chave do app

Expo Router, Reanimated + SVG (círculo respiratório; Skia se precisar de efeitos avançados), Expo Audio, Expo Haptics, Expo Notifications, react-native-purchases (RevenueCat), Secure Store, Zustand (estado local), TanStack Query (dados remotos).

## Autenticação

1. Usuário autentica com Google ou Apple → app recebe token do provedor
2. Backend valida o token, localiza ou cria o usuário
3. Backend emite access token próprio + refresh token
4. Sessão guardada em Secure Store

Google/Apple confirmam identidade; quem controla a sessão é o nosso backend.

## Assinaturas — regra de ouro

O backend **nunca** libera Premium só porque o app disse que houve compra. O RevenueCat valida a transação com Apple/Google; nosso backend consome os **webhooks do RevenueCat** e então gera o direito de acesso (entitlement).

### Modelo de dados da assinatura

```
subscriptions: id, user_id, provider (apple|google|admin),
  external_subscription_id, plan_code, status,
  trial_started_at, trial_ends_at,
  current_period_started_at, current_period_ends_at,
  canceled_at, created_at, updated_at

+ subscription_events, entitlements, webhook_events
```

## Notificações

- Rotinas configuradas pelo usuário → **notificações locais** (agendadas no dispositivo)
- Campanhas e novos conteúdos → **push notifications**
- Atenção às permissões de notificação do Android e aos limites de alarmes precisos

## Entidades principais do banco

usuários, objetivos, rotinas, horários, padrões de respiração, práticas, afirmações, versículos, categorias, sessões concluídas, pontuações diárias, sequências, dispositivos/notificações, conteúdos de áudio, assinaturas.

## Painel de gestão (MVP mínimo)

- **Conteúdos:** afirmações (motivacionais e bíblicas), versículos, meditações, orações, categorias, traduções bíblicas, agendamento de publicação
- **Respiração:** padrões (tempos de inspiração/retenção/expiração, ciclos, áudio, pontuação, categoria, dificuldade)
- Gestão simples de usuários (buscar, bloquear)

**Pós-MVP:** módulos financeiro e de métricas de produto (no início, financeiro vem do App Store Connect / Play Console / RevenueCat; métricas via ferramenta de analytics pronta).

## Estrutura do repositório

```
im-here/
  apps/
    mobile/      # Expo
    admin/       # Next.js
    api/         # NestJS
  packages/
    shared/      # tipos, enums e contratos compartilhados
  infrastructure/
    docker/ traefik/ postgres/ scripts/
```

App, backend e painel compartilham tipos, enums e contratos — menos retrabalho e menos campo inventado. Gerenciado com pnpm workspaces; Turborepo entra só se o build ficar lento. `worker/` entra quando Redis/BullMQ forem necessários.

## Ordem sugerida de desenvolvimento

1. Design das telas (Figma) a partir da identidade visual — **conteúdo (afirmações, versículos, áudios) começa em paralelo desde já**
2. Monorepo + infraestrutura base na VPS (incluindo backup do PostgreSQL e monitoramento)
3. Backend: auth, usuários, conteúdos, rotinas
4. App: onboarding + motor de respiração (experiência principal)
5. Gamificação e notificações locais
6. Painel de gestão de conteúdos
7. Assinaturas via RevenueCat e trial
8. Beta fechado → lojas
