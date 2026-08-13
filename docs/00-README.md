# I'm Here — Documentação de Produto

**Projeto:** I'm Here (Estou aqui)
**Autor:** Edson Rochedo
**Data de registro:** 04/08/2026
**Status:** Desenho de produto — fase de definição (pré-desenvolvimento)

## O que é

Aplicativo mobile de rotina emocional e espiritual: pausas programadas ao longo do dia para respirar, meditar na Palavra, orar e receber afirmações — com gamificação de presença.

Inspiração de conceito: app "I am" (afirmações), mas com alvo diferente: fé cristã, respiração guiada com propósito espiritual e rotina diária gamificada.

## Índice dos documentos

| Arquivo | Conteúdo |
|---|---|
| 01-visao-produto.md | Conceito, posicionamento, público e proposta de valor |
| 02-modelo-comercial.md | Plano gratuito, trial, assinatura e regras das lojas |
| 03-identidade-visual.md | Nome, splash screen, paleta de cores e tipografia |
| 04-funcionalidades.md | Telas, afirmações, respiração, gamificação e MVP |
| 05-arquitetura.md | Stack, backend, infraestrutura e decisões técnicas |
| 06-analise-decisoes.md | Análise crítica das decisões e revisões aplicadas |

## Decisões fechadas (resumo — revisado em 04/08/2026)

App mobile apenas (Android e iOS). Sem site ou landing page. Painel web somente para gestão de conteúdo. Assinatura via App Store e Google Play gerenciada pelo RevenueCat (sem Pagar.me). Comissão das lojas: 15% abaixo de US$ 1 mi/ano (inscrever no Small Business Program da Apple). Plano gratuito limitado + trial Premium de 7 dias + assinatura mensal e anual. Desenvolvimento com Claude Code. App em React Native + Expo. Backend NestJS + PostgreSQL enxuto na VPS própria do Edson (backup e monitoramento desde a semana 1; Redis/BullMQ e MinIO adiados). Login social Google e Apple. Produção de conteúdo (afirmações, versículos, áudios) em paralelo ao desenvolvimento.
