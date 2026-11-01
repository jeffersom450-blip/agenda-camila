// Dados da agenda: tudo fica no próprio iPhone (localStorage) e sai em arquivo de backup.
const CHAVE = 'agendaCamila.v1';

export const MENSAGENS_PADRAO = {
  confirmacao:
    '*CONFIRMAÇÃO DE AGENDAMENTO* 💅\n\n' +
    'Oi {cliente}, seu horário está marcado!\n' +
    '📅 {data} às {horario}\n' +
    '💅 {servicos}\n' +
    '💰 Valor: {valor}\n' +
    '{sinal}\n\n' +
    '*ATENÇÃO!*\n' +
    '⏰ _Tolerância de atraso é de 10 minutos, após esse horário o atendimento será reagendado!_\n' +
    '🗓️ Para reagendar esse atendimento será cobrado um novo sinal!\n\n' +
    'Obrigada ❤️',
  lembrete:
    'Oi {cliente}, tudo bem?\n' +
    'Este é um lembrete para o seu atendimento, {quando} às {horario}.\n' +
    'Serviço: {servicos}\n' +
    'Valor: {valor}\n' +
    '⏰ _Tolerância de atraso é de 10 minutos, após esse horário o atendimento será reagendado!_\n' +
    '🗓️ Atenção, para reagendar esse atendimento será cobrado um novo sinal!\n\n' +
    'Obrigada ❤️',
  cobranca:
    'Oi {cliente}, tudo bem?\n' +
    'Passando para lembrar do valor de {valor} do seu atendimento do dia {data}, combinado para {vencimento}.\n' +
    'Pode ser por Pix 😉\n\n' +
    'Obrigada ❤️',
};

// texto de cobrança da v1 (dizia "hoje vence" mesmo depois do vencimento): troca se ela não mexeu nele
const COBRANCA_V1 = 'Oi {cliente}, tudo bem?\nPassando para lembrar que hoje vence o valor de {valor} do seu atendimento do dia {data}.\nPode ser por Pix 😉\n\nObrigada ❤️';

function estadoNovo() {
  return {
    versao: 1,
    config: {
      nomeEstudio: 'Camila Ribeiro',
      inicio: 8 * 60,
      fim: 20 * 60,
      intervalo: 30,
      sinalPadrao: 30,
      pagamentoPadrao: 'pix',
      abrirWhats: 'whatsapp',
      mensagens: { ...MENSAGENS_PADRAO },
    },
    servicos: [],
    clientes: [],
    agendamentos: [],
    bloqueios: [],
    gastos: [],
    ultimoBackup: null,
  };
}

export let estado = carregar();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const e = JSON.parse(bruto);
      const base = estadoNovo();
      e.config = { ...base.config, ...e.config, mensagens: { ...base.config.mensagens, ...(e.config?.mensagens || {}) } };
      if (e.config.mensagens.cobranca === COBRANCA_V1) e.config.mensagens.cobranca = MENSAGENS_PADRAO.cobranca;
      for (const k of ['servicos', 'clientes', 'agendamentos', 'bloqueios', 'gastos']) e[k] = e[k] || [];
      // serviços de antes das cores ganham uma cor e ela fica gravada
      const usadas = e.servicos.map((s) => s.cor).filter((h) => h != null);
      let mudou = false;
      for (const s of e.servicos) if (s.cor == null) { s.cor = novaCor(usadas); usadas.push(s.cor); mudou = true; }
      if (mudou) localStorage.setItem(CHAVE, JSON.stringify(e));
      return e;
    }
  } catch (err) {
    console.error('Falha ao ler os dados', err);
  }
  return estadoNovo();
}

export function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
}

