// ── DADOS MOCK IA ──
const historicoEmpresas = {
  'Tech Solutions S/A':     { atrasosUltimos3m: 3, inadimplencias: 1, pagaMedio: 'no prazo' },
  'Padaria São João Ltda':  { atrasosUltimos3m: 1, inadimplencias: 2, pagaMedio: 'atraso 5d' },
  'Mercearia do Bairro ME': { atrasosUltimos3m: 0, inadimplencias: 0, pagaMedio: 'antecipado' },
  'Construtora Brasil Ltda':{ atrasosUltimos3m: 2, inadimplencias: 0, pagaMedio: 'atraso 2d' },
};
const complexidadeDemanda = {
  'DCTF Mensal':       { horas: 4, peso: 8 },
  'Folha de Pagamento':{ horas: 6, peso: 9 },
  'Apuração Simples':  { horas: 2, peso: 5 },
  'Balancete Mensal':  { horas: 3, peso: 6 },
  'FGTS Mensal':       { horas: 2, peso: 5 },
  'EFD-Contribuições': { horas: 5, peso: 8 },
};
const notificacoesMock = [
  { tipo: 'critico',    titulo: 'Prazo crítico amanhã',       desc: 'DCTF Mensal — Tech Solutions S/A',            page: 'demandas',   lida: false, tempo: 'há 5 min' },
  { tipo: 'atencao',   titulo: '3 demandas em risco',        desc: 'Setor Fiscal — Abr/2026',                     page: 'central-ia', lida: false, tempo: 'há 1h' },
  { tipo: 'financeiro', titulo: 'Alto risco de inadimplência',desc: 'REC-2026-047 — R$ 2.800 — vence em 2 dias',  page: 'recibos',    lida: false, tempo: 'há 2h' },
  { tipo: 'insight',   titulo: 'Insight semanal disponível', desc: 'Gargalo detectado no setor Pessoal',          page: 'insights',   lida: true,  tempo: 'há 3h' },
  { tipo: 'sistema',   titulo: 'Usuário criado',             desc: 'roberto.melo adicionado ao sistema',          page: 'auditoria',  lida: true,  tempo: 'há 1d' },
];
const demandasData = [
  { empresa: 'Tech Solutions S/A',     tipo: 'DCTF Mensal',       setor: 'Fiscal',  status: 'Atrasada',     prazo: '05/04/2026', progresso: 45 },
  { empresa: 'Padaria São João Ltda',  tipo: 'Folha de Pagamento', setor: 'Pessoal', status: 'Em Andamento', prazo: '15/04/2026', progresso: 70 },
  { empresa: 'Mercearia do Bairro ME', tipo: 'Apuração Simples',   setor: 'Fiscal',  status: 'Concluída',    prazo: '10/04/2026', progresso: 100 },
  { empresa: 'Construtora Brasil Ltda',tipo: 'Balancete Mensal',   setor: 'Contábil',status: 'Concluída',    prazo: '20/04/2026', progresso: 100 },
  { empresa: 'Tech Solutions S/A',     tipo: 'Folha de Pagamento', setor: 'Pessoal', status: 'Pendente',     prazo: '15/04/2026', progresso: 0 },
];

