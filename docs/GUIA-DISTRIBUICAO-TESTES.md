# Guia — Distribuir o I'm Here para testadores (antes das lojas)

O Expo Go deixou de servir como canal de teste: o app passou a usar módulos nativos
(alarme, seletor de horário, assinatura) que não existem dentro dele. A partir daqui,
todo teste acontece com um build próprio, gerado na nuvem da Expo. Você continua
trabalhando no Windows — não é preciso ter um Mac.

Todos os comandos rodam em `D:\Projetos\APP ImHere\im-here\apps\mobile`.

---

## Android — caminho rápido (dias, não semanas)

Gera um APK que qualquer pessoa instala pelo link, sem passar pela Play Store.
É o melhor jeito de validar com o círculo próximo.

```
eas build --profile preview --platform android
```

Ao final o terminal mostra um link e um QR Code. Quem receber precisa autorizar
"instalar de fontes desconhecidas" no Android — é a única fricção.

Limitação: as compras de assinatura não funcionam fora da Play Store. Para testar
o paywall de verdade, use o caminho oficial abaixo.

## Android — caminho oficial (teste interno na Play Store)

Necessário: conta de desenvolvedor Google Play, US$ 25 pagos uma única vez.

1. Crie o app no Play Console
2. Gere o pacote de produção: `eas build --profile production --platform android`
3. Envie: `eas submit --platform android`
4. No Play Console, vá em Teste → Teste interno, crie a lista de e-mails e compartilhe o link

O teste interno libera em minutos e aceita até 100 testadores. É aqui que as
assinaturas passam a funcionar de verdade.

---

## iOS — TestFlight (único caminho)

Necessário: Apple Developer Program, US$ 99 por ano.

```
eas build --profile production --platform ios
eas submit --platform ios
```

Depois, no App Store Connect, o build aparece em TestFlight.

Existem dois grupos de testadores. Os **internos** são até 100 pessoas com acesso à
sua conta e recebem o build em minutos, sem revisão da Apple. Os **externos** vão
até 10.000 pessoas, entram por link público, e o primeiro build de cada versão passa
por uma revisão da Apple que costuma levar de algumas horas a dois dias.

---

## Depois do primeiro build: correções sem recompilar

Ajustes de tela, texto e regras em JavaScript podem ir para os testadores sem gerar
build novo:

```
eas update --branch preview
```

Só exige build novo quando mexemos em permissão, ícone, plugin nativo ou biblioteca
nova.

---

## Atenção ao prazo da Play Store

Contas **pessoais** criadas depois de 13/11/2023 precisam de um teste fechado com no
mínimo 12 testadores reais, em aparelhos físicos, usando o app por 14 dias seguidos
antes de poder publicar em produção. O Google verifica se o uso é orgânico, e tentar
burlar com emulador ou automação pode custar o banimento da conta.

Contas de **organização** (com CNPJ) não estão sujeitas a essa exigência. Como o app
sai sob a ZoenLabs, vale abrir a conta já como organização — economiza duas semanas
no lançamento.

---

## Ordem recomendada

Primeiro o APK de preview, para validar UX com cinco a dez pessoas de confiança.
Em paralelo, abrir as duas contas de desenvolvedor, porque a aprovação leva dias.
Depois o teste interno na Play e o TestFlight, já com as assinaturas cadastradas,
para validar cobrança e trial. Só então a produção.

## Custos

Google Play: US$ 25, pagamento único.
Apple Developer Program: US$ 99 por ano.
EAS Build: o plano gratuito atende builds ocasionais; se a fila incomodar, o plano
pago começa em torno de US$ 19/mês e pode ser assinado só no mês do lançamento.
