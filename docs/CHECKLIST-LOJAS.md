# Checklist — O que falta para publicar o I'm Here nas lojas

Levantamento feito em 03/09/2026 a partir do código em `apps/mobile`, dos documentos
em `docs/` e do diagnóstico `npx expo-doctor`. Organizado por prioridade: primeiro o
que bloqueia a revisão das lojas, depois o que é cadastro e material.

---

## 1. Bloqueadores no código (corrigir antes de qualquer build de produção)

| # | Problema | Onde | Por que bloqueia |
|---|---|---|---|
| 1.1 | ~~Modo desenvolvedor acessível em produção.~~ **Resolvido em 04/09/2026:** o gesto dos 5 toques e o campo `devUnlocked` foram removidos. O painel de teste só existe em `__DEV__`. | `app/(tabs)/perfil.tsx`, `src/store/useAppStore.ts` | — |
| 1.2 | ~~Paywall sem links de Termos e Privacidade.~~ **Resolvido no app em 04/09/2026:** links adicionados no paywall, apontando para `https://zoenlabs.github.io/imhere/termos.html` e `/privacidade.html` (constantes em `src/lib/legal.ts`). As páginas estão em `site/` e são publicadas no GitHub Pages. Contato: `contato@zoenlabs.com.br` (definido em 04/09/2026). **Pendente:** revisar o texto e publicar com `npx expo export --platform web` + `eas deploy`. Se o domínio do deploy sair diferente, ajustar `legal.ts`. | `app/paywall.tsx`, `public/termos.html`, `public/privacidade.html` | As páginas precisam estar no ar antes de enviar para revisão. |
| 1.3 | ~~Chaves do RevenueCat ausentes.~~ **Android resolvido em 04/09/2026** (variável no EAS). iOS pendente até a conta Apple existir. | `src/lib/purchases.ts` | — |
| 1.4 | ~~Preços divergentes.~~ **Resolvido em 03/09/2026:** mensal R$ 19,90, anual R$ 149,90 (≈ R$ 12,49/mês, 37% de desconto). Paywall já atualizado. | `app/paywall.tsx` | Cadastrar exatamente estes valores nos planos básicos do Play Console. O preço real exibido no app vem da loja; o do código é só o fallback. |
| 1.5 | ~~Texto do trial enganoso.~~ **Resolvido em 04/09/2026:** o texto legal agora diz que o teste começa ao assinar, explica a renovação automática e o cancelamento com 24 h de antecedência. "Apple Store" corrigido para "App Store". | `app/paywall.tsx` | — |
| 1.6 | ~~Aviso desatualizado na Agenda.~~ **Resolvido em 04/09/2026:** no app da loja o aviso explica alarme, lembrete e as permissões do Android; na versão web avisa que o alarme não toca. | `app/(tabs)/agendamento.tsx` | — |
| 1.7 | ~~Permissões de alarme.~~ **Parcialmente resolvido em 04/09/2026:** `USE_EXACT_ALARM` removida; `SCHEDULE_EXACT_ALARM` mantida (o usuário autoriza nos Ajustes no Android 14+). `USE_FULL_SCREEN_INTENT` mantida e **exige a declaração no Play Console** (seção 5). | `plugins/withAlarme.js` | Falta só a declaração no console e o teste do alarme no build novo. |
| 1.8 | ~~EAS Update não habilitado.~~ **Resolvido em 04/09/2026:** `expo-updates` instalado, `updates.url` e `runtimeVersion` (política `appVersion`) no `app.json`, canais `development`, `preview` e `production` no `eas.json`. Vale a partir do próximo build nativo. | `package.json`, `app.json`, `eas.json` | Ver seção 9 para o uso no dia a dia. |

### Ajustes menores de configuração (`app.json`)

- **Ofuscação e redução de tamanho (R8/ProGuard).** Feito em 03/09/2026: `expo-build-properties` instalado e configurado com `enableProguardInReleaseBuilds` e `enableShrinkResourcesInReleaseBuilds`. Entra em vigor no próximo build nativo. O mapa de desofuscação passa a ir dentro do `.aab`, o que resolve o aviso do Play Console na versão 3. **Atenção ao testar o build seguinte:** R8 pode quebrar bibliotecas que dependem de reflexão; conferir alarme (Notifee), compra (RevenueCat) e seletor de horário no teste interno antes de publicar.
- ~~Subir `version` para `1.0.0`.~~ Feito em 04/09/2026.
- ~~`ITSAppUsesNonExemptEncryption: false`.~~ Feito em 04/09/2026.
- ~~Ícone monocromático do Android.~~ Feito em 04/09/2026.
- ~~Alinhar `expo` e `expo-constants`.~~ Feito em 04/09/2026.
- O expo-doctor marca `@notifee/react-native` como "sem manutenção" no diretório do React Native. Funciona no SDK 54, mas é um risco para atualizações futuras. Não bloqueia agora.