// ── FUNÇÕES IA ──
function calcDiasRestantes(prazoStr) {
  const p = prazoStr.split('/');
  const prazo = new Date(+p[2], +p[1] - 1, +p[0]);
  const hoje  = new Date(2026, 3, 10); // data mock fixa (10/04/2026)
  return Math.ceil((prazo - hoje) / 86400000);
}
function calcRiscoIA(empresa, prazo, progresso) {
  const hist = historicoEmpresas[empresa] || { atrasosUltimos3m: 0, inadimplencias: 0 };
  const dias = calcDiasRestantes(prazo);
  let score = 4;
  if (progresso === 100)                      { score = 1; }
  else if (dias <= 0)                         { score = 10; }
  else if (dias <= 2 && progresso < 80)       { score = 9; }
  else if (dias <= 5 && progresso < 50)       { score = 7; }
  else if (hist.atrasosUltimos3m >= 2)        { score = Math.max(score, 6); }
  if (hist.atrasosUltimos3m >= 3) score = Math.min(10, score + 1);
  const label = score >= 8 ? 'Urgente'   : score >= 5 ? 'Moderado'  : 'Tranquilo';
  const cls   = score >= 8 ? 'urgente'   : score >= 5 ? 'moderado'  : 'tranquilo';
  return { score, label, cls, dias };
}
function calcRiscoInadimplencia(empresa) {
  const hist = historicoEmpresas[empresa];
  if (!hist) return { label: 'Baixo risco', cls: 'b-green', tip: 'Sem histórico' };
  const { atrasosUltimos3m, inadimplencias, pagaMedio } = hist;
  if (inadimplencias >= 2 || (inadimplencias >= 1 && atrasosUltimos3m >= 2))
    return { label: 'Alto risco', cls: 'b-red',    tip: `${inadimplencias} inadimplência(s), ${atrasosUltimos3m} atraso(s). Paga: ${pagaMedio}. Score: 8/10.` };
  if (atrasosUltimos3m >= 2 || inadimplencias === 1)
    return { label: 'Atenção',    cls: 'b-yellow', tip: `${atrasosUltimos3m} atraso(s) recentes. Paga: ${pagaMedio}. Score: 5/10.` };
  return { label: 'Baixo risco', cls: 'b-green',   tip: `Sem inadimplências. Paga: ${pagaMedio}. Score: 2/10.` };
}
function getAlertasAtivos() {
  return demandasData.filter(d => { const r = calcRiscoIA(d.empresa, d.prazo, d.progresso); return r.score >= 7; });
}
function atualizarBadgeIA() {
  const qtd       = getAlertasAtivos().length;
  const badge     = document.getElementById('ai-badge');
  const bellBadge = document.getElementById('bell-badge');
  if (badge) badge.textContent = qtd;
  const naoLidas = notificacoesMock.filter(n => !n.lida).length;
  if (bellBadge) { bellBadge.textContent = naoLidas; bellBadge.style.display = naoLidas > 0 ? 'flex' : 'none'; }
}