export function substituirTudo(novo) {
  if (!novo || !Array.isArray(novo.agendamentos) || !Array.isArray(novo.clientes)) throw new Error('Arquivo de backup inválido');
  localStorage.setItem(CHAVE, JSON.stringify(novo));
  estado = carregar();
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- datas ----------
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const SEMANA_CURTA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const dois = (n) => String(n).padStart(2, '0');
export const strDeData = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
export const dataDeStr = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
export const hojeStr = () => strDeData(new Date());
export const somarDias = (s, n) => { const d = dataDeStr(s); d.setDate(d.getDate() + n); return strDeData(d); };
export const hora = (min) => `${dois(Math.floor(min / 60))}:${dois(min % 60)}`;
export const minutos = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const agoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

export function dataLonga(s) {
  const d = dataDeStr(s);
  return `${SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
export const dataCurta = (s) => { const d = dataDeStr(s); return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`; };

export function duracaoTexto(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${dois(m)}` : `${h}h`;
}

export const dinheiro = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------- cores dos serviços ----------
// A cor é só o matiz (0–359); fundo claro e texto escuro do mesmo tom garantem leitura em qualquer cor.
export const corServico = (h) => ({ fundo: `hsl(${h} 68% 87%)`, borda: `hsl(${h} 52% 42%)`, texto: `hsl(${h} 60% 19%)` });

// declarada como function (e não const) porque carregar() a usa antes desta linha rodar
function distanciaCor(a, b) { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x); }

// sorteia uma cor, preferindo a mais diferente das que já estão em uso
export function novaCor(usadas = estado.servicos.map((s) => s.cor).filter((h) => h != null)) {
  let melhor = 0, dist = -1;
  for (let i = 0; i < 24; i++) {
    const h = Math.floor(Math.random() * 360);
    const d = usadas.length ? Math.min(...usadas.map((u) => distanciaCor(u, h))) : 360;
    if (d > dist) { dist = d; melhor = h; }
  }
  return melhor;
}

// cor de um agendamento = cor do primeiro serviço (a atual do cadastro; se o serviço foi apagado, a guardada nele)
export function corDoAgendamento(a) {
  const s = a.servicos?.[0];
  if (!s) return null;
  return estado.servicos.find((x) => x.id === s.id)?.cor ?? s.cor ?? null;
}

// ---------- clientes ----------
export const soDigitos = (t) => String(t || '').replace(/\D/g, '');

export function formatarTelefone(t) {
  let d = soDigitos(t);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || '';
}

export const clientePorId = (id) => estado.clientes.find((c) => c.id === id);

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function buscarClientes(q) {
  const t = semAcento(q).trim();
  const dig = soDigitos(q);
  return estado.clientes
    .filter((c) => !t || semAcento(c.nome).includes(t) || (dig.length >= 3 && soDigitos(c.telefone).includes(dig)))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function acharOuCriarCliente(nome, telefone) {
  const dig = soDigitos(telefone);
  let c = dig && estado.clientes.find((x) => soDigitos(x.telefone).endsWith(dig.slice(-9)));
  if (c) return c;
  c = { id: uid(), nome: nome.trim(), telefone: formatarTelefone(telefone), criadoEm: hojeStr(), sinais: [] };
  estado.clientes.push(c);
  salvar();
  return c;
}

// Sinal: dinheiro da cliente que fica com a Camila e passa de um agendamento para o próximo.
export function saldoSinal(cliente) {
  if (!cliente) return { valor: 0, desde: null };
  let valor = 0, desde = null;
  for (const m of cliente.sinais || []) {
    if (m.tipo === 'recebido') { valor += m.valor; if (!desde) desde = m.data; }
    else valor -= m.valor;
    if (valor <= 0) { valor = 0; desde = null; }
  }
  return { valor, desde };
}

export function baixarSinal(cliente, tipo) {
  const { valor } = saldoSinal(cliente);
  if (valor <= 0) return;
  cliente.sinais.push({ id: uid(), data: hojeStr(), tipo, valor });
  salvar();
}

export function estatisticasCliente(c) {
  const ags = estado.agendamentos.filter((a) => a.clienteId === c.id);
  const hoje = hojeStr();
  const feitos = ags.filter((a) => a.data <= hoje && !['cancelado', 'faltou'].includes(a.status)).sort((a, b) => (a.data + a.inicio < b.data + b.inicio ? 1 : -1));
  const futuros = ags.filter((a) => a.data >= hoje && a.status !== 'cancelado');
  return {
    total: ags.length,
    ultimo: feitos[0]?.data || null,
    cancelamentos: ags.filter((a) => a.status === 'cancelado').length,
    faltas: ags.filter((a) => a.status === 'faltou').length,
    proximo: futuros.sort((a, b) => (a.data + a.inicio > b.data + b.inicio ? 1 : -1))[0] || null,
    lista: ags.sort((a, b) => (a.data + a.inicio < b.data + b.inicio ? 1 : -1)),
  };
}

// ---------- agendamentos ----------
export const STATUS = {
  nenhum: 'Nenhum',
  confirmado: 'Confirmado',
  aconfirmar: 'À confirmar',
  atrasou: 'Atrasou',
  cancelado: 'Cancelado',
  faltou: 'Não compareceu',
};

export const PAGAMENTOS = {
  pix: 'Pix / Transferência',
  dinheiro: 'Dinheiro',
  credito: 'Cartão de crédito',
  debito: 'Cartão de débito',
  fiado: 'Fiado',
  cortesia: 'Cortesia',
};

export function salvarAgendamento(ag) {
  // fiado: guarda o vencimento e se já foi pago; trocar a forma de pagamento apaga isso
  if (ag.pagamento === 'fiado') ag.fiado = { vence: ag.fiado?.vence || somarDias(ag.data, 30), pagoEm: ag.fiado?.pagoEm || null, cobradoEm: ag.fiado?.cobradoEm || null };
  else delete ag.fiado;
  const i = estado.agendamentos.findIndex((a) => a.id === ag.id);
  if (i >= 0) estado.agendamentos[i] = ag; else estado.agendamentos.push(ag);

  // o sinal pago neste agendamento vira crédito da cliente
  const c = clientePorId(ag.clienteId);
  for (const outra of estado.clientes) outra.sinais = (outra.sinais || []).filter((m) => !(m.agendamentoId === ag.id && m.tipo === 'recebido'));
  if (c && ag.sinal?.situacao === 'novo' && ag.sinal.valor > 0) {
    c.sinais.push({ id: uid(), data: ag.sinal.data || hojeStr(), tipo: 'recebido', valor: ag.sinal.valor, agendamentoId: ag.id });
  }
  salvar();
}

export function excluirAgendamento(id) {
  estado.agendamentos = estado.agendamentos.filter((a) => a.id !== id);
  // o sinal continua com a Camila (reagendamento); só perde o vínculo com o horário apagado
  for (const c of estado.clientes) for (const m of c.sinais || []) if (m.agendamentoId === id) m.agendamentoId = null;
  salvar();
}

export const agendamentosDoDia = (s) =>
  estado.agendamentos.filter((a) => a.data === s).sort((a, b) => a.inicio - b.inicio);

export function resumoDoMes(ano, mes) {
  const pref = `${ano}-${dois(mes + 1)}-`;
  const mapa = new Map();
  for (const a of estado.agendamentos) {
    if (!a.data.startsWith(pref) || a.status === 'cancelado') continue;
    mapa.set(a.data, (mapa.get(a.data) || 0) + 1);
  }
  return mapa;
}

// Pagamento sai do "a receber" sozinho quando o horário passa (fiado só quando ela marca que recebeu).
export function pago(ag) {
  if (['cancelado', 'faltou'].includes(ag.status)) return false;
  if (ag.pagamento === 'fiado') return !!ag.fiado?.pagoEm;
  const hoje = hojeStr();
  return ag.data < hoje || (ag.data === hoje && ag.inicio + ag.duracao <= agoraMin());
}

// ---------- fiado ----------
export const fiadosEmAberto = () => estado.agendamentos
  .filter((a) => a.pagamento === 'fiado' && !a.fiado?.pagoEm && !['cancelado', 'faltou'].includes(a.status))
  .sort((a, b) => (a.fiado?.vence || '').localeCompare(b.fiado?.vence || ''));

export const fiadosParaCobrar = () => fiadosEmAberto().filter((a) => a.fiado?.vence && a.fiado.vence <= hojeStr());

export function receberFiado(ag, desfazer = false) {
  if (!ag.fiado) return;
  ag.fiado.pagoEm = desfazer ? null : hojeStr();
  salvar();
}

// ---------- gastos do estúdio ----------
export const CATEGORIAS_GASTO = ['Materiais', 'Aluguel', 'Contas', 'Equipamentos', 'Cursos', 'Divulgação', 'Outros'];

const mesDe = (s) => s.slice(0, 7);

// gasto fixo aparece todo mês no mesmo dia, do mês em que foi lançado até o mês "ate" (exclusive)
export function gastosDoMes(ano, mes) {
  const m = `${ano}-${dois(mes + 1)}`;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const lista = [];
  for (const g of estado.gastos) {
    if (!g.fixo) { if (mesDe(g.data) === m) lista.push({ ...g, dia: g.data }); continue; }
    if (m < mesDe(g.data) || (g.ate && m >= g.ate) || (g.excecoes || []).includes(m)) continue;
    const d = Math.min(Number(g.data.slice(8)), ultimoDia);
    lista.push({ ...g, dia: `${m}-${dois(d)}` });
  }
  return lista.sort((a, b) => b.dia.localeCompare(a.dia));
}

export function salvarGasto(g) {
  const i = estado.gastos.findIndex((x) => x.id === g.id);
  if (i >= 0) estado.gastos[i] = g; else estado.gastos.push(g);
  salvar();
}

// modo: 'tudo' apaga; 'mes' tira só aquele mês; 'daqui' para de repetir a partir daquele mês
export function excluirGasto(id, modo = 'tudo', mes) {
  const g = estado.gastos.find((x) => x.id === id);
  if (!g) return;
  if (g.fixo && modo === 'mes') (g.excecoes = g.excecoes || []).push(mes);
  else if (g.fixo && modo === 'daqui' && mes > mesDe(g.data)) g.ate = mes;
  else estado.gastos = estado.gastos.filter((x) => x.id !== id);
  salvar();
}

// ---------- relatório do mês ----------
export function relatorioDoMes(ano, mes) {
  const pref = `${ano}-${dois(mes + 1)}`;
  const doMes = estado.agendamentos.filter((a) => a.data.startsWith(pref)).sort((a, b) => a.data.localeCompare(b.data) || a.inicio - b.inicio);
  const validos = doMes.filter((a) => !['cancelado', 'faltou'].includes(a.status));
  const r = {
    lista: validos,
    previsto: 0, recebido: 0, aReceber: 0, fiadoAberto: 0,
    atendimentos: validos.length,
    faltas: doMes.filter((a) => a.status === 'faltou').length,
    cancelados: doMes.filter((a) => a.status === 'cancelado').length,
    porServico: new Map(), porPagamento: new Map(),
    sinaisRecebidos: 0, sinaisRetidos: 0,
  };
  for (const a of validos) {
    const v = a.total || 0;
    r.previsto += v;
    if (pago(a)) r.recebido += v;
    else if (a.pagamento === 'fiado') r.fiadoAberto += v;
    else r.aReceber += v;
    r.porPagamento.set(a.pagamento, (r.porPagamento.get(a.pagamento) || 0) + v);
    // o total pode ter sido ajustado à mão: divide entre os serviços na proporção dos preços
    const soma = a.servicos.reduce((t, s) => t + (s.valor || 0), 0);
    for (const s of a.servicos) {
      const parte = soma ? v * (s.valor || 0) / soma : v / a.servicos.length;
      const atual = r.porServico.get(s.id) || { nome: s.nome, cor: estado.servicos.find((x) => x.id === s.id)?.cor ?? s.cor, qtd: 0, valor: 0 };
      atual.qtd++; atual.valor += parte;
      r.porServico.set(s.id, atual);
    }
  }
  for (const c of estado.clientes) for (const m of c.sinais || []) {
    if (!m.data?.startsWith(pref)) continue;
    if (m.tipo === 'recebido') r.sinaisRecebidos += m.valor;
    if (m.tipo === 'retido') r.sinaisRetidos += m.valor;
  }
  r.gastos = gastosDoMes(ano, mes).reduce((t, g) => t + (g.valor || 0), 0);
  r.saldo = r.previsto + r.sinaisRetidos - r.gastos;
  return r;
}

// ---------- bloqueios ----------
export function bloqueioOcorre(b, s) {
  if (s < b.data || (b.excecoes || []).includes(s) || (b.ate && s > b.ate)) return false;
  if (b.repetir === 'semanal') return dataDeStr(s).getDay() === dataDeStr(b.data).getDay();
  if (b.repetir === 'mensal') return dataDeStr(s).getDate() === dataDeStr(b.data).getDate();
  return s === b.data;
}

export const bloqueiosDoDia = (s) => estado.bloqueios.filter((b) => bloqueioOcorre(b, s));

export function salvarBloqueio(b) {
  const i = estado.bloqueios.findIndex((x) => x.id === b.id);
  if (i >= 0) estado.bloqueios[i] = b; else estado.bloqueios.push(b);
  salvar();
}

export function excluirBloqueio(id, soNoDia) {
  const b = estado.bloqueios.find((x) => x.id === id);
  if (!b) return;
  if (soNoDia && b.repetir !== 'nao') (b.excecoes = b.excecoes || []).push(soNoDia);
  else estado.bloqueios = estado.bloqueios.filter((x) => x.id !== id);
  salvar();
}

export function conflitos(data, inicio, duracao, ignorarId) {
  const fim = inicio + duracao;
  const lista = [];
  for (const a of agendamentosDoDia(data)) {
    if (a.id === ignorarId || a.status === 'cancelado') continue;
    if (inicio < a.inicio + a.duracao && a.inicio < fim) lista.push(`${clientePorId(a.clienteId)?.nome || 'Cliente'} (${hora(a.inicio)})`);
  }
  for (const b of bloqueiosDoDia(data)) {
    const bi = b.diaInteiro ? 0 : b.inicio, bf = b.diaInteiro ? 1440 : b.fim;
    if (inicio < bf && bi < fim) lista.push(`bloqueio${b.motivo ? ': ' + b.motivo : ''}`);
  }
  return lista;
}
