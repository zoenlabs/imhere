# 02 — Modelo Comercial

## Estrutura

Três camadas: **plano gratuito permanente (Essencial)** + **trial Premium de 7 dias** + **assinatura Premium (mensal ou anual)**.

Quando o trial termina, o usuário volta ao plano gratuito — não perde o app.

## Plano gratuito — "Essencial"

- 1 prática de respiração por dia (jornada básica "Pausa e Presença", conteúdo interno pode alternar)
- 1 afirmação (motivacional ou bíblica) por dia
- 1 versículo diário
- Check-in emocional diário
- Medidor de alegria do dia
- Pontos e sequência de dias (sem limitação de pontos — gamificação não é travada)
- Histórico dos últimos 7 dias
- 1 horário de lembrete configurável

## Trial Premium — 7 dias

Acesso completo. **Começa depois que o usuário conclui sua primeira prática** — primeiro sente valor, depois encontra o paywall.

## Premium

Inclui: todas as práticas respiratórias e categorias; afirmações ilimitadas; meditações bíblicas; orações guiadas; todos os áudios e sons ambientes; múltiplos lembretes; diário de oração; histórico completo; conteúdos offline; rotinas personalizadas; conteúdos especiais semanais.

### Preços (hipótese inicial — validar com testes de conversão)

| Plano | Valor |
|---|---|
| Mensal | R$ 19,90 |
| Anual | R$ 149,90 (≈ R$ 12,50/mês — "economize 37%") |
| Trial | 7 dias |

## Cobrança

**Somente pelas lojas.** Sem Pagar.me, sem site, sem checkout externo.

- iOS: Apple StoreKit (In-App Purchase)
- Android: Google Play Billing
- **Gestão de assinaturas: RevenueCat** (decisão revisada em 04/08/2026 — ver 06-analise-decisoes.md). O RevenueCat cuida de validação de recibos, webhooks de renovação/cancelamento/reembolso, grace period e restauração de compra nas duas lojas. Gratuito até US$ 2.500/mês de receita. Nosso backend consome os webhooks do RevenueCat e mantém a entidade única: "usuário possui Premium ativo?", independente da loja de origem.

## Comissão das lojas

Com receita abaixo de US$ 1 milhão/ano, Apple e Google cobram **15%** (não 30%). O Small Business Program da Apple **exige inscrição** — fazer isso ao criar a conta de desenvolvedor. No Google, os primeiros US$ 1 mi/ano já são a 15%.

## Custos fixos conhecidos

- Google Play: US$ 25 (taxa única de cadastro)
- Apple Developer Program: US$ 99/ano
- Comissão das lojas: 15% (abaixo de US$ 1 mi/ano)
- RevenueCat: gratuito até US$ 2.500/mês de receita
- VPS própria (infraestrutura)
