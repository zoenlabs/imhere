# 06 — Análise Crítica das Decisões

Data: 04/08/2026. Objetivo: revisar cada decisão registrada e avaliar se é a melhor para o projeto, considerando que o Edson é arquiteto de produto (não programador), desenvolvendo com Claude Code, sozinho, com VPS própria.

## Resumo do veredito

| Decisão | Veredito |
|---|---|
| React Native + Expo | Mantida — correta |
| Claude Code como dev | Mantida — correta |
| Login Google + Apple + visitante | Mantida — correta |
| Só app, sem site | Mantida — correta para o MVP |
| Gratuito + trial 7d + mensal/anual | Mantida — modelo padrão do mercado |
| Trial após 1ª prática | Mantida — melhor prática de conversão |
| expo-iap direto (sem RevenueCat) | **Reavaliar** — risco alto para perfil não-dev |
| NestJS + VPS própria | **Reavaliar parcialmente** — manter, mas simplificar |
| MinIO no MVP | **Simplificar** — provável excesso |
| Monorepo Turborepo | **Simplificar** — manter estrutura, adiar tooling |
| Painel completo no MVP | **Cortar** — reduzir a gestão de conteúdo |
| Preços R$ 19,90 / R$ 149,90 | Mantida como hipótese — validar |

## O que está certo e não deve mudar

**Expo + React Native.** Continua a escolha certa: um código para as duas lojas, ecossistema maduro, ótima afinidade com Claude Code (TypeScript). A experiência do círculo respiratório é viável com Reanimated + SVG.

**Modelo comercial.** Gratuito permanente + trial de 7 dias iniciado após a primeira prática concluída é exatamente o padrão dos apps líderes da categoria (Calm, Abide, I am). Nada a mudar.

**Cobrança só pelas lojas.** Sem site, é a única opção possível — Apple e Google exigem o billing próprio para conteúdo digital. Decisão forçada e correta. Bônus importante: com receita abaixo de US$ 1 milhão/ano, tanto Apple (Small Business Program) quanto Google cobram **15%, não 30%**. É preciso se inscrever no programa da Apple (não é automático). Isso melhora a margem do plano anual.

**Posicionamento e princípios de produto.** Separação dos três tipos de conteúdo, revisão teológica, sem culpa de streak, disclaimer de ansiedade — são o diferencial real do produto. Intocáveis.

## Decisão nº 1 a reavaliar: expo-iap vs RevenueCat

A escolha anterior (expo-iap direto) priorizou controle e independência. Mas para este perfil de projeto ela é a decisão de maior risco do desenho, porque assinatura é a parte onde erro custa dinheiro e reputação.

Com expo-iap puro, o nosso backend precisa implementar: validação de recibo da Apple (App Store Server API) e do Google (Play Developer API), webhooks de renovação/cancelamento/reembolso das duas lojas, tratamento de grace period, upgrade/downgrade, restauração de compra e reconciliação. São semanas de trabalho invisível e o tipo de código onde bug aparece só em produção, no cartão do cliente.

RevenueCat faz tudo isso pronto, tem SDK oficial para Expo e é **gratuito até US$ 2.500/mês de receita** — ou seja, custo zero até o app já estar faturando. A dependência externa é real, mas migrar depois é possível e o risco de errar sozinho a infraestrutura de billing é maior que o risco da dependência.

**Recomendação: trocar para RevenueCat no MVP.** Revisitar expo-iap apenas se um dia o custo do RevenueCat incomodar. Um app validado com billing terceirizado vale mais que um billing próprio num app que atrasou três meses.

## Decisão nº 2 a reavaliar: peso do backend

NestJS + PostgreSQL + Prisma na VPS continua defensável — você já tem a VPS, quer soberania dos dados e o Claude Code trabalha bem com esse stack. Mas o desenho registrado carrega peso demais para o dia 1:

**Redis + BullMQ:** no MVP não há fila real para processar. Lembretes de rotina são notificações locais (agendadas no telefone, não no servidor). Push de campanha pode ser disparado manualmente pelo painel. Adiar Redis/BullMQ até existir necessidade concreta.

**MinIO:** para servir 5 áudios ambientes e algumas imagens, um bucket S3-compatível gerenciado (Cloudflare R2, gratuito até 10 GB) ou até arquivos estáticos atrás do Traefik resolve com muito menos manutenção. MinIO é mais um serviço para operar, atualizar e fazer backup. Adiar.

**Três ambientes (dev/homolog/prod):** para um produto solo pré-lançamento, dev + prod basta. Homologação entra quando houver beta com usuários reais.

**O ponto crítico que faltava no desenho:** rotina de backup automatizado e testado do PostgreSQL desde a primeira semana, e monitoramento básico (uptime + alerta). Banco próprio sem backup testado é o maior risco operacional do projeto inteiro — maior que qualquer escolha de framework.

**Alternativa considerada e descartada:** Supabase/Firebase gerenciado. Reduziria operação, mas você já declarou preferência por infraestrutura própria, já tem VPS e o custo de operação com o desenho simplificado acima é aceitável. Mantém-se a VPS.

## Decisão nº 3 a reavaliar: escopo do painel

O painel desenhado (conteúdos + respiração + usuários + financeiro + produto) é um produto inteiro à parte. Para lançar, o necessário é somente **gestão de conteúdos e padrões de respiração**. Financeiro vem pronto do App Store Connect, Play Console e (se adotado) RevenueCat. Métricas de produto podem começar com uma ferramenta pronta de analytics. Cortar o painel ao mínimo pode adiantar o lançamento em semanas.

## Decisão nº 4 a simplificar: monorepo

A estrutura de pastas do monorepo está boa e deve ser mantida. Mas pnpm + Turborepo + packages de contracts/validation/eslint-config/typescript-config no dia 1 é cerimônia de time grande. Começar com o monorepo simples (pnpm workspaces, um package `shared` único) e adicionar Turborepo quando o build ficar lento. Menos engrenagem para o Claude Code — e para você — administrar.

## Sobre os preços

R$ 19,90/mês e R$ 149,90/ano estão na faixa dos concorrentes no Brasil e são hipótese razoável. Dois cuidados: com 15% de comissão, o anual rende ~R$ 127 líquidos — saudável; e vale configurar os preços nas lojas com flexibilidade para testar (as duas lojas permitem experimentos de preço). Decisão final só com dados de conversão do beta.

## Riscos que o desenho ainda não cobria

**Conteúdo é o caminho crítico, não o código.** 50 + 50 afirmações, 30 versículos revisados teologicamente, áudios de voz guiada bem produzidos — isso não sai do Claude Code sozinho e precisa de revisão humana (idealmente alguém com formação teológica). Começar a produção do conteúdo em paralelo ao desenvolvimento, não depois.

**Revisão da Apple.** Apps religiosos passam normalmente, mas o disclaimer de ansiedade precisa estar visível para não cair na regra de claims de saúde. Já está previsto no desenho — manter.

**Tradução bíblica:** pendência já registrada, mas é bloqueante para o conteúdo. Resolver cedo (em português, traduções em domínio público incluem a Almeida Revista e Corrigida de edições antigas; confirmar caso a caso).

## Desenho revisado do MVP (após esta análise)

App Expo + RevenueCat para assinaturas + backend NestJS/PostgreSQL enxuto na VPS (sem Redis, sem MinIO, dev+prod, backup automatizado desde o início) + painel mínimo de gestão de conteúdo + monorepo simples. Todo o resto do desenho original permanece.