---

## 2. Contas e cadastros

| Conta | Custo | Estado | Observação |
|---|---|---|---|
| Apple Developer Program | US$ 99/ano | Não criada | Pessoa física ou empresa (empresa exige D-U-N-S da Zoen Labs). Inscrever no **Small Business Program** logo após a aprovação para pagar 15% em vez de 30%. |
| Google Play Console | US$ 25 uma vez | Não criada | Conta **pessoal** exige teste fechado com 12 testadores por 14 dias antes de publicar. Conta de **organização** (CNPJ) dispensa. Decidir antes de criar. |
| Expo / EAS | Grátis (fila lenta) | Pronta (`@zoen.labs`, projectId configurado) | EAS CLI não está instalado neste Mac: `npm install -g eas-cli` e `eas login`. |
| RevenueCat | Grátis até US$ 2.500/mês | Não criada | Ver seção 3. |

---

## 3. Assinaturas (RevenueCat + lojas)

O código já espera esta estrutura. Os identificadores precisam ser exatamente estes:

- Entitlement: `premium`
- Produtos: `imhere_premium_mensal` e `imhere_premium_anual`
- Offering atual com os pacotes padrão `monthly` e `annual`

Passos:

1. **App Store Connect:** aceitar o *Paid Apps Agreement* e preencher dados bancários e fiscais. Sem isso as compras não funcionam nem no sandbox. Criar o grupo de assinatura, as duas assinaturas auto-renováveis, a oferta introdutória de 7 dias grátis e a localização pt-BR.
2. **Play Console:** criar perfil de pagamentos, as duas assinaturas com *base plans* mensal e anual, e a oferta de teste grátis de 7 dias.
3. **RevenueCat:** criar o projeto, os apps iOS e Android, conectar a chave In-App Purchase da Apple e a *service account* do Google, cadastrar entitlement, produtos e offering.
4. **Chaves no build:** colocar `EXPO_PUBLIC_RC_IOS_KEY` e `EXPO_PUBLIC_RC_ANDROID_KEY` como variáveis de ambiente do EAS (`eas env:set`), nunca no repositório. **Android feito em 04/09/2026** nos ambientes `production` e `preview`. A chave iOS entra quando a conta Apple for liberada.

Estado do RevenueCat em 04/09/2026: projeto criado, app Google Play com pacote `com.zoenlabs.imhere`, entitlement `premium` com os dois produtos anexados, oferta `default` com pacotes Monthly e Yearly apontando para os produtos certos. Assinaturas criadas no Play Console com planos básicos `mensal` e `anual` e oferta `trial-7-dias`. Pendente: validação da credencial da conta de serviço (item 1 da verificação, prazo de propagação do Google de até 36 h).
5. **Testar:** sandbox tester no iOS (TestFlight) e *license testers* no Play (teste interno). Confirmar compra, restauração e cancelamento.

---

## 4. Legal e conteúdo

- **Política de Privacidade em URL pública.** Obrigatória nas duas lojas e no formulário de dados. A decisão "sem site" não dispensa isso: basta uma página estática na hospedagem da Expo (`eas deploy`) ou no GitHub Pages. Conteúdo: dados ficam no aparelho, RevenueCat recebe identificador anônimo e histórico de compras, notificações locais.
- **Termos de Uso.** A Apple aceita o EULA padrão dela, mas o link precisa aparecer no paywall (item 1.2).
- **URL de suporte e e-mail de contato.** Obrigatórios na Apple.
- **Tradução bíblica.** Os documentos marcam como bloqueante: confirmar que a Almeida usada é edição em domínio público (Revista e Corrigida de edições antigas) e registrar a versão no app e na descrição da loja.
- **Revisão teológica** dos 200 itens de conteúdo, pendência do registro mestre.
- **Alegações de saúde.** O disclaimer já existe no Perfil e na prática de ansiedade. Na descrição das lojas, nunca escrever que o app "trata" ou "reduz" ansiedade.

Pontos que **não** se aplicam e simplificam a revisão: não há login, então a Apple não exige Sign in with Apple nem exclusão de conta. Não há backend, então não há transferência de dados a declarar além do RevenueCat.

---

## 5. Android — atenção especial ao alarme

**Teste da versão 4 em 04/09/2026:** o alarme não tocou no horário; a tela cheia só apareceu ao reabrir o app (é a verificação de prática atrasada, janela de 45 min). Causa: no Android 14+ as permissões de **alarmes exatos** e de **tela cheia** não vêm concedidas e o app não pedia nenhuma delas; sem alarme exato o Android atrasa o disparo por minutos. Correção aplicada no mesmo dia:

