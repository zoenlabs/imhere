# Guia — Publicar o I'm Here como PWA

Versão web instalável do app, feita a partir da mesma base de código.
Serve para validar UX com qualquer pessoa, em iPhone ou Android, por um link,
sem loja e sem instalar nada.

Comandos rodam em `D:\Projetos\APP ImHere\im-here\apps\mobile`.

## Publicar

```
npx expo export --platform web
eas deploy
```

O primeiro comando gera a pasta `dist`. O segundo sobe para a hospedagem da
Expo e devolve uma URL pública. Para promover a versão a definitiva:

```
eas deploy --prod
```

Alternativa sem Expo: a pasta `dist` é um site estático comum e pode ser
arrastada para o Netlify Drop ou publicada na Vercel.

## Como o testador instala

No **Android**, o Chrome mostra sozinho um convite "Instalar app". Se não
aparecer, menu do navegador → Adicionar à tela inicial.

No **iPhone**, é manual e vale explicar: abrir o link no Safari, tocar no botão
de compartilhar e escolher "Adicionar à Tela de Início". Só assim o app abre em
tela cheia, sem a barra do navegador.

## O que funciona

Splash, onboarding, home, as seis respirações com o círculo animado, as frases
nos três tipos, gamificação com saldo e sequência, criação e listagem de
agendamentos, perfil e paywall. Funciona offline depois da primeira visita, tem
ícone próprio na tela de início e abre em tela cheia.

## O que não funciona

O alarme e o lembrete não disparam. Nenhum navegador permite tomar a tela por
cima de outros aplicativos, e a API que agendava notificações localmente foi
descontinuada pelo Google. Os agendamentos continuam sendo criados e salvos —
apenas não chamam.

A compra de assinatura também não acontece: cobrança na web exigiria Stripe ou
similar, fora do escopo atual.

Vibração não existe no iPhone. Os dados continuam por aparelho, sem sincronizar.

## Peças que fazem o PWA funcionar

`public/manifest.json` — nome, ícones, cor e modo tela cheia
`public/sw.js` — service worker, cache e funcionamento offline
`public/icons/` — ícones 192, 512, maskable e o do iOS
`app/+html.tsx` — casca HTML, meta tags do iOS e registro do service worker
`src/components/TimeField.web.tsx` — seletor de horário do HTML, já que o nativo não existe na web
`src/lib/alarms.web.ts` — neutraliza o alarme e mantém o Notifee fora do bundle web

Ao publicar uma versão nova, suba o número da versão em `public/sw.js`
(`const VERSION = 'imhere-v2'`), senão os testadores continuam vendo a versão
antiga que ficou em cache.
