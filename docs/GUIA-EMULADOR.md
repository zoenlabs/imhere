# Guia — Rodar o I'm Here no emulador Android (Windows)

## Etapa 1 — Instalar o Android Studio
Baixe em https://developer.android.com/studio e instale com as opções padrão
(marque "Android Virtual Device" quando aparecer). O instalador já traz o SDK e o emulador.

## Etapa 2 — Criar o celular virtual
Abra o Android Studio. Na tela inicial, clique em **More Actions** → **Virtual Device Manager**
(se abrir um projeto, use o menu **Tools** → **Device Manager**).
Clique em **+ / Create Device**, escolha **Pixel 7** e avance.
Na lista de system images, baixe uma com **API 34 ou 35** (ícone de download ao lado do nome).
Avance e clique em **Finish**.

## Etapa 3 — Ligar o emulador
No Device Manager, clique no botão ▶ ao lado do Pixel 7.
Espere até aparecer a tela inicial do Android. Deixe essa janela aberta.

## Etapa 4 — Avisar o Windows onde está o SDK
Abra o **PowerShell** e cole:

```
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

Feche o PowerShell e abra um novo. Confirme que o emulador é enxergado:

```
adb devices
```

Deve listar algo como `emulator-5554   device`.

## Etapa 5 — Subir o app
Com o emulador ligado, no PowerShell:

```
cd "D:\Projetos\APP ImHere\im-here\apps\mobile"
npx expo start
```

Quando o terminal carregar, aperte a tecla **a**.
Na primeira vez o Expo instala o Expo Go dentro do emulador (leva 1-2 min) e abre o app.

## Uso no dia a dia
Deixe o `npx expo start` rodando enquanto trabalhamos: qualquer alteração no código
aparece no emulador em segundos (hot reload). Não precisa reiniciar nada.

Atalhos úteis no terminal do Expo:
`r` recarrega o app, `m` abre o menu de desenvolvedor, `j` abre o debugger, `Ctrl+C` encerra.

## Se der problema
Tela branca ou erro de bundle: `Ctrl+C` e rode `npx expo start -c` (limpa o cache).
Erro de dependência: `npm install --legacy-peer-deps` e tente de novo.
Emulador não liga: é preciso ter a virtualização (VT-x / AMD-V) habilitada na BIOS.
`adb` não reconhecido: refaça a Etapa 4 e abra um PowerShell novo.
