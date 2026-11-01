import * as D from './dados.js';
import { montarMensagem, abrirWhats, VARIAVEIS } from './whatsapp.js';

const VERSAO = '1.1.0';

// ---------- utilidades ----------
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalado = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function avisar(texto) {
  const a = document.getElementById('aviso');
  a.textContent = texto;
  a.classList.add('visivel');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => a.classList.remove('visivel'), 2200);
}

function aoDeslizar(alvo, fn) {
  let x0 = null, y0 = 0, t0 = 0;
  alvo.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
  alvo.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - t0 < 700) fn(dx < 0 ? 1 : -1);
  });
}

const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  voltar: svg('<path d="m15 5-7 7 7 7"/>'),
  esq: svg('<path d="m14 6-6 6 6 6"/>'),
  dir: svg('<path d="m10 6 6 6-6 6"/>'),
  mais: svg('<path d="M12 5v14M5 12h14"/>'),
  seta: svg('<path d="m9 6 6 6-6 6"/>'),
  whats: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.2c-.1-.2-.3-.3-.6-.4Z"/></svg>',
  enviar: svg('<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/>'),
  sino: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  lapis: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  lixo: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  relogio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pessoa: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  pessoas: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  unha: svg('<path d="M8 21V10a4 4 0 0 1 8 0v11"/><path d="M8 10c1.5-1.2 6.5-1.2 8 0"/>'),
  cofre: svg('<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3"/><path d="M12 9.5v1M7 20v1.5M17 20v1.5"/>'),
  cartao: svg('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>'),
  balao: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z"/>'),
  agenda: svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  engrenagem: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  fone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>'),
  etiqueta: svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
  fiado: svg('<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  grafico: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  sacola: svg('<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  cadeado: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
};

// ---------- navegação ----------
const hoje0 = new Date();
const rota = { tela: 'mes', ano: hoje0.getFullYear(), mes: hoje0.getMonth(), dia: D.hojeStr() };

function ir(nova) {
  Object.assign(rota, nova);
  render();
  window.scrollTo(0, 0);
}

function render() {
  const app = document.getElementById('app');
  app.replaceChildren();
  ({ mes: telaMes, dia: telaDia, clientes: telaClientes, servicos: telaServicos, mensagens: telaMensagens, ajustes: telaAjustes }[rota.tela] || telaMes)(app);
}

function topo({ titulo, sub = '', esquerda = 'menu', direita = '' }) {
  const t = el(`<header class="topo">
    <button class="icone-btn" data-esq aria-label="${esquerda === 'menu' ? 'Menu' : 'Voltar'}">${esquerda === 'menu' ? IC.menu : IC.voltar}</button>
    <h1>${titulo}${sub ? `<small>${sub}</small>` : ''}</h1>
    ${direita}
  </header>`);
  t.querySelector('[data-esq]').onclick = esquerda === 'menu' ? abrirMenu : () => ir({ tela: 'mes' });
  return t;
}

function abrirMenu() {
  const itens = [
    ['mes', 'Agenda', IC.agenda],
    ['clientes', 'Clientes', IC.pessoas],
    ['servicos', 'Serviços', IC.unha],
    ['mensagens', 'Mensagens', IC.balao],
    ['ajustes', 'Ajustes', IC.engrenagem],
  ];
  const breve = [['Fiado', IC.fiado], ['Financeiro', IC.grafico], ['Gastos do estúdio', IC.sacola]];
  const fundo = el('<div class="menu-fundo"></div>');
  const menu = el(`<nav class="menu">
    <div class="ola">Olá, ${esc(D.estado.config.nomeEstudio.split(' ')[0])}<small>${esc(D.estado.config.nomeEstudio)}</small></div>
    ${itens.map(([k, n, i]) => `<button data-ir="${k}" class="${(rota.tela === k || (k === 'mes' && rota.tela === 'dia')) ? 'ativo' : ''}">${i}${n}</button>`).join('')}
    <div style="height:10px"></div>
    ${breve.map(([n, i]) => `<button disabled>${i}${n}<em>em breve</em></button>`).join('')}
  </nav>`);
  document.body.append(fundo, menu);
  requestAnimationFrame(() => { fundo.classList.add('aberto'); menu.classList.add('aberto'); });
  const fechar = () => { fundo.classList.remove('aberto'); menu.classList.remove('aberto'); setTimeout(() => { fundo.remove(); menu.remove(); }, 250); };
  fundo.onclick = fechar;
  menu.querySelectorAll('[data-ir]').forEach((b) => (b.onclick = () => { fechar(); ir({ tela: b.dataset.ir }); }));
}

// ---------- folhas (janelas que sobem de baixo) ----------
const pilha = [];

function abrirFolha({ titulo, esquerda = 'Fechar', direita = '', aoFechar }) {
  const nivel = pilha.length;
  const fundo = el('<div class="folha-fundo"></div>');
  const folha = el(`<section class="folha" role="dialog" aria-label="${esc(titulo)}">
    <div class="folha-topo">
      <button class="lado" data-fechar>${esquerda}</button>
      <h2>${esc(titulo)}</h2>
      <button class="lado" data-direita>${direita}</button>
    </div>
    <div class="folha-corpo"></div>
  </section>`);
  fundo.style.zIndex = 30 + nivel * 2;
  folha.style.zIndex = 31 + nivel * 2;
  document.getElementById('folhas').append(fundo, folha);
  requestAnimationFrame(() => { fundo.classList.add('aberta'); folha.classList.add('aberta'); });
  const f = {
    folha,
    corpo: folha.querySelector('.folha-corpo'),
    direita: folha.querySelector('[data-direita]'),
    fechar() {
      const i = pilha.indexOf(f);
      if (i < 0) return;
      pilha.splice(i, 1);
      fundo.classList.remove('aberta'); folha.classList.remove('aberta');
      setTimeout(() => { fundo.remove(); folha.remove(); }, 250);
      aoFechar?.();
    },
  };
  pilha.push(f);
  fundo.onclick = f.fechar;
  folha.querySelector('[data-fechar]').onclick = f.fechar;
  return f;
}

