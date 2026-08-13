# Guia — Development build, alarmes e lembretes (I'm Here)

O agendamento do I'm Here funciona como um despertador: no horário marcado o app
toma a tela inteira por cima de qualquer outro aplicativo, e cinco minutos antes
chega um lembrete comum. Isso exige código nativo, então o app precisa virar um
APK próprio (development build). O Expo Go não roda esta parte.

Todos os comandos rodam em `D:\Projetos\APP ImHere\im-here\apps\mobile`.

## Etapa 1 — Instalar as bibliotecas

```
npx expo install expo-notifications expo-dev-client @notifee/react-native
```

## Etapa 2 — Conta Expo e login

Crie a conta gratuita em https://expo.dev e depois:

```
eas login
```

## Etapa 3 — Gerar o APK

```
eas build --profile development --platform android
```

A compilação roda no servidor da Expo e leva de 10 a 25 minutos. Ao terminar,
o terminal mostra um link e um QR Code para baixar o APK.

Importante: sempre que mexermos em permissão, ícone ou plugin nativo, é preciso
gerar o APK de novo. Mudanças só de tela e de código JavaScript não exigem build.

## Etapa 4 — Instalar no emulador

Com o emulador ligado, baixe o `.apk` do link e rode:

```
adb install caminho\do\arquivo.apk
```

Ou arraste o arquivo `.apk` para dentro da janela do emulador.

## Etapa 5 — Trabalhar normalmente

```
npx expo start --dev-client
```

Abra o app I'm Here instalado (não o Expo Go). Daqui em diante o hot reload
funciona igual ao que você já usa.

## Permissões que o Android vai pedir

Na primeira execução o app pede autorização para notificações. Além disso,
em Android 14 ou superior pode ser necessário liberar manualmente em
Ajustes → Apps → I'm Here → "Alarmes e lembretes" e "Notificações em tela cheia".

No lançamento na Play Store será preciso declarar no formulário que o app usa
alarmes em tela cheia. Sem essa declaração a permissão é negada.

## Como testar

Na aba Agenda, crie um agendamento para uns 7 minutos à frente, com o dia de hoje
marcado. Deixe o celular na tela inicial ou com outro app aberto.

Dois minutos depois chega o lembrete "sua prática começa em 5 minutos".
No horário exato, a tela do alarme toma o aparelho com o botão Iniciar.
Ao concluir a prática, aquele agendamento aparece com "feita hoje" na lista.

## Som, vibração e ligações

O alarme usa a categoria de alarme do Android com som e vibração padrão do
sistema. Volume, modo silencioso e "não perturbe" continuam mandando no
comportamento, e o próprio Android segura o alarme enquanto houver uma chamada
de voz ou vídeo em andamento, entregando logo depois.
