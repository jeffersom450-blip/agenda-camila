# Agenda Camila Ribeiro

Agenda de atendimentos para o iPhone da Camila (@ricaminails). HTML/CSS/JS puros, sem build e sem servidor:
os dados ficam no próprio iPhone (localStorage) e saem em arquivo de backup (Ajustes › Fazer backup).

## Arquivos
- `index.html`, `estilo.css` — tela e visual (cores no topo do CSS, provisórias do Instagram; trocar pela identidade da Ricami)
- `js/dados.js` — dados e regras (sinal, bloqueios, conflitos)
- `js/whatsapp.js` — modelos de mensagem e abertura do WhatsApp
- `js/app.js` — telas
- `sw.js` — funciona sem internet; **a cada mudança publicada, subir `VERSAO` aqui** (e em `app.js`)

## Testar no computador
`python -m http.server 8765 --directory "D:\Trabalho\Sistemas e Apps\Agenda Camila"` e abrir http://localhost:8765

## Publicar (grátis)
GitHub Pages: repositório com estes arquivos na raiz → Settings › Pages › branch `main` / root.
O link fica `https://<usuario>.github.io/<repositorio>/`. O código fica público, mas nenhum dado de cliente vai para lá.

## Instalar no iPhone
Abrir o link no **Safari** › Compartilhar › **Adicionar à Tela de Início**. Usar sempre pelo ícone
(instalado, o iPhone não apaga os dados por falta de uso).

Importar dos contatos: Ajustes › Apps › Safari › Avançado › Feature Flags › ativar **Contact Picker API**.