- ~~Tela de lista de permissões.~~ ~~Fluxo com avisos do sistema encadeados.~~ O fluxo com avisos parou depois das notificações no teste da versão 7 (05/09/2026). Substituído por um **assistente passo a passo** (`app/permissoes.tsx` + `src/lib/permissions.ts`): abre sozinho ao entrar nas abas, ao criar um agendamento e por *Perfil → Alarmes e permissões* quando falta alguma permissão; mostra um pedido por vez, abre a janela ou a tela do sistema e avança sozinho ao voltar com a permissão ligada. "Deixar para depois" vale pelo dia. Limitação do Android: só notificações e bateria têm janela de "Permitir"; alarmes exatos, tela cheia e "sobre outros apps" só pelos Ajustes.
- **Permissão `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** adicionada para a janela do sistema da bateria. A Play Store só aceita quando a função principal depende disso; **declarar na revisão** com a justificativa do alarme. Versão do app subida para **1.0.1** por causa da mudança nativa (atualizações diretas não caem mais nos builds 1.0.0).
- **Módulo nativo local** `modules/alarm-permissions` (Kotlin, Expo Modules) para o que nenhuma biblioteca consulta: estado da permissão de tela cheia (Android 14+), estado e ajustes de "Exibir sobre outros apps", e se o aparelho está bloqueado. Compila só no EAS; qualquer erro aparece na fase Gradle.
- **Alarme por cima de tudo** (`src/lib/usePracticeFlow.ts`): bloqueado ou tela apagada, a notificação em tela cheia do sistema abre o app; em uso, o app abre a tela do alarme por conta própria via link `imhere://pratica-agora`, o que exige "Exibir sobre outros apps". A tela do alarme silencia a notificação ao aparecer e evita abrir duas vezes. Notificação com botão "Iniciar".
- Alarme insistente em `src/lib/alarms.ts`: acende a tela, vibra, repete o som até ser dispensado e para sozinho em 10 min.
- Teste da versão 6 em 05/09/2026: alarme tocou no horário (alarme exato OK), mas como notificação discreta, porque o aparelho estava em uso e a tela cheia não se aplica nesse caso. Pendente: **novo build** e repetir o teste nas duas situações, bloqueado e em uso.

O plugin `withAlarme.js` pede `USE_FULL_SCREEN_INTENT`, `SCHEDULE_EXACT_ALARM` e `USE_EXACT_ALARM`. A política do Google desde o Android 14:

- `USE_EXACT_ALARM` é reservado a apps de despertador e calendário. Um app de meditação pedindo essa permissão tende a ser **reprovado**. Recomendação: remover e manter só `SCHEDULE_EXACT_ALARM`, que pede autorização ao usuário nos Ajustes.
- `USE_FULL_SCREEN_INTENT` exige declaração no Play Console (*App content → Full-screen intent*) com justificativa. O uso como "despertador de prática" é defensável, mas o Google pode revogar. Ter um plano B: notificação de alta prioridade sem tomar a tela.

Demais itens do Play: formulário *Data Safety*, questionário de classificação etária, *feature graphic* de 1024×500, e o teste fechado de 14 dias se a conta for pessoal.

---

## 6. iOS — pontos específicos

- **Nome "I'm Here".** Nomes são únicos na App Store. Verificar disponibilidade no App Store Connect antes de criar o app; pode ser preciso um subtítulo, como "I'm Here — Pausa e Presença".
- **Alarme em tela cheia não existe no iOS.** O Notifee entrega uma notificação comum com som. Conferir o comportamento no TestFlight e ajustar os textos que prometem "tela cheia".
- **App Privacy (etiquetas de privacidade):** declarar *Purchase History* e *Identifiers* pelo RevenueCat.
- **Categoria:** Lifestyle é mais segura do que Health & Fitness, que atrai mais escrutínio sobre alegações de saúde.
- **Screenshots:** iPhone 6,9" e 6,5" em pt-BR. Sem iPad (`supportsTablet: false`).
- **Idade:** questionário de classificação, provavelmente 4+.

---

## 7. Material de loja

| Item | Estado |
|---|---|
| Ícone 1024×1024 sem transparência | Existe (`assets/icon.png`), mas os documentos marcam ícone e splash como provisórios. Decidir se é o definitivo. |
| Ícone adaptativo Android | Existe. Falta configurar o monocromático. |
| Screenshots pt-BR (iPhone e Android) | Não existem. |
| Feature graphic 1024×500 (Play) | Não existe. |
| Descrição curta, longa e palavras-chave | Não existem. |
| Fontes Cormorant Garamond / Inter | Não implementadas (tema usa fonte do sistema). Não bloqueia a loja, mas afeta a identidade prometida nos documentos. |