// ---------- tela: mês ----------
function telaMes(app) {
  const { ano, mes } = rota;
  const hoje = D.hojeStr();
  const marcados = D.resumoDoMes(ano, mes);

  app.append(topo({ titulo: 'Agenda', direita: '<button class="pilula" data-hoje>Hoje</button>' }));
  app.querySelector('[data-hoje]').onclick = () => { const d = new Date(); ir({ tela: 'dia', dia: D.hojeStr(), ano: d.getFullYear(), mes: d.getMonth() }); };

  const tela = el('<main class="tela"></main>');
  app.append(tela);

  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(ano, mes, 1 - primeiro.getDay());
  const ultimo = new Date(ano, mes + 1, 0);
  const semanas = Math.ceil((primeiro.getDay() + ultimo.getDate()) / 7);
  let dias = '';
  for (let i = 0; i < semanas * 7; i++) {
    const d = new Date(inicio); d.setDate(inicio.getDate() + i);
    const s = D.strDeData(d);
    const n = marcados.get(s) || 0;
    const bloqDia = D.bloqueiosDoDia(s).some((b) => b.diaInteiro);
    const cls = ['dia', d.getMonth() !== mes && 'fora', s === hoje && 'hoje', bloqDia && 'bloq'].filter(Boolean).join(' ');
    const marcas = n ? (n <= 3 ? '<i></i>'.repeat(n) : '<i></i><i></i><b>+</b>') : '';
    dias += `<button class="${cls}" data-dia="${s}" aria-label="${D.dataLonga(s)}${n ? `, ${n} atendimento(s)` : ''}"><span>${d.getDate()}</span><span class="marcas">${marcas}</span></button>`;
  }
  const cal = el(`<section class="cal">
    <div class="cal-nav">
      <button class="icone-btn" data-mes="-1" aria-label="Mês anterior">${IC.esq}</button>
      <strong>${D.MESES[mes]} ${ano}</strong>
      <button class="icone-btn" data-mes="1" aria-label="Próximo mês">${IC.dir}</button>
    </div>
    <div class="cal-semana">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<span>${x}</span>`).join('')}</div>
    <div class="cal-dias">${dias}</div>
  </section>`);
  const mudarMes = (passo) => { const d = new Date(ano, mes + passo, 1); ir({ ano: d.getFullYear(), mes: d.getMonth() }); };
  cal.querySelectorAll('[data-mes]').forEach((b) => (b.onclick = () => mudarMes(Number(b.dataset.mes))));
  cal.querySelectorAll('[data-dia]').forEach((b) => (b.onclick = () => ir({ tela: 'dia', dia: b.dataset.dia })));
  aoDeslizar(cal, mudarMes);
  tela.append(cal);

  // avisos de primeiro uso
  if (ios && !instalado()) {
    tela.append(el(`<div class="dica"><strong>Instale a agenda no iPhone</strong>No Safari, toque em Compartilhar <b>⬆︎</b> e depois em <b>Adicionar à Tela de Início</b>. Assim ela abre como aplicativo e seus dados ficam guardados.</div>`));
  }
  if (!D.estado.servicos.length) {
    const d = el(`<div class="dica"><strong>Comece pelos seus serviços</strong>Cadastre os serviços com valor e tempo para agendar mais rápido.<br><button class="pilula" style="margin-top:8px">Cadastrar serviços</button></div>`);
    d.querySelector('button').onclick = () => ir({ tela: 'servicos' });
    tela.append(d);
  }
  const dias7 = D.estado.ultimoBackup ? (Date.now() - new Date(D.estado.ultimoBackup).getTime()) / 864e5 : Infinity;
  if (D.estado.agendamentos.length >= (D.estado.ultimoBackup ? 1 : 5) && dias7 > 7) {
    const d = el(`<div class="dica"><strong>Faça uma cópia de segurança</strong>${D.estado.ultimoBackup ? 'A última foi há mais de 7 dias.' : 'Você ainda não fez nenhuma.'}<br><button class="pilula" style="margin-top:8px">Fazer backup agora</button></div>`);
    d.querySelector('button').onclick = exportarBackup;
    tela.append(d);
  }

  // lembretes: hoje e amanhã ainda não confirmados
  const amanha = D.somarDias(hoje, 1);
  const agora = D.agoraMin();
  const aConfirmar = [...D.agendamentosDoDia(hoje).filter((a) => a.inicio > agora), ...D.agendamentosDoDia(amanha)]
    .filter((a) => !['confirmado', 'cancelado', 'faltou'].includes(a.status));
  if (aConfirmar.length) {
    tela.append(el('<h3 class="secao-titulo">Enviar lembrete</h3>'));
    const lista = el('<div class="cartao"></div>');
    for (const a of aConfirmar) {
      const c = D.clientePorId(a.clienteId);
      const item = el(`<div class="linha">
        <div class="hora">${D.hora(a.inicio)}</div>
        <div class="grow"><div class="t1">${esc(c?.nome)}</div><div class="t2">${a.data === hoje ? 'Hoje' : 'Amanhã'} · ${esc(a.servicos.map((s) => s.nome).join(', '))}</div></div>
        <button class="btn-whats ${a.lembreteEnviado ? 'feito' : ''}">${a.lembreteEnviado ? 'Enviado' : IC.whats + 'Lembrete'}</button>
      </div>`);
      item.querySelector('.grow').onclick = () => folhaDetalhe(a);
      item.querySelector('button').onclick = () => enviar('lembrete', a);
      lista.append(item);
    }
    tela.append(lista);
  }

  const deHoje = D.agendamentosDoDia(hoje).filter((a) => a.status !== 'cancelado');
  tela.append(el(`<h3 class="secao-titulo">Hoje · ${D.dataLonga(hoje)}</h3>`));
  const lista = el('<div class="cartao"></div>');
  if (!deHoje.length) lista.append(el('<div class="vazio">Nenhum atendimento hoje.</div>'));
  for (const a of deHoje) lista.append(linhaAgendamento(a));
  tela.append(lista);

  app.append(botaoNovo(() => (rota.ano === hoje0.getFullYear() && rota.mes === hoje0.getMonth() ? hoje : D.strDeData(new Date(ano, mes, 1)))));
}

function linhaAgendamento(a, mostrarData = false) {
  const c = D.clientePorId(a.clienteId);
  const st = a.status && a.status !== 'nenhum' ? `<span class="etiqueta ${corStatus(a.status)}">${D.STATUS[a.status]}</span>` : '';
  const b = el(`<button class="linha">
    <div class="hora">${mostrarData ? D.dataCurta(a.data) + '<br>' : ''}${D.hora(a.inicio)}</div>
    <div class="grow"><div class="t1">${esc(c?.nome || 'Cliente')}</div><div class="t2">${esc(a.servicos.map((s) => s.nome).join(', '))} · ${D.dinheiro(a.total)}</div></div>
    ${st}<span class="seta">${IC.seta}</span>
  </button>`);
  b.querySelector('.seta svg').style.cssText = 'width:18px;height:18px';
  b.onclick = () => folhaDetalhe(a);
  return b;
}

const corStatus = (s) => ({ confirmado: 'ok', aconfirmar: 'alerta', atrasou: 'alerta', faltou: 'perigo', cancelado: '' }[s] || '');

function botaoNovo(dataPadrao) {
  const b = el(`<button class="fab" aria-label="Novo agendamento">${IC.mais}</button>`);
  b.onclick = () => folhaNovo({ data: dataPadrao(), inicio: proximoHorario(dataPadrao()) });
  return b;
}

function proximoHorario(data) {
  const { inicio, intervalo } = D.estado.config;
  if (data !== D.hojeStr()) return inicio;
  return Math.max(inicio, Math.ceil(D.agoraMin() / intervalo) * intervalo);
}

// ---------- tela: dia ----------
function telaDia(app) {
  const s = rota.dia;
  const d = D.dataDeStr(s);
  const hoje = D.hojeStr();
  const cfg = D.estado.config;

  const tp = topo({ titulo: D.MESES[d.getMonth()], sub: String(d.getFullYear()), esquerda: 'voltar', direita: '<button class="pilula" data-hoje>Hoje</button>' });
  tp.querySelector('[data-esq]').onclick = () => ir({ tela: 'mes', ano: d.getFullYear(), mes: d.getMonth() });
  tp.querySelector('[data-hoje]').onclick = () => ir({ dia: hoje });
  app.append(tp);

  const tela = el('<main class="tela"></main>');
  app.append(tela);

  // faixa da semana
  const dom = D.somarDias(s, -d.getDay());
  let semana = '';
  for (let i = 0; i < 7; i++) {
    const x = D.somarDias(dom, i);
    const tem = D.agendamentosDoDia(x).some((a) => a.status !== 'cancelado');
    semana += `<button data-dia="${x}" class="${[x === s && 'sel', x === hoje && 'hoje', tem && 'tem'].filter(Boolean).join(' ')}"><small>${D.SEMANA_CURTA[i]}</small><strong>${D.dataDeStr(x).getDate()}</strong><i></i></button>`;
  }
  const faixa = el(`<nav class="semana">${semana}</nav>`);
  faixa.querySelectorAll('[data-dia]').forEach((b) => (b.onclick = () => ir({ dia: b.dataset.dia })));
  aoDeslizar(faixa, (p) => ir({ dia: D.somarDias(s, p * 7) }));
  tela.append(faixa);

  const ags = D.agendamentosDoDia(s);
  const bloqs = D.bloqueiosDoDia(s);
  const ativos = ags.filter((a) => a.status !== 'cancelado');
  const somaDia = ativos.filter((a) => a.status !== 'faltou').reduce((t, a) => t + (a.total || 0), 0);
  tela.append(el(`<h3 class="secao-titulo" style="margin-top:6px">${maiuscula(D.dataLonga(s))}${s === hoje ? ' · hoje' : ''}${ativos.length ? ` · ${ativos.length} cliente${ativos.length > 1 ? 's' : ''} · ${D.dinheiro(somaDia)}` : ''}</h3>`));

  // faixa de horários (estica se houver algo fora do expediente)
  const iv = cfg.intervalo;
  let ini = cfg.inicio, fim = cfg.fim;
  for (const a of ags) { ini = Math.min(ini, Math.floor(a.inicio / iv) * iv); fim = Math.max(fim, Math.ceil((a.inicio + a.duracao) / iv) * iv); }
  for (const b of bloqs) if (!b.diaInteiro) { ini = Math.min(ini, Math.floor(b.inicio / iv) * iv); fim = Math.max(fim, Math.ceil(b.fim / iv) * iv); }

  const grade = el('<div class="grade"></div>');
  const agora = D.agoraMin();
  for (let m = ini; m < fim; m += iv) {
    const passado = s < hoje || (s === hoje && m + iv <= agora);
    const slot = el(`<button class="slot ${passado ? 'passado' : ''}" aria-label="Marcar às ${D.hora(m)}"><span>${D.hora(m)}</span></button>`);
    slot.onclick = () => folhaNovo({ data: s, inicio: m });
    grade.append(slot);
  }

  const alt = (min) => (min / iv) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slot'));
  const itens = [
    ...bloqs.map((b) => ({ tipo: 'b', obj: b, ini: b.diaInteiro ? ini : b.inicio, fim: b.diaInteiro ? fim : b.fim })),
    ...ags.map((a) => ({ tipo: 'a', obj: a, ini: a.inicio, fim: a.inicio + a.duracao })),
  ].sort((x, y) => x.ini - y.ini || y.fim - x.fim);
  distribuirColunas(itens);
  for (const it of itens) {
    let bloco;
    if (it.tipo === 'b') {
      const b = it.obj;
      bloco = el(`<button class="bloco bloqueio"><strong>${IC.cadeado.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} Bloqueado</strong><span class="meta">${b.diaInteiro ? 'Dia inteiro' : `${D.hora(b.inicio)} – ${D.hora(b.fim)}`}${b.motivo ? ' · ' + esc(b.motivo) : ''}</span></button>`);
      bloco.onclick = () => folhaBloqueioDetalhe(b, s);
    } else {
      const a = it.obj;
      const c = D.clientePorId(a.clienteId);
      bloco = el(`<button class="bloco ${a.status || ''}">
        <span class="meta">${D.hora(a.inicio)} – ${D.hora(a.inicio + a.duracao)}${a.status && a.status !== 'nenhum' ? ' · ' + D.STATUS[a.status] : ''}</span>
        <strong>${esc(c?.nome || 'Cliente')}</strong>
        <span class="meta">${esc(a.servicos.map((x) => x.nome).join(', '))}</span>
      </button>`);
      bloco.onclick = () => folhaDetalhe(a);
    }
    bloco.style.top = alt(it.ini - ini) + 1 + 'px';
    bloco.style.height = Math.max(alt(it.fim - it.ini) - 3, 30) + 'px';
    if (it.n > 1) {
      bloco.style.left = `calc(58px + (100% - 64px) * ${it.col} / ${it.n})`;
      bloco.style.right = 'auto';
      bloco.style.width = `calc((100% - 64px) / ${it.n} - 4px)`;
    }
    grade.append(bloco);
  }
  if (s === hoje && agora >= ini && agora < fim) {
    const linha = el('<div class="agora"></div>');
    linha.style.top = alt(agora - ini) + 'px';
    grade.append(linha);
  }
  aoDeslizar(grade, (p) => ir({ dia: D.somarDias(s, p) }));
  tela.append(grade);

  app.append(botaoNovo(() => s));

  // rola até a hora atual (ou ao primeiro atendimento)
  requestAnimationFrame(() => {
    const alvo = s === hoje ? agora - 60 : (ags[0]?.inicio ?? cfg.inicio) - 30;
    if (alvo > ini) window.scrollTo({ top: grade.offsetTop + alt(alvo - ini) - 80 });
  });
}

function distribuirColunas(itens) {
  let grupo = [], fimGrupo = -1, colunas = [];
  const fecharGrupo = () => { for (const g of grupo) g.n = colunas.length; grupo = []; colunas = []; };
  for (const it of itens) {
    if (it.ini >= fimGrupo) fecharGrupo();
    let c = colunas.findIndex((f) => f <= it.ini);
    if (c < 0) { c = colunas.length; colunas.push(it.fim); } else colunas[c] = it.fim;
    it.col = c;
    grupo.push(it);
    fimGrupo = Math.max(fimGrupo, it.fim);
  }
  fecharGrupo();
}

// ---------- WhatsApp ----------
function enviar(tipo, a) {
  const c = D.clientePorId(a.clienteId);
  if (!c?.telefone) { avisar('Essa cliente está sem telefone'); return; }
  abrirWhats(c.telefone, tipo ? montarMensagem(tipo, a) : '');
  if (tipo === 'lembrete') a.lembreteEnviado = true;
  if (tipo === 'confirmacao') a.confirmacaoEnviada = true;
  if (tipo) { D.salvar(); setTimeout(render, 400); }
}

// ---------- novo / editar agendamento ----------
function opcoesHorario(atual) {
  const iv = D.estado.config.intervalo;
  const lista = [];
  for (let m = 6 * 60; m <= 23 * 60; m += iv) lista.push(m);
  if (atual != null && !lista.includes(atual)) lista.push(atual);
  return lista.sort((a, b) => a - b).map((m) => `<option value="${m}" ${m === atual ? 'selected' : ''}>${D.hora(m)}</option>`).join('');
}

function opcoesDuracao(atual) {
  const lista = [];
  for (let m = 15; m <= 600; m += 15) lista.push(m);
  if (atual && !lista.includes(atual)) lista.push(atual);
  return lista.sort((a, b) => a - b).map((m) => `<option value="${m}" ${m === atual ? 'selected' : ''}>${D.duracaoTexto(m)}</option>`).join('');
}

function folhaNovo({ data, inicio, ag, aoSalvar }) {
  const editando = !!ag;
  const f = ag ? structuredClone(ag) : {
    id: D.uid(), data, inicio, clienteId: null, servicos: [], duracao: D.estado.config.intervalo * 2, total: 0,
    sinal: { situacao: null, valor: D.estado.config.sinalPadrao }, pagamento: D.estado.config.pagamentoPadrao,
    status: 'nenhum', obs: '', criadoEm: new Date().toISOString(),
  };
  let modo = 'agendamento';

  const folha = abrirFolha({ titulo: editando ? 'Editar agendamento' : 'Novo' });
  const corpo = folha.corpo;

  const desenhar = () => {
    corpo.innerHTML = '';
    if (!editando) {
      const seg = el(`<div class="segmento" style="margin-bottom:14px"><button data-m="agendamento">Agendamento</button><button data-m="bloqueio">Bloqueio</button></div>`);
      seg.querySelectorAll('button').forEach((b) => { b.classList.toggle('sel', b.dataset.m === modo); b.onclick = () => { modo = b.dataset.m; desenhar(); }; });
      corpo.append(seg);
    }
    if (modo === 'bloqueio') return formBloqueio(corpo, { data: f.data, inicio: f.inicio }, folha);
    formAgendamento();
  };

  function formAgendamento() {
    corpo.append(el(`<div class="duas bloco-campos">
      <div class="campo"><label>Data</label><input class="entrada" type="date" data-c="data" value="${f.data}"></div>
      <div class="campo"><label>Horário</label><select class="entrada" data-c="inicio">${opcoesHorario(f.inicio)}</select></div>
    </div>`));
    corpo.querySelector('[data-c=data]').onchange = (e) => { if (e.target.value) f.data = e.target.value; validar(); };
    corpo.querySelector('[data-c=inicio]').onchange = (e) => { f.inicio = Number(e.target.value); validar(); };

    const secCliente = el('<div class="campo"></div>');
    const secServ = el('<div class="campo"></div>');
    const secSinal = el('<div class="campo"></div>');
    const secPag = el('<div class="campo"></div>');
    const secObs = el(`<div class="campo"><label>Observação</label><textarea class="entrada" placeholder="Opcional">${esc(f.obs)}</textarea></div>`);
    const rodape = el('<div></div>');
    corpo.append(secCliente, secServ, secSinal, secPag, secObs, rodape);
    secObs.querySelector('textarea').oninput = (e) => (f.obs = e.target.value);

    function desenharCliente(focar) {
      const c = D.clientePorId(f.clienteId);
      secCliente.innerHTML = '<span class="rotulo">Cliente <span class="obrig">*</span></span>';
      if (c) {
        const ch = el(`<div class="escolhida"><div class="grow"><div class="t1"><b>${esc(c.nome)}</b></div><div class="t2">${esc(c.telefone || 'sem telefone')}</div></div><button class="pilula">Trocar</button></div>`);
        ch.querySelector('button').onclick = () => { f.clienteId = null; if (f.sinal.situacao === 'comigo') f.sinal.situacao = null; desenharCliente(true); desenharSinal(); validar(); };
        secCliente.append(ch);
        return;
      }
      const busca = el('<input class="entrada" type="search" placeholder="Buscar pelo nome ou telefone" autocomplete="off">');
      const res = el('<div class="resultados"></div>');
      const acoes = el(`<div class="acoes-cliente"><button class="btn-sec" data-a="contatos">Dos contatos</button><button class="btn-sec" data-a="nova">Nova cliente</button></div>`);
      secCliente.append(busca, res, acoes);
      const listar = () => {
        res.innerHTML = '';
        const q = busca.value.trim();
        if (!q) return;
        const achadas = D.buscarClientes(q).slice(0, 8);
        if (!achadas.length) res.append(el('<div class="vazio" style="padding:12px">Nenhuma cliente com esse nome.</div>'));
        for (const x of achadas) {
          const l = el(`<button class="linha"><div class="grow"><div class="t1">${esc(x.nome)}</div><div class="t2">${esc(x.telefone)}</div></div></button>`);
          l.onclick = () => escolher(x);
          res.append(l);
        }
      };
      busca.oninput = listar;
      acoes.querySelector('[data-a=contatos]').onclick = () => importarContato(escolher);
      acoes.querySelector('[data-a=nova]').onclick = () => folhaClienteNova(busca.value, escolher);
      if (focar) setTimeout(() => busca.focus(), 50);
    }

    function escolher(c) {
      f.clienteId = c.id;
      // se a cliente já tem sinal guardado, já deixa marcado
      if (!f.sinal.situacao && saldoOutros(c).valor > 0) f.sinal.situacao = 'comigo';
      desenharCliente(); desenharSinal(); validar();
    }

    function desenharServicos() {
      secServ.innerHTML = '<span class="rotulo">Serviços <span class="obrig">*</span></span>';
      const sel = new Set(f.servicos.map((s) => s.id));
      const extras = f.servicos.filter((s) => !D.estado.servicos.some((x) => x.id === s.id));
      const todos = [...D.estado.servicos, ...extras];
      const fichas = el('<div class="fichas"></div>');
      for (const s of todos) {
        const b = el(`<button class="ficha ${sel.has(s.id) ? 'sel' : ''}">${esc(s.nome)}<small>${D.dinheiro(s.valor)}</small></button>`);
        b.onclick = () => {
          if (sel.has(s.id)) f.servicos = f.servicos.filter((x) => x.id !== s.id);
          else f.servicos.push({ id: s.id, nome: s.nome, valor: s.valor, duracao: s.duracao });
          recalcular(); desenharServicos(); validar();
        };
        fichas.append(b);
      }
      const novo = el('<button class="ficha mais">+ Novo serviço</button>');
      novo.onclick = () => folhaServico(null, (s) => { f.servicos.push({ id: s.id, nome: s.nome, valor: s.valor, duracao: s.duracao }); recalcular(); desenharServicos(); validar(); });
      fichas.append(novo);
      secServ.append(fichas);
      const det = el(`<div class="duas" style="margin-top:12px">
        <div class="campo"><label>Duração</label><select class="entrada" data-c="dur">${opcoesDuracao(f.duracao)}</select></div>
        <div class="campo"><label>Valor total (R$)</label><input class="entrada" data-c="total" inputmode="decimal" value="${String(f.total).replace('.', ',')}"></div>
      </div>`);
      det.querySelector('[data-c=dur]').onchange = (e) => { f.duracao = Number(e.target.value); validar(); };
      det.querySelector('[data-c=total]').oninput = (e) => { f.total = Number(e.target.value.replace(/\./g, '').replace(',', '.')) || 0; };
      secServ.append(det);
    }

    // escolher ou tirar um serviço refaz a soma; depois ela pode ajustar tempo e valor à mão
    function recalcular() {
      f.duracao = f.servicos.reduce((t, s) => t + (s.duracao || 0), 0) || D.estado.config.intervalo * 2;
      f.total = f.servicos.reduce((t, s) => t + (s.valor || 0), 0);
    }

    function saldoOutros(c) {
      return D.saldoSinal({ sinais: (c.sinais || []).filter((m) => m.agendamentoId !== f.id) });
    }

    function desenharSinal() {
      secSinal.innerHTML = '<span class="rotulo">Sinal <span class="obrig">*</span></span>';
      const c = D.clientePorId(f.clienteId);
      if (!c) { secSinal.append(el('<div class="t2" style="color:var(--texto-2);font-size:14px;padding:0 2px">Escolha a cliente para informar o sinal.</div>')); return; }
      const saldo = saldoOutros(c);
      const ops = [];
      if (saldo.valor > 0) ops.push(['comigo', 'O sinal já está comigo', `${D.dinheiro(saldo.valor)} deixado em ${D.dataCurta(saldo.desde)}`]);
      ops.push(['novo', 'Deixou sinal agora', 'Informe o valor recebido']);
      ops.push(['sem', 'Não deixou sinal', '']);
      const box = el('<div class="opcoes"></div>');
      for (const [k, t, sub] of ops) {
        const b = el(`<button class="opcao ${f.sinal.situacao === k ? 'sel' : ''}"><div class="grow">${t}${sub ? `<small>${sub}</small>` : ''}</div></button>`);
        b.onclick = () => { f.sinal.situacao = k; desenharSinal(); validar(); };
        box.append(b);
        if (k === 'novo' && f.sinal.situacao === 'novo') {
          const v = el(`<div class="campo" style="margin:0 0 0 14px"><label>Valor do sinal (R$)</label><input class="entrada" inputmode="decimal" value="${String(f.sinal.valor || '').replace('.', ',')}"></div>`);
          v.querySelector('input').oninput = (e) => { f.sinal.valor = Number(e.target.value.replace(',', '.')) || 0; validar(); };
          box.append(v);
        }
      }
      secSinal.append(box);
    }

    function desenharPagamento() {
      secPag.innerHTML = '<span class="rotulo">Forma de pagamento</span>';
      const fichas = el('<div class="fichas"></div>');
      for (const [k, n] of Object.entries(D.PAGAMENTOS)) {
        const b = el(`<button class="ficha ${f.pagamento === k ? 'sel' : ''}">${n.replace(' / Transferência', '')}</button>`);
        b.onclick = () => { f.pagamento = k; desenharPagamento(); };
        fichas.append(b);
      }
      secPag.append(fichas);
    }

    function faltando() {
      const m = [];
      if (!f.clienteId) m.push('cliente');
      if (!f.servicos.length) m.push('serviço');
      if (!f.sinal.situacao) m.push('sinal');
      else if (f.sinal.situacao === 'novo' && !(f.sinal.valor > 0)) m.push('valor do sinal');
      return m;
    }

    function validar() {
      const m = faltando();
      const conf = f.clienteId ? D.conflitos(f.data, f.inicio, f.duracao, f.id) : [];
      rodape.innerHTML = '';
      if (conf.length) rodape.append(el(`<div class="conflito">⚠️ Esse horário bate com ${esc(conf.join(', '))}.</div>`));
      const btn = el(`<button class="btn-principal" ${m.length ? 'disabled' : ''}>${editando ? 'Salvar alterações' : 'Agendar'}</button>`);
      rodape.append(btn);
      if (m.length) rodape.append(el(`<div class="falta">Falta informar: ${m.join(', ')}</div>`));
      btn.onclick = () => {
        if (conf.length && !confirm(`Esse horário bate com ${conf.join(', ')}. Marcar mesmo assim?`)) return;
        if (f.sinal.situacao === 'novo' && !f.sinal.data) f.sinal.data = D.hojeStr();
        if (f.sinal.situacao !== 'novo') delete f.sinal.data;
        D.salvarAgendamento(f);
        folha.fechar();
        if (aoSalvar) aoSalvar(f);
        else { ir({ tela: 'dia', dia: f.data }); folhaPosAgendamento(f); }
      };
    }

    if (!editando && f.servicos.length === 0) recalcular();
    desenharCliente(); desenharServicos(); desenharSinal(); desenharPagamento(); validar();
  }

  desenhar();
}

function folhaPosAgendamento(a) {
  const c = D.clientePorId(a.clienteId);
  const folha = abrirFolha({ titulo: 'Agendado ✓', esquerda: '' });
  folha.corpo.append(el(`<div style="text-align:center;padding:6px 6px 16px">
    <div style="font:500 20px var(--titulo)">${esc(c?.nome)}</div>
    <div style="color:var(--texto-2);margin-top:4px">${maiuscula(D.dataLonga(a.data))} às ${D.hora(a.inicio)}<br>${esc(a.servicos.map((s) => s.nome).join(', '))} · ${D.dinheiro(a.total)}</div>
  </div>`));
  const b = el(`<button class="btn-principal whats">${IC.whats}Enviar confirmação</button>`);
  b.onclick = () => { folha.fechar(); enviar('confirmacao', a); };
  const nao = el('<button class="btn-texto">Agora não</button>');
  nao.onclick = folha.fechar;
  folha.corpo.append(b, nao);
}

// ---------- bloqueio ----------
function formBloqueio(corpo, { data, inicio, b }, folha) {
  const iv = D.estado.config.intervalo;
  const f = b ? structuredClone(b) : { id: D.uid(), data, inicio, fim: inicio + 2 * iv, diaInteiro: false, motivo: '', repetir: 'nao' };
  const box = el('<div></div>');
  corpo.append(box);
  const desenhar = () => {
    box.innerHTML = '';
    box.append(el(`<div class="campo"><label>Data</label><input class="entrada" type="date" value="${f.data}"></div>`));
    box.lastChild.querySelector('input').onchange = (e) => { if (e.target.value) f.data = e.target.value; };
    const seg = el(`<div class="campo"><span class="rotulo">Período</span><div class="segmento"><button data-v="0">Horário</button><button data-v="1">Dia inteiro</button></div></div>`);
    seg.querySelectorAll('button').forEach((x) => { x.classList.toggle('sel', (x.dataset.v === '1') === f.diaInteiro); x.onclick = () => { f.diaInteiro = x.dataset.v === '1'; desenhar(); }; });
    box.append(seg);
    if (!f.diaInteiro) {
      const h = el(`<div class="duas bloco-campos">
        <div class="campo"><label>Início</label><select class="entrada" data-c="i">${opcoesHorario(f.inicio)}</select></div>
        <div class="campo"><label>Fim</label><select class="entrada" data-c="f">${opcoesHorario(f.fim)}</select></div>
      </div>`);
      h.querySelector('[data-c=i]').onchange = (e) => { f.inicio = Number(e.target.value); if (f.fim <= f.inicio) { f.fim = f.inicio + iv; desenhar(); } };
      h.querySelector('[data-c=f]').onchange = (e) => { f.fim = Number(e.target.value); };
      box.append(h);
    }
    box.append(el(`<div class="campo"><label>Motivo</label><input class="entrada" placeholder="Ex.: médico, compromisso" value="${esc(f.motivo)}"></div>`));
    box.lastChild.querySelector('input').oninput = (e) => (f.motivo = e.target.value);
    const rep = el(`<div class="campo"><span class="rotulo">Repetir</span><div class="segmento"><button data-v="nao">Não</button><button data-v="semanal">Toda semana</button><button data-v="mensal">Todo mês</button></div></div>`);
    rep.querySelectorAll('button').forEach((x) => { x.classList.toggle('sel', x.dataset.v === f.repetir); x.onclick = () => { f.repetir = x.dataset.v; desenhar(); }; });
    box.append(rep);
    const ok = el('<button class="btn-principal">Bloquear</button>');
    ok.onclick = () => {
      if (!f.diaInteiro && f.fim <= f.inicio) { avisar('O fim precisa ser depois do início'); return; }
      D.salvarBloqueio(f);
      folha.fechar();
      ir({ tela: 'dia', dia: f.data });
      avisar('Horário bloqueado');
    };
    box.append(ok);
  };
  desenhar();
}

function folhaBloqueioDetalhe(b, dia) {
  const folha = abrirFolha({ titulo: 'Bloqueio' });
  const rep = { nao: '', semanal: ' · repete toda semana', mensal: ' · repete todo mês' }[b.repetir];
  folha.corpo.append(el(`<div class="cartao info" style="margin-bottom:14px">
    <div class="linha">${IC.relogio}<div class="grow"><div class="t1">${b.diaInteiro ? 'Dia inteiro' : `${D.hora(b.inicio)} – ${D.hora(b.fim)}`}</div><div class="t2">${maiuscula(D.dataLonga(dia))}${rep}</div></div></div>
    <div class="linha">${IC.balao}<div class="grow"><div class="t2">Motivo</div><div>${esc(b.motivo) || '—'}</div></div></div>
  </div>`));
  const editar = el('<button class="btn-principal">Editar bloqueio</button>');
  editar.onclick = () => { folha.fechar(); const f2 = abrirFolha({ titulo: 'Editar bloqueio' }); formBloqueio(f2.corpo, { b }, f2); };
  folha.corpo.append(editar);
  if (b.repetir !== 'nao') {
    const so = el('<button class="btn-texto" style="color:var(--perigo)">Liberar só este dia</button>');
    so.onclick = () => { D.excluirBloqueio(b.id, dia); folha.fechar(); render(); avisar('Dia liberado'); };
    folha.corpo.append(so);
  }
  const tudo = el(`<button class="btn-texto" style="color:var(--perigo)">${b.repetir !== 'nao' ? 'Excluir todas as repetições' : 'Excluir bloqueio'}</button>`);
  tudo.onclick = () => { if (!confirm('Excluir este bloqueio?')) return; D.excluirBloqueio(b.id); folha.fechar(); render(); };
  folha.corpo.append(tudo);
}

// ---------- detalhe do agendamento ----------
function folhaDetalhe(a) {
  const folha = abrirFolha({ titulo: 'Agendamento' });
  const desenhar = () => {
    a = D.estado.agendamentos.find((x) => x.id === a.id) || a;
    const c = D.clientePorId(a.clienteId);
    const corpo = folha.corpo;
    corpo.innerHTML = '';
    const acoes = el(`<div class="acoes">
      <button class="w" data-a="whats">${IC.whats}Whats</button>
      <button class="w ${a.confirmacaoEnviada ? 'feito' : ''}" data-a="confirmacao">${IC.enviar}Confirmação</button>
      <button class="w ${a.lembreteEnviado ? 'feito' : ''}" data-a="lembrete">${IC.sino}Lembrete</button>
      <button data-a="editar">${IC.lapis}Editar</button>
      <button class="x" data-a="excluir">${IC.lixo}Excluir</button>
    </div>`);
    acoes.querySelector('[data-a=whats]').onclick = () => enviar(null, a);
    acoes.querySelector('[data-a=confirmacao]').onclick = () => { enviar('confirmacao', a); desenhar(); };
    acoes.querySelector('[data-a=lembrete]').onclick = () => { enviar('lembrete', a); desenhar(); };
    acoes.querySelector('[data-a=editar]').onclick = () => folhaNovo({ ag: a, aoSalvar: () => { desenhar(); render(); } });
    acoes.querySelector('[data-a=excluir]').onclick = () => {
      if (!confirm(`Excluir o agendamento de ${c?.nome || 'cliente'}?`)) return;
      D.excluirAgendamento(a.id); folha.fechar(); render(); avisar('Agendamento excluído');
    };
    corpo.append(acoes);

    const saldo = D.saldoSinal(c);
    let sinalTxt;
    if (a.sinal?.situacao === 'novo') sinalTxt = `Deixou ${D.dinheiro(a.sinal.valor)} neste agendamento`;
    else if (a.sinal?.situacao === 'comigo') sinalTxt = 'Usou o sinal que já estava com você';
    else sinalTxt = 'Não deixou sinal';
    const info = el(`<div class="cartao info">
      <div class="linha">${IC.relogio}<div class="grow"><div class="t1">${D.hora(a.inicio)} – ${D.hora(a.inicio + a.duracao)} <span style="font-weight:400;color:var(--texto-2)">(${D.duracaoTexto(a.duracao)})</span></div><div class="t2">${maiuscula(D.dataLonga(a.data))}</div></div></div>
      <button class="linha" data-a="cliente">${IC.pessoa}<div class="grow"><div class="t1">${esc(c?.nome || 'Cliente')}</div><div class="t2">${esc(c?.telefone || 'sem telefone')}</div></div><span class="seta">${IC.seta}</span></button>
      <div class="linha">${IC.unha}<div class="grow"><div>${esc(a.servicos.map((s) => s.nome).join(', '))}</div><div class="t2">${D.dinheiro(a.total)} · ${D.PAGAMENTOS[a.pagamento]}${D.pago(a) ? ' · pago' : ''}</div></div></div>
      <div class="linha">${IC.cofre}<div class="grow"><div>${sinalTxt}</div><div class="t2">${saldo.valor > 0 ? `Com você agora: ${D.dinheiro(saldo.valor)}` : 'Nenhum sinal guardado'}</div></div></div>
    </div>`);
    info.querySelectorAll('.seta svg').forEach((s) => (s.style.cssText = 'width:18px;height:18px;color:#C9BBB0'));
    info.querySelector('[data-a=cliente]').onclick = () => c && folhaCliente(c);
    corpo.append(info);

    if (['faltou', 'cancelado'].includes(a.status) && saldo.valor > 0) {
      const s = el(`<div class="dica" style="margin-top:12px"><strong>O sinal de ${D.dinheiro(saldo.valor)} continua com você</strong>Ele fica para o próximo horário dela. Se ela pegou de volta ou você ficou com ele, registre aqui:
        <div class="acoes-cliente"><button class="btn-sec" data-s="devolvido">Devolvi</button><button class="btn-sec" data-s="retido">Fiquei com ele</button></div></div>`);
      s.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { D.baixarSinal(c, b.dataset.s); desenhar(); avisar('Sinal registrado'); }));
      corpo.append(s);
    }

    corpo.append(el('<h3 class="secao-titulo">Situação</h3>'));
    const st = el('<div class="fichas"></div>');
    for (const [k, n] of Object.entries(D.STATUS)) {
      const b = el(`<button class="ficha ${(a.status || 'nenhum') === k ? 'sel' : ''}">${n}</button>`);
      b.onclick = () => { a.status = k; D.salvarAgendamento(a); desenhar(); render(); };
      st.append(b);
    }
    corpo.append(st);

    corpo.append(el('<h3 class="secao-titulo">Pagamento</h3>'));
    const pg = el('<div class="fichas"></div>');
    for (const [k, n] of Object.entries(D.PAGAMENTOS)) {
      const b = el(`<button class="ficha ${a.pagamento === k ? 'sel' : ''}">${n.replace(' / Transferência', '')}</button>`);
      b.onclick = () => { a.pagamento = k; D.salvarAgendamento(a); desenhar(); };
      pg.append(b);
    }
    corpo.append(pg);

    corpo.append(el('<h3 class="secao-titulo">Observação</h3>'));
    const obs = el(`<textarea class="entrada" placeholder="Escreva uma observação">${esc(a.obs)}</textarea>`);
    obs.onchange = () => { a.obs = obs.value; D.salvarAgendamento(a); avisar('Observação salva'); };
    corpo.append(obs);
  };
  desenhar();
}

// ---------- clientes ----------
async function importarContato(escolher) {
  if ('contacts' in navigator && 'select' in navigator.contacts) {
    try {
      const [ct] = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (!ct) return;
      const nome = ct.name?.[0] || '';
      const tel = ct.tel?.[0] || '';
      if (!tel) { avisar('Esse contato não tem telefone'); return; }
      escolher(D.acharOuCriarCliente(nome || tel, tel));
    } catch (e) {
      console.warn(e);
    }
    return;
  }
  const folha = abrirFolha({ titulo: 'Contatos do iPhone' });
  folha.corpo.append(el(`<div>
    <p style="margin-top:4px">Para escolher direto da sua agenda de contatos, ative uma vez esta opção no iPhone:</p>
    <div class="cartao" style="padding:12px 14px;line-height:1.7">Ajustes › Apps › Safari › Avançado › <b>Feature Flags</b> › ative <b>Contact Picker API</b></div>
    <p style="color:var(--texto-2);font-size:14px">Depois feche a agenda e abra de novo. Enquanto isso, cadastre a cliente pelo botão abaixo — da próxima vez é só buscar pelo nome.</p>
  </div>`));
  const b = el('<button class="btn-principal">Cadastrar cliente</button>');
  b.onclick = () => { folha.fechar(); folhaClienteNova('', escolher); };
  folha.corpo.append(b);
}

function folhaClienteNova(nomeInicial, aoSalvar, existente) {
  const folha = abrirFolha({ titulo: existente ? 'Editar cliente' : 'Nova cliente' });
  folha.corpo.append(el(`<div>
    <div class="campo"><label>Nome</label><input class="entrada" data-c="nome" autocomplete="off" value="${esc(existente?.nome ?? nomeInicial)}"></div>
    <div class="campo"><label>WhatsApp</label><input class="entrada" data-c="tel" type="tel" inputmode="tel" placeholder="(12) 99999-9999" value="${esc(existente?.telefone || '')}"></div>
  </div>`));
  const nome = folha.corpo.querySelector('[data-c=nome]');
  const tel = folha.corpo.querySelector('[data-c=tel]');
  tel.onblur = () => (tel.value = D.formatarTelefone(tel.value));
  const ok = el('<button class="btn-principal">Salvar</button>');
  ok.onclick = () => {
    if (!nome.value.trim()) { avisar('Escreva o nome'); return; }
    if (D.soDigitos(tel.value).length < 10) { avisar('Confira o telefone com DDD'); return; }
    let c;
    if (existente) { existente.nome = nome.value.trim(); existente.telefone = D.formatarTelefone(tel.value); D.salvar(); c = existente; }
    else c = D.acharOuCriarCliente(nome.value, tel.value);
    folha.fechar();
    aoSalvar?.(c);
  };
  folha.corpo.append(ok);
  setTimeout(() => (nome.value ? tel : nome).focus(), 300);
}

function folhaCliente(c) {
  const folha = abrirFolha({ titulo: c.nome, direita: 'Editar' });
  folha.direita.onclick = () => folhaClienteNova('', () => { folha.fechar(); folhaCliente(c); render(); }, c);
  const desenhar = () => {
    const corpo = folha.corpo;
    corpo.innerHTML = '';
    const e = D.estatisticasCliente(c);
    const saldo = D.saldoSinal(c);
    const topoC = el(`<div class="cartao info">
      <div class="linha">${IC.fone}<div class="grow"><div class="t1">${esc(c.telefone || 'sem telefone')}</div></div>
        <a class="pilula" href="tel:${D.soDigitos(c.telefone)}" style="text-decoration:none">Ligar</a>
        <button class="btn-whats" data-w>${IC.whats}Whats</button></div>
      <div class="linha">${IC.cofre}<div class="grow"><div class="t1">${saldo.valor > 0 ? `Sinal com você: ${D.dinheiro(saldo.valor)}` : 'Nenhum sinal guardado'}</div>${saldo.valor > 0 ? `<div class="t2">Desde ${D.dataCurta(saldo.desde)}</div>` : ''}</div></div>
    </div>`);
    topoC.querySelector('[data-w]').onclick = () => abrirWhats(c.telefone);
    corpo.append(topoC);
    if (saldo.valor > 0) {
      const s = el(`<div class="acoes-cliente"><button class="btn-sec" data-s="devolvido">Devolvi o sinal</button><button class="btn-sec" data-s="retido">Fiquei com o sinal</button></div>`);
      s.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => {
        if (!confirm(b.dataset.s === 'devolvido' ? `Confirmar que devolveu ${D.dinheiro(saldo.valor)}?` : `Confirmar que ficou com ${D.dinheiro(saldo.valor)} (falta/desistência)?`)) return;
        D.baixarSinal(c, b.dataset.s); desenhar();
      }));
      corpo.append(s);
    }
    corpo.append(el(`<h3 class="secao-titulo">Estatística</h3>`));
    corpo.append(el(`<div class="cartao">
      <div class="linha"><div class="grow"><div class="t2">Último atendimento</div><div>${e.ultimo ? `${D.dataCurta(e.ultimo)} · ${Math.round((D.dataDeStr(D.hojeStr()) - D.dataDeStr(e.ultimo)) / 864e5)} dia(s) atrás` : '—'}</div></div></div>
      <div class="linha"><div class="grow"><div class="t2">Próximo horário</div><div>${e.proximo ? `${D.dataCurta(e.proximo.data)} às ${D.hora(e.proximo.inicio)}` : '—'}</div></div></div>
      <div class="linha"><div class="grow"><div class="t2">Cancelamentos</div><div>${e.cancelamentos}</div></div><div class="grow"><div class="t2">Não compareceu</div><div>${e.faltas}</div></div></div>
      <div class="linha"><div class="grow t2" style="text-align:center">Cliente desde ${D.dataLonga(c.criadoEm).split(', ')[1]} de ${c.criadoEm.slice(0, 4)}</div></div>
    </div>`));
    corpo.append(el(`<h3 class="secao-titulo">Histórico</h3>`));
    const h = el('<div class="cartao"></div>');
    if (!e.lista.length) h.append(el('<div class="vazio">Nenhum agendamento ainda.</div>'));
    for (const a of e.lista.slice(0, 30)) h.append(linhaAgendamento(a, true));
    corpo.append(h);
    if (!e.total) {
      const x = el('<button class="btn-texto" style="color:var(--perigo)">Excluir cliente</button>');
      x.onclick = () => { if (!confirm(`Excluir ${c.nome}?`)) return; D.estado.clientes = D.estado.clientes.filter((y) => y.id !== c.id); D.salvar(); folha.fechar(); render(); };
      corpo.append(x);
    }
  };
  desenhar();
}

function telaClientes(app) {
  const add = '<button class="icone-btn" data-novo aria-label="Nova cliente">' + IC.mais + '</button>';
  app.append(topo({ titulo: 'Clientes', sub: `${D.estado.clientes.length} cadastrada${D.estado.clientes.length === 1 ? '' : 's'}`, direita: add }));
  app.querySelector('[data-novo]').onclick = () => folhaClienteNova('', () => render());
  const tela = el('<main class="tela"></main>');
  const busca = el('<input class="entrada" type="search" placeholder="Buscar pelo nome ou telefone" style="margin-bottom:12px">');
  const lista = el('<div class="cartao"></div>');
  tela.append(busca, lista);
  app.append(tela);
  const listar = () => {
    lista.innerHTML = '';
    const cs = D.buscarClientes(busca.value);
    if (!cs.length) lista.append(el(`<div class="vazio">${D.estado.clientes.length ? 'Nenhuma cliente encontrada.' : 'As clientes aparecem aqui conforme você agenda.'}</div>`));
    for (const c of cs) {
      const s = D.saldoSinal(c);
      const l = el(`<button class="linha"><div class="grow"><div class="t1">${esc(c.nome)}</div><div class="t2">${esc(c.telefone)}</div></div>${s.valor > 0 ? `<span class="etiqueta">sinal ${D.dinheiro(s.valor)}</span>` : ''}</button>`);
      l.onclick = () => folhaCliente(c);
      lista.append(l);
    }
  };
  busca.oninput = listar;
  listar();
}

// ---------- serviços ----------
function folhaServico(s, aoSalvar) {
  const folha = abrirFolha({ titulo: s ? 'Editar serviço' : 'Novo serviço' });
  folha.corpo.append(el(`<div>
    <div class="campo"><label>Nome</label><input class="entrada" data-c="nome" placeholder="Ex.: Aplicação de alongamento" value="${esc(s?.nome || '')}"></div>
    <div class="duas bloco-campos">
      <div class="campo"><label>Valor (R$)</label><input class="entrada" data-c="valor" inputmode="decimal" value="${s ? String(s.valor).replace('.', ',') : ''}"></div>
      <div class="campo"><label>Duração</label><select class="entrada" data-c="dur">${opcoesDuracao(s?.duracao || 60)}</select></div>
    </div>
  </div>`));
  const q = (k) => folha.corpo.querySelector(`[data-c=${k}]`);
  const ok = el('<button class="btn-principal">Salvar</button>');
  ok.onclick = () => {
    const nome = q('nome').value.trim();
    if (!nome) { avisar('Escreva o nome do serviço'); return; }
    const novo = { id: s?.id || D.uid(), nome, valor: Number(q('valor').value.replace(/\./g, '').replace(',', '.')) || 0, duracao: Number(q('dur').value) };
    const i = D.estado.servicos.findIndex((x) => x.id === novo.id);
    if (i >= 0) D.estado.servicos[i] = novo; else D.estado.servicos.push(novo);
    D.salvar();
    folha.fechar();
    aoSalvar?.(novo);
  };
  folha.corpo.append(ok);
  if (s) {
    const x = el('<button class="btn-texto" style="color:var(--perigo)">Excluir serviço</button>');
    x.onclick = () => { if (!confirm(`Excluir "${s.nome}"? Os agendamentos já feitos não mudam.`)) return; D.estado.servicos = D.estado.servicos.filter((y) => y.id !== s.id); D.salvar(); folha.fechar(); aoSalvar?.(); };
    folha.corpo.append(x);
  }
  if (!s) setTimeout(() => q('nome').focus(), 300);
}

function telaServicos(app) {
  app.append(topo({ titulo: 'Serviços', direita: `<button class="icone-btn" data-novo aria-label="Novo serviço">${IC.mais}</button>` }));
  app.querySelector('[data-novo]').onclick = () => folhaServico(null, () => render());
  const tela = el('<main class="tela"></main>');
  const lista = el('<div class="cartao"></div>');
  if (!D.estado.servicos.length) lista.append(el('<div class="vazio">Nenhum serviço ainda. Toque em + para cadastrar.</div>'));
  for (const s of D.estado.servicos) {
    const l = el(`<button class="linha"><div class="grow"><div class="t1">${esc(s.nome)}</div><div class="t2">${D.duracaoTexto(s.duracao)}</div></div><strong>${D.dinheiro(s.valor)}</strong></button>`);
    l.onclick = () => folhaServico(s, () => render());
    lista.append(l);
  }
  tela.append(lista, el('<p style="color:var(--texto-2);font-size:14px;margin:12px 4px">No agendamento você pode escolher mais de um serviço: o app soma o valor e o tempo.</p>'));
  app.append(tela);
}

// ---------- mensagens ----------
const NOMES_MSG = { confirmacao: 'Confirmação de agendamento', lembrete: 'Lembrete do horário', cobranca: 'Cobrança de fiado' };

function exemploAgendamento() {
  const c = { id: '_ex', nome: 'Marina Fontoura', telefone: '', sinais: [{ tipo: 'recebido', valor: D.estado.config.sinalPadrao, data: D.hojeStr() }] };
  return { c, a: { clienteId: '_ex', data: D.somarDias(D.hojeStr(), 1), inicio: 14 * 60, servicos: [{ nome: 'Aplicação de alongamento' }, { nome: 'Esmaltação' }], total: 180 } };
}

// mostra *negrito* e _itálico_ como o WhatsApp mostra
const comoWhats = (t) => esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/(^|\s)_([^_\n]+)_/g, '$1<i>$2</i>');

function previa(tipo, texto) {
  const { c, a } = exemploAgendamento();
  D.estado.clientes.push(c);
  const antigo = D.estado.config.mensagens[tipo];
  D.estado.config.mensagens[tipo] = texto;
  const r = montarMensagem(tipo, a);
  D.estado.config.mensagens[tipo] = antigo;
  D.estado.clientes.pop();
  return r;
}

function telaMensagens(app) {
  app.append(topo({ titulo: 'Mensagens' }));
  const tela = el('<main class="tela"><p style="color:var(--texto-2);font-size:14px;margin:4px 4px 12px">O nome, a data, o horário e os serviços entram sozinhos. Toque para editar o texto.</p></main>');
  for (const tipo of Object.keys(NOMES_MSG)) {
    tela.append(el(`<h3 class="secao-titulo">${NOMES_MSG[tipo]}${tipo === 'cobranca' ? ' · em breve' : ''}</h3>`));
    const b = el(`<button class="cartao" style="display:block;width:100%;text-align:left;padding:10px"><div class="previa">${comoWhats(previa(tipo, D.estado.config.mensagens[tipo]))}</div></button>`);
    b.onclick = () => folhaModelo(tipo);
    tela.append(b);
  }
  app.append(tela);
}

function folhaModelo(tipo) {
  const folha = abrirFolha({ titulo: NOMES_MSG[tipo], direita: 'Salvar' });
  const txt = el(`<textarea class="entrada" style="min-height:220px">${esc(D.estado.config.mensagens[tipo])}</textarea>`);
  const vars = el(`<div class="variaveis">${Object.entries(VARIAVEIS).map(([k, n]) => `<button data-v="${k}">${n}</button>`).join('')}</div>`);
  const pv = el('<div class="previa"></div>');
  const atualizar = () => (pv.innerHTML = comoWhats(previa(tipo, txt.value)));
  txt.oninput = atualizar;
  vars.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => {
    const i = txt.selectionStart ?? txt.value.length;
    txt.value = txt.value.slice(0, i) + b.dataset.v + txt.value.slice(txt.selectionEnd ?? i);
    txt.focus(); txt.selectionStart = txt.selectionEnd = i + b.dataset.v.length;
    atualizar();
  }));
  const salvarModelo = () => { D.estado.config.mensagens[tipo] = txt.value; D.salvar(); folha.fechar(); render(); avisar('Mensagem salva'); };
  folha.direita.onclick = salvarModelo;
  const restaurar = el('<button class="btn-texto">Voltar ao texto original</button>');
  restaurar.onclick = () => { if (confirm('Voltar ao texto original?')) { txt.value = D.MENSAGENS_PADRAO[tipo]; atualizar(); } };
  const ok = el('<button class="btn-principal">Salvar</button>');
  ok.onclick = salvarModelo;
  folha.corpo.append(txt, el('<span class="rotulo" style="margin-top:10px">Toque para inserir:</span>'), vars, el('<span class="rotulo" style="margin-top:14px">Como a cliente vai receber:</span>'), pv, ok, restaurar);
  atualizar();
}

// ---------- ajustes ----------
function telaAjustes(app) {
  const cfg = D.estado.config;
  app.append(topo({ titulo: 'Ajustes' }));
  const tela = el('<main class="tela"></main>');
  const horas = (atual) => { let o = ''; for (let m = 5 * 60; m <= 23 * 60; m += 30) o += `<option value="${m}" ${m === atual ? 'selected' : ''}>${D.hora(m)}</option>`; return o; };
  tela.append(el(`<div>
    <h3 class="secao-titulo">Agenda</h3>
    <div class="campo"><label>Seu nome</label><input class="entrada" data-c="nomeEstudio" value="${esc(cfg.nomeEstudio)}"></div>
    <div class="duas bloco-campos">
      <div class="campo"><label>A agenda começa às</label><select class="entrada" data-c="inicio" data-n>${horas(cfg.inicio)}</select></div>
      <div class="campo"><label>E termina às</label><select class="entrada" data-c="fim" data-n>${horas(cfg.fim)}</select></div>
    </div>
    <div class="campo"><label>Intervalo da grade</label><select class="entrada" data-c="intervalo" data-n>${[15, 20, 30, 45, 60].map((m) => `<option value="${m}" ${m === cfg.intervalo ? 'selected' : ''}>De ${m} em ${m} minutos</option>`).join('')}</select></div>
    <h3 class="secao-titulo">Atendimento</h3>
    <div class="duas bloco-campos">
      <div class="campo"><label>Sinal padrão (R$)</label><input class="entrada" data-c="sinalPadrao" data-n inputmode="decimal" value="${cfg.sinalPadrao}"></div>
      <div class="campo"><label>Pagamento padrão</label><select class="entrada" data-c="pagamentoPadrao">${Object.entries(D.PAGAMENTOS).map(([k, n]) => `<option value="${k}" ${k === cfg.pagamentoPadrao ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label>Abrir mensagens no</label><select class="entrada" data-c="abrirWhats">
      <option value="whatsapp" ${cfg.abrirWhats === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
      <option value="business" ${cfg.abrirWhats === 'business' ? 'selected' : ''}>WhatsApp Business</option>
      <option value="link" ${cfg.abrirWhats === 'link' ? 'selected' : ''}>Link wa.me (pelo navegador)</option>
    </select></div>
  </div>`));
  tela.querySelectorAll('[data-c]').forEach((x) => (x.onchange = () => {
    const v = 'n' in x.dataset ? Number(String(x.value).replace(',', '.')) || 0 : x.value;
    if (x.dataset.c === 'fim' && v <= cfg.inicio) { avisar('O fim precisa ser depois do início'); x.value = cfg.fim; return; }
    if (x.dataset.c === 'inicio' && v >= cfg.fim) { avisar('O início precisa ser antes do fim'); x.value = cfg.inicio; return; }
    cfg[x.dataset.c] = v;
    D.salvar();
    avisar('Salvo');
  }));

  tela.append(el('<h3 class="secao-titulo">Cópia de segurança</h3>'));
  const bk = el(`<div class="cartao">
    <button class="linha" data-a="exp"><div class="grow"><div class="t1">Fazer backup agora</div><div class="t2">${D.estado.ultimoBackup ? 'Último: ' + new Date(D.estado.ultimoBackup).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nenhum feito ainda'} · salve no iCloud Drive ou mande para você no WhatsApp</div></div></button>
    <button class="linha" data-a="imp"><div class="grow"><div class="t1">Restaurar um backup</div><div class="t2">Substitui tudo o que está no app</div></div></button>
  </div>`);
  bk.querySelector('[data-a=exp]').onclick = exportarBackup;
  bk.querySelector('[data-a=imp]').onclick = importarBackup;
  tela.append(bk);
  tela.append(el(`<p style="color:var(--texto-2);font-size:13px;text-align:center;margin-top:24px">Agenda ${esc(cfg.nomeEstudio)} · versão ${VERSAO}</p>`));
  app.append(tela);
}

async function exportarBackup() {
  const nome = `agenda-camila-${D.hojeStr()}.json`;
  const arquivo = new File([JSON.stringify(D.estado, null, 1)], nome, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: 'Backup da agenda' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(arquivo); a.download = nome; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    D.estado.ultimoBackup = new Date().toISOString();
    D.salvar();
    render();
    avisar('Backup feito');
  } catch (e) {
    if (e.name !== 'AbortError') avisar('Não deu para fazer o backup');
  }
}

function importarBackup() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const arq = inp.files?.[0];
    if (!arq) return;
    try {
      const dados = JSON.parse(await arq.text());
      if (!confirm(`Restaurar o backup "${arq.name}"? Tudo o que está no app agora será substituído.`)) return;
      D.substituirTudo(dados);
      ir({ tela: 'mes' });
      avisar('Backup restaurado');
    } catch (e) {
      alert('Esse arquivo não é um backup da agenda.');
    }
  };
  inp.click();
}

// ---------- início ----------
render();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js');
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recarregou) { recarregou = true; location.reload(); } });
}
// ao voltar para o app depois de um tempo, atualiza "hoje" e os lembretes
document.addEventListener('visibilitychange', () => { if (!document.hidden && !pilha.length) render(); });