// ── DRAWER ──
const notifIcones = { critico: '🔴', atencao: '🟠', financeiro: '🟡', insight: '🔵', sistema: '⚪' };
function abrirDrawer() {
  renderNotificacoes();
  document.getElementById('notif-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function fecharDrawer() {
  document.getElementById('notif-drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
}
function renderNotificacoes() {
  const body = document.getElementById('drawer-body');
  if (!body) return;
  const sorted = [...notificacoesMock].sort((a, b) => a.lida - b.lida);
  body.innerHTML = sorted.map(n => `
    <div class="notif-item ${n.lida ? '' : 'unread'}" onclick="irParaNotif(${notificacoesMock.indexOf(n)})">
      <div class="notif-icon ${n.tipo}">${notifIcones[n.tipo] || 'ℹ️'}</div>
      <div class="notif-body">
        <div class="notif-title">${n.titulo}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.tempo}</div>
      </div>
    </div>`).join('');
}
function irParaNotif(idx) {
  notificacoesMock[idx].lida = true;
  fecharDrawer();
  atualizarBadgeIA();
  nav(notificacoesMock[idx].page);
}
function marcarTodasLidas() {
  notificacoesMock.forEach(n => n.lida = true);
  renderNotificacoes();
  atualizarBadgeIA();
  toast('Todas as notificações marcadas como lidas.');
}

// ── TABELA DEMANDAS ──
const statusColors = { 'Concluída': 'b-green', 'Em Andamento': 'b-yellow', 'Pendente': 'b-gray', 'Atrasada': 'b-red' };
const setorColors  = { 'Fiscal': 'b-orange', 'Pessoal': 'b-blue', 'Contábil': 'b-purple' };
function renderDemandasTable(dados) {
  const tbody = document.getElementById('tbody-demandas');
  if (!tbody) return;
  const progCls = p => p === 100 ? 'g' : p >= 50 ? 'y' : 'r';
  tbody.innerHTML = dados.map(d => {
    const r = calcRiscoIA(d.empresa, d.prazo, d.progresso);
    return `<tr style="cursor:pointer;" onclick="openDemandaDetail('${d.empresa.replace(/'/g,"\\'")}','${d.tipo}','${d.setor}','${d.status}','${d.prazo}',${d.progresso})">
      <td class="fw">${d.empresa}</td>
      <td>${d.tipo}</td>
      <td><span class="badge ${setorColors[d.setor] || 'b-gray'}">${d.setor}</span></td>
      <td><span class="badge ${statusColors[d.status] || 'b-gray'}">${d.status}</span></td>
      <td><span class="ai-score ${r.cls}">${r.score} — ${r.label}</span></td>
      <td>${d.prazo}</td>
      <td><div class="prog-wrap" style="width:90px;"><div class="prog-fill ${progCls(d.progresso)}" style="width:${d.progresso}%"></div></div></td>
    </tr>`;
  }).join('');
}
function ordenarPorIA() {
  const sorted = [...demandasData].sort((a, b) => calcRiscoIA(b.empresa, b.prazo, b.progresso).score - calcRiscoIA(a.empresa, a.prazo, a.progresso).score);
  renderDemandasTable(sorted);
  const btn = document.getElementById('btn-ordenar-ia');
  if (btn) { btn.style.background = '#F5F3FF'; btn.style.color = '#7C3AED'; btn.style.borderColor = '#DDD6FE'; }
  toast('Demandas ordenadas por prioridade IA.');
}
function filtrarPorPrioridadeIA() {
  const val = document.getElementById('filtro-prioridade-ia')?.value;
  const btn = document.getElementById('btn-ordenar-ia');
  if (btn) { btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = ''; }
  if (!val) { renderDemandasTable(demandasData); return; }
  renderDemandasTable(demandasData.filter(d => calcRiscoIA(d.empresa, d.prazo, d.progresso).cls === val));
}

// ── ANÁLISE IA NO MODAL ──
function atualizarAnaliseIA() {
  const empresa = document.getElementById('dd-empresa')?.textContent || '';
  const prazo   = document.getElementById('dd-prazo')?.textContent   || '';
  const pct     = parseInt(document.getElementById('dd-prog-pct')?.textContent) || 0;
  if (!empresa || !prazo) return;
  const r    = calcRiscoIA(empresa, prazo, pct);
  const hist = historicoEmpresas[empresa] || { atrasosUltimos3m: 0 };
  const dias = calcDiasRestantes(prazo);
  const absDias = Math.abs(dias);
  const justificativa = dias < 0
    ? `Esta demanda está atrasada há ${absDias} dia(s). A empresa ${empresa} acumulou ${hist.atrasosUltimos3m} atraso(s) nos últimos 3 meses.`
    : `Esta demanda tem prazo em ${absDias} dia(s). A empresa ${empresa} acumulou ${hist.atrasosUltimos3m} atraso(s) nos últimos 3 meses.`;
  const sugestao = r.score >= 8 ? '💡 Recomendamos iniciar imediatamente. Prioridade máxima.'
    : r.score >= 5 ? '💡 Recomendamos iniciar hoje ou amanhã.'
    : '💡 Pode ser planejada para os próximos dias.';
  const scoreEl = document.getElementById('dd-ai-score');
  if (scoreEl) { scoreEl.textContent = `${r.score} — ${r.label}`; scoreEl.className = `ai-score ${r.cls}`; }
  const justEl = document.getElementById('dd-ai-justificativa');
  if (justEl) justEl.textContent = justificativa;
  const sugEl = document.getElementById('dd-ai-sugestao');
  if (sugEl) sugEl.textContent = sugestao;
}

// ── CENTRAL IA ──
function renderPrioridadeSugerida() {
  const lista = document.getElementById('lista-prioridade-ia');
  if (!lista) return;
  const abertas = demandasData.filter(d => d.progresso < 100);
  const sorted  = [...abertas].sort((a, b) => calcRiscoIA(b.empresa, b.prazo, b.progresso).score - calcRiscoIA(a.empresa, a.prazo, a.progresso).score).slice(0, 5);
  lista.innerHTML = sorted.map((d, i) => {
    const r    = calcRiscoIA(d.empresa, d.prazo, d.progresso);
    const hist = historicoEmpresas[d.empresa] || { atrasosUltimos3m: 0 };
    const dias = calcDiasRestantes(d.prazo);
    const motivo  = dias <= 0 ? `Atrasada há ${Math.abs(dias)} dia(s)` : dias <= 2 ? `Prazo em ${dias} dia(s)` : `Score ${r.score} — ${hist.atrasosUltimos3m} atraso(s) histórico`;
    const numBg   = r.score >= 8 ? '#FEE2E2' : r.score >= 5 ? '#FEF9C3' : '#DCFCE7';
    const numClr  = r.score >= 8 ? '#DC2626' : r.score >= 5 ? '#A16207' : '#16A34A';
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-bottom:${i < sorted.length - 1 ? '1px solid #F3F4F6' : 'none'};">
      <div style="width:24px;height:24px;border-radius:50%;background:${numBg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${numClr};flex-shrink:0;">${i + 1}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:600;color:#1E2939;">${d.tipo}</div>
        <div style="font-size:12px;color:#6B7280;">${d.empresa}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:3px;">${motivo}</div>
      </div>
      <span class="ai-score ${r.cls}" style="font-size:11px;padding:3px 8px;flex-shrink:0;">${r.score}</span>
    </div>`;
  }).join('');
}

// ── CONFIG IA ──
function syncPesos() {
  const p = +document.getElementById('cfg-peso-prazo').value;
  const h = +document.getElementById('cfg-peso-hist').value;
  const c = +document.getElementById('cfg-peso-comp').value;
  document.getElementById('cfg-peso-prazo-val').textContent = p + '%';
  document.getElementById('cfg-peso-hist-val').textContent  = h + '%';
  document.getElementById('cfg-peso-comp-val').textContent  = c + '%';
  const warn = document.getElementById('peso-soma-warn');
  if (warn) warn.style.display = (p + h + c !== 100) ? 'block' : 'none';
}
function salvarConfigIA() {
  const cfg = {
    alertas: { d5: document.getElementById('cfg-alerta-5').checked, d3: document.getElementById('cfg-alerta-3').checked, d1: document.getElementById('cfg-alerta-1').checked, threshold3: document.getElementById('cfg-threshold-3').value },
    pesos:   { prazo: document.getElementById('cfg-peso-prazo').value, hist: document.getElementById('cfg-peso-hist').value, comp: document.getElementById('cfg-peso-comp').value },
    inadimp: { threshold: document.getElementById('cfg-inadimp-threshold').value },
  };
  localStorage.setItem('sgec-ia-config', JSON.stringify(cfg));
  nav('central-ia');
  setTimeout(() => toast('Configurações da IA salvas com sucesso!'), 180);
}
function analisarAgora() {
  const el = document.getElementById('ia-ultima-analise');
  if (el) el.textContent = 'Analisando dados...';
  setTimeout(() => {
    atualizarBadgeIA();
    renderPrioridadeSugerida();
    if (el) el.textContent = 'Última análise: agora mesmo';
    toast('Análise concluída! ' + getAlertasAtivos().length + ' alertas ativos.');
  }, 1100);
}

// ── NAVIGATION ──
function nav(pageId) {
  fecharDrawer();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + pageId);
  if (pg) { pg.classList.add('active'); document.getElementById('main-content').scrollTop = 0; }
  document.querySelectorAll('.si').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === pageId) item.classList.add('active');
  });
  const parentMap = { 'cadastro-empresa': 'empresas', 'emitir-recibo': 'recibos', 'registrar-recebimento': 'recebimentos', 'cadastro-usuario': 'usuarios', 'tipos-demanda': 'demandas', 'insights': 'central-ia', 'config-ia': 'central-ia' };
  if (parentMap[pageId]) {
    document.querySelectorAll('.si').forEach(item => { if (item.dataset.page === parentMap[pageId]) item.classList.add('active'); });
  }
  if (pageId === 'demandas')    renderDemandasTable(demandasData);
  if (pageId === 'central-ia')  renderPrioridadeSugerida();
}

// ── LOGIN / LOGOUT ──
function doLogin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').style.display   = 'flex';
  nav('dashboard');
}
function doLogout() {
  document.getElementById('app-layout').style.display   = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.login-input').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });
});

// ── TOAST ──
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✓  ' : type === 'error' ? '✕  ' : 'ℹ  ') + msg;
  t.className = type; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3200);
}

// ── SAVE ──
function save(goTo, msg) { nav(goTo); setTimeout(() => toast(msg), 180); }

// ── MODAL GENÉRICO ──
let _modalAction = null;
function showModal(type, name) {
  if (type === 'cancelar') { openCancelarModal(name); return; }
  const configs = {
    inativar: { title: 'Inativar registro', body: `Deseja inativar <strong>${name}</strong>? O histórico será preservado (RN-003).`, btn: 'Inativar' },
  };
  const c = configs[type] || { title: 'Confirmar', body: 'Tem certeza?', btn: 'Confirmar' };
  document.getElementById('modal-title').textContent     = c.title;
  document.getElementById('modal-body').innerHTML        = c.body;
  document.getElementById('modal-confirm-btn').textContent = c.btn;
  document.getElementById('modal').classList.add('open');
  _modalAction = type;
}
function closeModal()   { document.getElementById('modal').classList.remove('open'); }
function confirmModal() {
  closeModal();
  const msgs = { inativar: 'Registro inativado com sucesso.' };
  toast(msgs[_modalAction] || 'Ação realizada.');
}
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

// ── MODAL CANCELAR RECIBO ──
let _reciboParaCancelar = null;
function openCancelarModal(nomeRecibo) {
  _reciboParaCancelar = nomeRecibo;
  document.getElementById('modal-cancelar-body').innerHTML = `Informe o motivo do cancelamento do recibo <strong>${nomeRecibo}</strong>. O recibo cancelado não valerá como comprovante.`;
  document.getElementById('motivo-cancelamento').value = '';
  document.getElementById('modal-cancelar').classList.add('open');
}
function confirmarCancelamento() {
  const motivo = document.getElementById('motivo-cancelamento').value.trim();
  if (!motivo) { toast('Informe o motivo do cancelamento.', 'error'); return; }
  document.getElementById('modal-cancelar').classList.remove('open');
  toast(`Recibo ${_reciboParaCancelar} cancelado.`);
}
document.getElementById('modal-cancelar').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

// ── MODAL DETALHE DEMANDA ──
const subtasksData = {
  'DCTF Mensal':        ['Apuração PIS/COFINS', 'Transmissão Receita'],
  'Folha de Pagamento': ['Cálculo da folha', 'Homologação', 'Envio eSocial'],
  'Apuração Simples':   ['Geração do DAS'],
  'Balancete Mensal':   [],
};
function openDemandaDetail(empresa, tipo, setor, status, prazo, pct) {
  document.getElementById('dd-title').textContent   = tipo;
  document.getElementById('dd-empresa').textContent = empresa;
  document.getElementById('dd-prazo').textContent   = prazo;
  document.getElementById('dd-meta').innerHTML =
    `<span class="badge ${setorColors[setor]   || 'b-gray'}">${setor}</span>
     <span class="badge ${statusColors[status] || 'b-gray'}">${status}</span>`;
  const fill = document.getElementById('dd-prog-fill');
  const colorClass = pct === 100 ? 'g' : pct >= 50 ? 'y' : 'r';
  fill.style.width = pct + '%'; fill.className = `prog-fill ${colorClass}`;
  document.getElementById('dd-prog-pct').textContent = pct + '%';
  document.getElementById('dd-status-sel').value = status === 'Atrasada' ? 'Em Andamento' : status;
  const subs = subtasksData[tipo] || [];
  const ul   = document.getElementById('dd-subtasks');
  if (subs.length === 0) {
    ul.innerHTML = '<li style="font-size:13px;color:#9CA3AF;font-style:italic;">Sem subtarefas configuradas para este tipo de demanda.</li>';
  } else {
    ul.innerHTML = subs.map((s, i) => `
      <li class="subtask-item">
        <input type="checkbox" id="sub${i}" ${pct === 100 ? 'checked' : i < Math.round(subs.length * (pct / 100)) ? 'checked' : ''}/>
        <label for="sub${i}" class="${pct === 100 ? 'done' : ''}">${s}</label>
      </li>`).join('');
  }
  document.getElementById('modal-demanda').classList.add('open');
  atualizarAnaliseIA();
}
function salvarDemanda() {
  document.getElementById('modal-demanda').classList.remove('open');
  toast('Demanda atualizada com sucesso!');
}
document.getElementById('modal-demanda').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

// ── TABS ──
function switchTab(el, showId) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('act'));
  el.classList.add('act');
  ['tab-demandas', 'tab-tipos'].forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) el2.style.display = id === showId ? 'block' : 'none';
  });
}
function switchEmpresaTab(el, showId) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('act'));
  el.classList.add('act');
  ['empresa-tab-dados', 'empresa-tab-vinculos'].forEach(id => {
    const d = document.getElementById(id);
    if (d) d.style.display = id === showId ? 'block' : 'none';
  });
}
function switchEmpresaTabByName(showId) {
  const tabs = document.querySelectorAll('#page-cadastro-empresa .tab');
  tabs.forEach(t => t.classList.remove('act'));
  ['empresa-tab-dados', 'empresa-tab-vinculos'].forEach((id, i) => {
    const d = document.getElementById(id);
    if (d) d.style.display = id === showId ? 'block' : 'none';
    if (id === showId && tabs[i]) tabs[i].classList.add('act');
  });
}

// ── RECIBO PREVIEW ──
function updatePreview() {
  const v   = document.getElementById('recibo-valor')?.value || '';
  const num = parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const fmt = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const el  = document.getElementById('prev-valor');
  if (el) el.textContent = fmt;
}

// ── MÁSCARA CNPJ ──
function mascaraCNPJ(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/,             '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/,    '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/,            '.$1/$2');
  v = v.replace(/(\d{4})(\d)/,              '$1-$2');
  input.value = v;
}

// ── FORMA "OUTRO" ──
function toggleOutro() {
  const sel = document.getElementById('forma-pag');
  const div = document.getElementById('outro-desc');
  if (div) div.style.display = sel?.value === 'outro' ? 'block' : 'none';
}

// ── ESC fecha modais ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal', 'modal-cancelar', 'modal-demanda'].forEach(id => {
      document.getElementById(id)?.classList.remove('open');
    });
  }
});