---

## 8. Ordem combinada (revisada em 03/09/2026)

A conta do Google Play foi criada em 03/09/2026 com o pacote `com.zoenlabs.imhere`, app gratuito. A Apple ainda não está liberada. O plano acordado:

1. **Build de destravamento (em andamento).** Um `eas build --profile production --platform android` com o código atual, enviado ao *Teste interno* só para o Play Console liberar a área de produtos. Esse build **não** vai para usuários: tem o modo desenvolvedor exposto e não aceita atualização direta.
2. **Cadastrar as assinaturas** (seção 3): `imhere_premium_mensal` e `imhere_premium_anual`, planos básicos `mensal` e `anual`, oferta `trial-7-dias` em cada um.
3. ~~**Corrigir tudo de uma vez.**~~ Feito em 04/09/2026 (itens 1.1, 1.2 no app, 1.5, 1.6, 1.7, 1.8 e ajustes do `app.json`).
4. ~~**Configurar o RevenueCat** e guardar as chaves no EAS.~~ Feito em 04/09/2026 para Android; falta a credencial validar.
5. ~~**Publicar Política de Privacidade e Termos.**~~ Publicado em 04/09/2026 na hospedagem da Expo e **movido em 05/09/2026 para o GitHub Pages**, junto com a remoção da versão web/PWA do app (a loja passou a ser o único canal). Páginas em `site/` na raiz do repositório, publicadas automaticamente a cada push na main por `.github/workflows/pages.yml`:
   - `https://zoenlabs.github.io/imhere/privacidade.html`
   - `https://zoenlabs.github.io/imhere/termos.html`
   A URL está em `src/lib/legal.ts`. A hospedagem antiga em `im-here.expo.app` pode ser apagada no painel da Expo. **Pendente:** colar a URL da política na ficha do Play Console (*Política do app → Política de Privacidade*).
5b. ~~**Commitar** as mudanças da rodada de correções.~~ Commit `7fd49bf` na `main`, 04/09/2026.
6. **Build novo de produção**, agora sim o definitivo, enviado ao teste interno. Validar compra, trial, restauração e cancelamento com testadores de licença. **Build gerado em 04/09/2026:** versão interna 4, commit `7fd49bf`, com R8, EAS Update e chave do RevenueCat. Ficou 80 minutos na fila gratuita da Expo. Pendente: enviar ao teste interno e rodar o roteiro de testes.
7. Cumprir o teste fechado de 14 dias no Play, se a conta for pessoal.
8. Publicar no Play. Repetir contas, produtos e envio para a Apple quando liberar.

O `eas.json` tem o perfil `submit.production` vazio. O `eas submit` vai perguntar Apple ID, Team ID e o caminho da *service account* do Google na primeira vez; depois vale preencher o perfil.

---

## 9. Como funcionam as atualizações depois de publicado

Existem dois caminhos, e o tipo de mudança define qual usar.

**Pela loja (build nativo).** `eas build` gera o `.aab`, `eas submit` envia, o Google revisa e o usuário recebe pela Play Store em horas ou dias. O número interno de versão sobe sozinho (`appVersionSource: remote` + `autoIncrement`). Só mexer no `version` do `app.json` quando quiser mudar a versão visível ao usuário. Obrigatório quando a mudança toca o nativo:

- instalar ou remover biblioteca com parte nativa (RevenueCat, Notifee, seletor de horário, expo-updates);
- mudar permissões, ícone, splash, nome do app ou o plugin de alarme;
- atualizar a versão do Expo SDK.

**Direta (EAS Update).** Para mudanças só em JavaScript e conteúdo: telas, textos, frases, versículos, regras de pontuação, correções de lógica. Um `eas update --branch production` publica em minutos, sem revisão, e o app baixa na próxima abertura.

**O que falta para habilitar a atualização direta:**

1. `npx expo install expo-updates`
2. No `app.json`, adicionar `updates.url` (a Expo informa ao rodar `eas update:configure`) e `runtimeVersion` com a política `{ "policy": "appVersion" }`.
3. Gerar um build nativo novo. Só builds feitos depois dessa configuração aceitam atualização direta.

**Regra do runtimeVersion.** A atualização direta só chega a builds com o mesmo `runtimeVersion`. Com a política `appVersion`, cada mudança no `version` do `app.json` cria uma família nova, e as atualizações passam a ir para ela. Isso evita entregar código que depende de uma biblioteca nativa que o celular antigo não tem. Na prática: mexeu no nativo, sobe a versão e faz build; mexeu só em tela ou conteúdo, `eas update` e pronto.
