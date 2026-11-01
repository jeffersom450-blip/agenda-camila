// Monta as mensagens a partir dos modelos e abre o WhatsApp com o texto pronto (envio é com um toque dela).
import { estado, clientePorId, dataLonga, hora, dinheiro, hojeStr, somarDias, soDigitos, saldoSinal, dataCurta } from './dados.js';

export const VARIAVEIS = {
  '{cliente}': 'primeiro nome',
  '{data}': 'dia do atendimento',
  '{quando}': 'hoje / amanhã + dia',
  '{horario}': 'hora',
  '{servicos}': 'serviços',
  '{valor}': 'valor',
  '{sinal}': 'linha do sinal',
};

function quando(data) {
  const d = dataLonga(data);
  if (data === hojeStr()) return `hoje, ${d}`;
  if (data === somarDias(hojeStr(), 1)) return `amanhã, ${d}`;
  return d;
}

export function montarMensagem(tipo, ag) {
  const c = clientePorId(ag.clienteId);
  const s = saldoSinal(c);
  const linhaSinal = s.valor > 0 ? `✅ Sinal de ${dinheiro(s.valor)} recebido` : '';
  const valores = {
    '{cliente}': (c?.nome || '').split(' ')[0],
    '{data}': tipo === 'cobranca' ? dataCurta(ag.data) : dataLonga(ag.data),
    '{quando}': quando(ag.data),
    '{horario}': hora(ag.inicio),
    '{servicos}': ag.servicos.map((x) => x.nome).join(', ') || '—',
    '{valor}': dinheiro(ag.total),
    '{sinal}': linhaSinal,
  };
  let texto = estado.config.mensagens[tipo] || '';
  for (const [k, v] of Object.entries(valores)) texto = texto.split(k).join(v);
  return texto.replace(/\n{3,}/g, '\n\n').trim();
}

export function numeroWhats(telefone) {
  let d = soDigitos(telefone);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d;
}

// naoAbriu(link) é chamado quando o app do WhatsApp não abre (a tela continua visível)
export function abrirWhats(telefone, texto = '', naoAbriu) {
  const n = numeroWhats(telefone);
  const t = encodeURIComponent(texto);
  const link = `https://wa.me/${n}${t ? '?text=' + t : ''}`;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!ios || estado.config.abrirWhats === 'link') { window.open(link, '_blank'); return; }
  // no iPhone o WhatsApp e o WhatsApp Business atendem o mesmo endereço whatsapp://
  window.location.href = `whatsapp://send?phone=${n}${t ? '&text=' + t : ''}`;
  setTimeout(() => { if (!document.hidden) naoAbriu?.(link, texto); }, 1500);
}
