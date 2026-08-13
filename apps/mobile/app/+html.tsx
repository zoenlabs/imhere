import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Casca HTML da versão web. Só existe no build web — o app nativo ignora.
 * É aqui que o PWA ganha manifesto, cor de tema, ícone de tela de início
 * e o registro do service worker.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />

        <title>I'm Here</title>
        <meta
          name="description"
          content="Pausas diárias para respirar, meditar na Palavra, orar e receber afirmações."
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F2E8D8" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS: abre em tela cheia quando adicionado à tela de início */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="I'm Here" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: baseStyle }} />

        <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const baseStyle = `
  html, body, #root {
    height: 100%;
    background-color: #F2E8D8;
  }
  body {
    margin: 0;
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
  }
  /* O app é uma coluna de celular, mesmo aberto no computador */
  #root {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(46, 41, 37, 0.12);
  }
`;

/**
 * O Chrome dispara o convite de instalação assim que a página carrega, uma
 * única vez. Como o botão só aparece bem depois, na tela de Perfil, é preciso
 * segurar o evento aqui no topo do HTML e avisar o app quando ele existir.
 */
const captureInstallPrompt = `
  window.__imhereInstall = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.__imhereInstall = event;
    window.dispatchEvent(new Event('imhere-installable'));
  });
  window.addEventListener('appinstalled', function () {
    window.__imhereInstall = null;
    window.dispatchEvent(new Event('imhere-installed'));
  });
`;

const registerServiceWorker = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
`;
