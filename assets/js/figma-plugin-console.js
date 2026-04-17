// ============================================================
// SGEC - Hub Accounting: 13 telas no Figma
// 1. Abra figma.com/design/XdjLgcMrP75AU2ywE2aAVv/Hub-Accouting
// 2. Plugins -> Development -> Open Console
// 3. Cole este arquivo inteiro e pressione Enter
// ============================================================
(async () => {

  // ── CORES (identicas ao index.html) ──────────────────────
  function rgb(h) {
    return {
      r: parseInt(h.slice(0,2),16)/255,
      g: parseInt(h.slice(2,4),16)/255,
      b: parseInt(h.slice(4,6),16)/255
    };
  }
  const C = {
    primary  : rgb('2643FF'),
    title    : rgb('155DFC'),
    subtitle : rgb('002FBB'),
    dark     : rgb('1E2939'),
    mid      : rgb('364153'),
    light    : rgb('6B7280'),
    verylite : rgb('9CA3AF'),
    bg       : rgb('F9FAFB'),
    white    : rgb('FFFFFF'),
    border   : rgb('D1D5DC'),
    border2  : rgb('F3F4F6'),
    green    : rgb('16A34A'),
    yellow   : rgb('D97706'),
    red      : rgb('DC2626'),
    orange   : rgb('EA580C'),
    purple   : rgb('7C3AED'),
    sidebar  : rgb('FFFFFF'),  // sidebar e branca
    hband    : { r:237/255, g:245/255, b:255/255 },
  };
  const BADGE = {
    green  : { bg:rgb('DCFCE7'), text:rgb('16A34A') },
    gray   : { bg:rgb('F3F4F6'), text:rgb('6B7280') },
    blue   : { bg:rgb('DBEAFE'), text:rgb('1D4ED8') },
    yellow : { bg:rgb('FEF9C3'), text:rgb('A16207') },
    orange : { bg:rgb('FFEDD5'), text:rgb('C2410C') },
    red    : { bg:rgb('FEE2E2'), text:rgb('DC2626') },
    purple : { bg:rgb('F5F3FF'), text:rgb('7C3AED') },
  };

  // ── FONTES ───────────────────────────────────────────────
  let SEMI = 'SemiBold';
  try   { await figma.loadFontAsync({family:'Inter', style:'SemiBold'}); }
  catch { SEMI = 'Bold'; await figma.loadFontAsync({family:'Inter', style:'Bold'}); }
  await Promise.all([
    figma.loadFontAsync({family:'Inter',   style:'Regular'}),
    figma.loadFontAsync({family:'Inter',   style:'Medium'}),
    figma.loadFontAsync({family:'Archivo', style:'SemiBold'}),
    figma.loadFontAsync({family:'Archivo', style:'Bold'}),
  ]);
  console.log('Fontes OK. Inter semibold = ' + SEMI);

  // ── PRIMITIVOS ───────────────────────────────────────────
  function mkFrame(name, w, h, fillColor) {
    const f = figma.createFrame();
    f.name = name; f.resize(w, h);
    f.fills = [{type:'SOLID', color: fillColor || C.white}];
    return f;
  }

  function mkRect(p, x, y, w, h, color, radius, opacity) {
    const r = figma.createRectangle();
    r.x=x; r.y=y; r.resize(w, h);
    r.cornerRadius = radius || 0;
    const fill = {type:'SOLID', color};
    if (opacity !== undefined) fill.opacity = opacity;
    r.fills = [fill];
    p.appendChild(r);
    return r;
  }

  function mkLine(p, x, y, w) {
    mkRect(p, x, y, w, 1, C.border2);
  }

  function mkTxt(p, content, x, y, size, color, weight, family, maxW) {
    const fam = family || 'Inter';
    let sty = weight || 'Regular';
    if (fam === 'Inter' && sty === 'SemiBold') sty = SEMI;
    const t = figma.createText();
    t.fontName = {family: fam, style: sty};
    t.characters = String(content);
    t.fontSize = size;
    t.fills = [{type:'SOLID', color}];
    t.x = x; t.y = y;
    if (maxW) { t.textAutoResize = 'HEIGHT'; t.resize(maxW, t.height); }
    p.appendChild(t);
    return t;
  }

  function mkShadow(p, x, y, w, h, radius, a) {
    const r = figma.createRectangle();
    r.x=x; r.y=y; r.resize(w, h);
    r.cornerRadius = radius || 14;
    r.fills = [];
    r.effects = [{type:'DROP_SHADOW', color:{r:0,g:0,b:0,a: a||0.07},
      offset:{x:0,y:4}, radius:6, spread:0, visible:true, blendMode:'NORMAL'}];
    p.appendChild(r);
    return r;
  }

  function mkBadge(p, x, y, label, scheme) {
    const s = BADGE[scheme] || BADGE.gray;
    const w = label.length * 7 + 22;
    mkRect(p, x, y, w, 22, s.bg, 11);
    mkTxt(p, label, x+11, y+5, 11, s.text, 'SemiBold');
    return w;
  }

  function mkStatCard(p, x, y, w, h, label, value, sub, valColor) {
    mkRect(p, x, y, w, h, C.white, 14);
    mkShadow(p, x, y, w, h, 14, 0.06);
    mkTxt(p, label, x+20, y+18, 13, C.light, 'Regular');
    mkTxt(p, value, x+20, y+38, 28, valColor||C.dark, 'Bold', 'Archivo');
    if (sub) mkTxt(p, sub, x+20, y+76, 12, C.verylite, 'Regular');
  }

  function mkInput(p, label, x, y, w, placeholder, required) {
    const lbl = required ? label + ' *' : label;
    mkTxt(p, lbl, x, y, 12, C.mid, 'Medium');
    mkRect(p, x, y+20, w, 44, C.bg, 10);
    const border = figma.createRectangle();
    border.x=x; border.y=y+20; border.resize(w,44);
    border.cornerRadius=10; border.fills=[];
    border.strokes=[{type:'SOLID',color:C.border}]; border.strokeWeight=1;
    p.appendChild(border);
    if (placeholder) mkTxt(p, placeholder, x+13, y+32, 13, C.verylite, 'Regular');
  }

  function mkButton(p, label, x, y, w, secondary) {
    const bg = secondary ? C.white : C.primary;
    mkRect(p, x, y, w, 46, bg, 10);
    if (secondary) {
      const b = figma.createRectangle();
      b.x=x; b.y=y; b.resize(w,46); b.cornerRadius=10; b.fills=[];
      b.strokes=[{type:'SOLID',color:C.border}]; b.strokeWeight=1.5;
      p.appendChild(b);
    }
    const cx = x + Math.round((w - label.length * 7.5) / 2);
    mkTxt(p, label, cx, y+14, 13, secondary ? C.mid : C.white, 'SemiBold', 'Archivo');
  }

  // ── SIDEBAR (branca, como no HTML) ─────────────────────────
  const SW = 250;
  const NAV_ITEMS = [
    {label:'Dashboard',        key:'dashboard'},
    {label:'Empresas',         key:'empresas'},
    {label:'Demandas',         key:'demandas'},
    {label:'Recibos',          key:'recibos'},
    {label:'Recebimentos',     key:'recebimentos'},
    {label:'Usuarios',         key:'usuarios'},
    {label:'Auditoria',        key:'auditoria'},
  ];

  function mkSidebar(p, activeKey) {
    // fundo branco
    mkRect(p, 0, 0, SW, 1024, C.white);
    // borda direita
    mkRect(p, SW-1, 0, 1, 1024, {r:0,g:0,b:0}, 0, 0.09);
    // logo
    mkTxt(p, 'Hub Accounting', 20, 28, 20, C.primary, 'Bold', 'Archivo');
    mkTxt(p, 'SISTEMA DE GESTAO CONTABIL', 20, 54, 10, C.verylite, 'Regular');
    mkLine(p, 0, 74, SW);

    // itens nav
    NAV_ITEMS.forEach((item, i) => {
      const iy = 88 + i * 58;
      const isActive = item.key === activeKey;
      if (isActive) mkRect(p, 7, iy, SW-14, 50, C.primary, 10);
      mkTxt(p, item.label, 44, iy+15, 15, isActive ? C.white : C.dark, 'SemiBold', 'Archivo');
    });

    // footer
    mkLine(p, 0, 958, SW);
    mkRect(p, 14, 970, 36, 36, rgb('EFF6FF'), 18);
    mkTxt(p, 'JS', 22, 980, 12, C.primary, 'Bold', 'Archivo');
    mkTxt(p, 'Joao Silva', 58, 970, 13, C.dark, 'SemiBold');
    mkTxt(p, 'Administrador', 58, 987, 11, C.verylite, 'Regular');
    mkRect(p, SW-46, 972, 32, 32, rgb('FEF2F2'), 8);
    mkTxt(p, 'Sair', SW-40, 980, 12, C.red, 'Medium');
  }

  // ── HEADER BAND ────────────────────────────────────────────
  function mkHeader(p, title, subtitle) {
    mkRect(p, SW, 0, 1440-SW, 160, C.hband);
    mkLine(p, SW, 160, 1440-SW);
    mkTxt(p, title,    SW+28, 44, 48, C.title,    'SemiBold', 'Archivo');
    mkTxt(p, subtitle, SW+28, 104, 18, C.subtitle, 'SemiBold', 'Archivo');
  }

  // ── TABELA ─────────────────────────────────────────────────
  function mkTableHead(p, y, cols) {
    mkRect(p, SW, y, 1440-SW, 44, C.bg);
    mkLine(p, SW, y+44, 1440-SW);
    let x = SW+20;
    cols.forEach(col => {
      mkTxt(p, col.label, x, y+14, 13, C.mid, 'SemiBold');
      x += col.w;
    });
  }

  function mkTableRow(p, y, cols, cells) {
    mkLine(p, SW, y+48, 1440-SW);
    let x = SW+20;
    cols.forEach((col, i) => {
      const cell = cells[i];
      if (!cell) { x += col.w; return; }
      if (cell.badge) {
        mkBadge(p, x, y+14, cell.badge, cell.color);
      } else {
        const bold = i === 0;
        mkTxt(p, cell, x, y+16, 13, bold ? C.dark : rgb('4A5565'), bold ? 'SemiBold' : 'Regular', bold ? 'Archivo' : 'Inter');
      }
      x += col.w;
    });
  }

  // ── PAGINACAO ───────────────────────────────────────────────
  function mkPagination(p, y, info) {
    mkLine(p, SW, y, 1440-SW);
    mkTxt(p, info, SW+20, y+14, 13, C.light, 'Regular');
    const pgY = y+8;
    ['<','1','2','3','>'].forEach((lbl, i) => {
      const isAct = lbl === '1';
      mkRect(p, 1260+i*38, pgY, 32, 32, isAct ? C.primary : C.white, 7);
      if (!isAct) {
        const b = figma.createRectangle();
        b.x=1260+i*38; b.y=pgY; b.resize(32,32); b.cornerRadius=7; b.fills=[];
        b.strokes=[{type:'SOLID',color:C.border2}]; b.strokeWeight=1; p.appendChild(b);
      }
      mkTxt(p, lbl, 1268+i*38, pgY+9, 13, isAct ? C.white : C.mid, 'Regular');
    });
  }

  // ── CONTENT AREA (wrapper de posicao) ──────────────────────
  const CX = SW+28;  // content X
  const CY = 184;    // content Y (abaixo do header band 160 + padding 24)

  // ============================================================
  // TELA 01 — LOGIN
  // ============================================================
  async function mkLogin() {
    const f = mkFrame('01 - Login', 1440, 1024, C.primary);

    const card = figma.createRectangle();
    card.x=450; card.y=262; card.resize(540,500);
    card.cornerRadius=20; card.fills=[{type:'SOLID',color:C.white}];
    card.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.15},offset:{x:0,y:8},radius:24,spread:0,visible:true,blendMode:'NORMAL'}];
    f.appendChild(card);

    mkTxt(f, 'Login', 520, 298, 48, C.title, 'Bold', 'Archivo');
    mkInput(f, 'E-mail', 490, 368, 460, 'exemplo@contage.com.br');
    mkInput(f, 'Senha',  490, 460, 460, '');

    // campo senha com asteriscos
    mkTxt(f, '* * * * * * * *', 503, 492, 14, C.verylite, 'Regular');
    mkButton(f, 'Entrar', 490, 554, 460);
    mkTxt(f, '(c) 2026 Hub Accounting - SGEC', 550, 660, 12, C.verylite, 'Regular');
    figma.currentPage.appendChild(f); console.log('ok Login');
    return f;
  }

  // ============================================================
  // TELA 02 — DASHBOARD
  // ============================================================
  async function mkDashboard() {
    const f = mkFrame('02 - Dashboard', 1440, 1024);
    mkSidebar(f, 'dashboard');
    mkHeader(f, 'Dashboard', 'Visao geral da operacao');

    // Competencia selector
    mkTxt(f, 'Competencia:', 1200, 80, 13, C.light, 'Regular');
    mkRect(f, 1300, 68, 116, 38, C.bg, 10);
    const selB = figma.createRectangle();
    selB.x=1300; selB.y=68; selB.resize(116,38); selB.cornerRadius=10; selB.fills=[];
    selB.strokes=[{type:'SOLID',color:C.border}]; selB.strokeWeight=1; f.appendChild(selB);
    mkTxt(f, 'Abril / 2026', 1310, 78, 13, C.mid, 'Regular');

    // KPI cards
    const kpis = [
      {l:'Empresas Ativas',       v:'34',  s:'+ 2 este mes',        c:C.primary},
      {l:'Demandas Concluidas',   v:'127', s:'de 160 geradas',       c:C.green},
      {l:'Demandas Pendentes',    v:'24',  s:'8 com prazo hoje',     c:C.yellow},
      {l:'Em Atraso',             v:'9',   s:'+ 3 vs. mes anterior', c:C.red},
    ];
    kpis.forEach((k,i) => mkStatCard(f, CX+i*290, CY, 270, 100, k.l, k.v, k.s, k.c));

    // -- Grafico: Demandas por Setor --
    const gcx = CX, gcy = CY+124;
    mkRect(f, gcx, gcy, 560, 220, C.white, 14);
    mkShadow(f, gcx, gcy, 560, 220);
    mkTxt(f, 'Demandas por Setor - Abr/2026', gcx+20, gcy+20, 16, C.dark, 'SemiBold', 'Archivo');
    const bars = [{l:'Fiscal',v:58,o:0.97},{l:'Pessoal',v:47,o:0.7},{l:'Contabil',v:32,o:0.55},{l:'Outros',v:23,o:0.4}];
    bars.forEach((b,i) => {
      const bh = Math.round(b.v * 1.6);
      mkRect(f, gcx+60+i*110, gcy+170-bh, 70, bh, C.primary, 4, b.o);
      mkTxt(f, String(b.v),   gcx+78+i*110, gcy+164-bh, 12, C.primary, 'SemiBold');
      mkTxt(f, b.l, gcx+60+i*110, gcy+180, 11, C.light, 'Regular');
    });

    // -- Grafico: Recebimentos do Mes --
    const gcx2 = CX+580, gcy2 = CY+124;
    mkRect(f, gcx2, gcy2, 580, 220, C.white, 14);
    mkShadow(f, gcx2, gcy2, 580, 220);
    mkTxt(f, 'Recebimentos do Mes', gcx2+20, gcy2+20, 16, C.dark, 'SemiBold', 'Archivo');
    const legend = [
      {l:'Quitado - R$ 21.300', c:C.primary},
      {l:'Parcial - R$ 7.100',  c:C.green},
      {l:'Pendente - R$ 9.600', c:C.border},
    ];
    legend.forEach((leg,i) => {
      mkRect(f, gcx2+230, gcy2+60+i*36, 12, 12, leg.c, 6);
      mkTxt(f, leg.l, gcx2+250, gcy2+58+i*36, 13, rgb('4A5565'), 'Regular');
    });
    // donut simples
    mkRect(f, gcx2+40, gcy2+55, 120, 120, C.bg, 60);
    mkTxt(f, 'R$',     gcx2+87, gcy2+95, 12, C.dark, 'SemiBold', 'Archivo');
    mkTxt(f, '28,4k',  gcx2+82, gcy2+112, 11, C.light, 'Regular');

    // -- Tabela Demandas em Atraso --
    const ty = CY+370;
    mkRect(f, CX, ty, 1162, 220, C.white, 14);
    mkShadow(f, CX, ty, 1162, 220);
    mkTxt(f, 'Demandas em Atraso', CX+20, ty+20, 16, C.dark, 'SemiBold', 'Archivo');
    mkButton(f, 'Ver todas', 1292, ty+16, 100, true);

    const atCols = [{label:'Empresa',w:240},{label:'Demanda',w:200},{label:'Setor',w:130},{label:'Prazo',w:140},{label:'Atraso',w:120}];
    mkTableHead(f, ty+52, atCols);
    const atRows = [
      ['Tech Solutions S/A',    'DCTF Mensal',        {badge:'Fiscal',   color:'orange'}, '05/04/2026', {badge:'4 dias', color:'red'}],
      ['Padaria Sao Joao Ltda', 'Folha de Pagamento', {badge:'Pessoal',  color:'blue'},   '07/04/2026', {badge:'2 dias', color:'red'}],
      ['Mercearia do Bairro ME','Apuracao Simples',   {badge:'Fiscal',   color:'orange'}, '08/04/2026', {badge:'1 dia',  color:'yellow'}],
    ];
    atRows.forEach((row,i) => mkTableRow(f, ty+96+i*48, atCols, row));

    figma.currentPage.appendChild(f); console.log('ok Dashboard');
    return f;
  }

  // ============================================================
  // TELA 03 — EMPRESAS
  // ============================================================
  async function mkEmpresas() {
    const f = mkFrame('03 - Empresas', 1440, 1024);
    mkSidebar(f, 'empresas');
    mkHeader(f, 'Empresas', 'Gerenciar empresas atendidas pelo escritorio');
    mkButton(f, '+ Nova Empresa', 1240, 168, 160);

    // filter bar
    const fby = CY+20;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    const fb = figma.createRectangle();
    fb.x=CX; fb.y=fby; fb.resize(1162,60); fb.cornerRadius=14; fb.fills=[];
    fb.strokes=[{type:'SOLID',color:{r:0,g:0,b:0}}]; fb.strokeWeight=1; fb.opacity=0.13;
    f.appendChild(fb);
    mkInput(f, '', CX+12, fby+8, 400, 'Buscar por nome ou CNPJ...');
    mkInput(f, '', CX+428, fby+8, 200, 'Todos os regimes');
    mkInput(f, '', CX+644, fby+8, 180, 'Todos os status');

    // tabela
    const cols = [
      {label:'Empresa',w:220},{label:'CNPJ',w:180},{label:'Regime',w:170},
      {label:'Setor',w:130},{label:'Status',w:130},{label:'Acoes',w:100}
    ];
    mkTableHead(f, fby+80, cols);
    const rows = [
      ['Tech Solutions S/A',    '12.345.678/0001-90', 'Lucro Presumido',    'Servicos',  {badge:'Ativo',   color:'green'}, '...'],
      ['Padaria Sao Joao Ltda', '98.765.432/0001-11', 'Simples Nacional',   'Comercio',  {badge:'Ativo',   color:'green'}, '...'],
      ['Mercearia do Bairro ME','55.444.333/0001-22', 'MEI',                'Comercio',  {badge:'Ativo',   color:'green'}, '...'],
      ['Construtora Brasil Ltda','33.222.111/0001-44','Lucro Real',         'Construcao',{badge:'Ativo',   color:'green'}, '...'],
      ['Auto Pecas Rapida ME',  '77.888.999/0001-55', 'Simples Nacional',   'Comercio',  {badge:'Inativo', color:'gray'},  '...'],
    ];
    rows.forEach((row,i) => mkTableRow(f, fby+124+i*50, cols, row));
    mkPagination(f, fby+376, 'Mostrando 5 de 34 empresas');

    figma.currentPage.appendChild(f); console.log('ok Empresas');
    return f;
  }

  // ============================================================
  // TELA 04 — CADASTRO DE EMPRESA
  // ============================================================
  async function mkCadastroEmpresa() {
    const f = mkFrame('04 - Cadastro de Empresa', 1440, 1024);
    mkSidebar(f, 'empresas');
    mkHeader(f, 'Nova Empresa', 'Cadastrar empresa atendida');

    // breadcrumb
    mkTxt(f, 'Empresas > Nova Empresa', CX, CY+4, 13, C.verylite, 'Regular');

    // tabs
    const tabY = CY+28;
    mkRect(f, CX, tabY, 300, 38, C.border2, 12);
    mkRect(f, CX+4, tabY+4, 146, 30, C.white, 9);
    mkTxt(f, 'Dados Cadastrais', CX+14, tabY+10, 13, C.primary, 'SemiBold');
    mkTxt(f, 'Vinculos de Demanda', CX+162, tabY+10, 13, C.light, 'Medium');

    // card form
    const fy = tabY+54;
    mkRect(f, CX, fy, 1162, 540, C.white, 14);
    mkShadow(f, CX, fy, 1162, 540);
    mkTxt(f, 'Identificacao', CX+32, fy+28, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, CX+32, fy+52, 1100);

    const inputs = [
      {l:'Razao Social',       x:CX+32,  y:fy+64,  w:520, ph:'Ex: Tech Solutions S/A', req:true},
      {l:'Nome Fantasia',      x:CX+572, y:fy+64,  w:520, ph:'Ex: TechSol'},
      {l:'CNPJ',               x:CX+32,  y:fy+168, w:280, ph:'00.000.000/0000-00', req:true},
      {l:'Regime Tributario',  x:CX+332, y:fy+168, w:280, ph:'Selecionar...', req:true},
      {l:'Porte',              x:CX+632, y:fy+168, w:240, ph:'ME - Microempresa'},
      {l:'Setor Principal',    x:CX+892, y:fy+168, w:200, ph:'Comercio'},
      {l:'Data Inicio Contrato',x:CX+32, y:fy+272, w:280, ph:'DD/MM/AAAA'},
      {l:'Responsavel Contabil',x:CX+332,y:fy+272, w:280, ph:'Maria Santos'},
    ];
    inputs.forEach(inp => mkInput(f, inp.l, inp.x, inp.y, inp.w, inp.ph, inp.req));

    mkTxt(f, 'Observacoes', CX+32, fy+376, 12, C.mid, 'Medium');
    mkRect(f, CX+32, fy+396, 1095, 80, C.bg, 10);

    // status
    mkTxt(f, 'Situacao *', CX+32, fy+496, 12, C.mid, 'Medium');
    mkRect(f, CX+32, fy+514, 100, 36, rgb('DCFCE7'), 8);
    mkTxt(f, 'Ativa', CX+48, fy+524, 13, C.green, 'SemiBold');
    mkRect(f, CX+146, fy+514, 100, 36, C.bg, 8);
    mkTxt(f, 'Inativa', CX+162, fy+524, 13, C.light, 'Regular');

    // actions
    mkButton(f, 'Cancelar', 1016, fy+560, 140, true);
    mkButton(f, 'Proximo: Vinculos ->', 1172, fy+560, 220);

    figma.currentPage.appendChild(f); console.log('ok Cadastro Empresa');
    return f;
  }

  // ============================================================
  // TELA 05 — DEMANDAS
  // ============================================================
  async function mkDemandas() {
    const f = mkFrame('05 - Demandas', 1440, 1024);
    mkSidebar(f, 'demandas');
    mkHeader(f, 'Demandas', 'Gerenciar demandas por competencia');

    // tabs Lista / Tipos
    const tabY = CY;
    mkRect(f, CX, tabY, 220, 38, C.border2, 12);
    mkRect(f, CX+4, tabY+4, 106, 30, C.white, 9);
    mkTxt(f, 'Lista', CX+30, tabY+10, 13, C.primary, 'SemiBold');
    mkTxt(f, 'Tipos de Demanda', CX+120, tabY+10, 13, C.light, 'Medium');

    // filtros
    const fby = tabY+52;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    mkInput(f, '', CX+12, fby+8, 170, 'Abr/2026');
    mkInput(f, '', CX+198, fby+8, 170, 'Todos os setores');
    mkInput(f, '', CX+384, fby+8, 170, 'Todos os status');
    mkButton(f, 'Filtrar', CX+570, fby+8, 90);

    // KPI cards
    const ky = fby+80;
    mkStatCard(f, CX,     ky, 270, 90, 'Total',        '160', '', C.dark);
    mkStatCard(f, CX+290, ky, 270, 90, 'Concluidas',   '127', '', C.green);
    mkStatCard(f, CX+580, ky, 270, 90, 'Em Andamento', '24',  '', C.yellow);
    mkStatCard(f, CX+870, ky, 270, 90, 'Atrasadas',    '9',   '', C.red);

    // tabela
    const ty = ky+110;
    mkRect(f, CX, ty, 1162, 370, C.white, 14);
    mkShadow(f, CX, ty, 1162, 370);
    const cols = [
      {label:'Empresa',w:200},{label:'Tipo de Demanda',w:180},{label:'Setor',w:120},
      {label:'Status',w:130},{label:'Prazo',w:120},{label:'Progresso',w:100}
    ];
    mkTableHead(f, ty, cols);
    const rows = [
      ['Tech Solutions S/A',    'DCTF Mensal',       {badge:'Fiscal',   color:'orange'},{badge:'Atrasada',    color:'red'},   '05/04/2026','45%'],
      ['Padaria Sao Joao Ltda', 'Folha de Pagamento',{badge:'Pessoal',  color:'blue'},  {badge:'Em Andamento',color:'yellow'},'15/04/2026','70%'],
      ['Mercearia do Bairro ME','Apuracao Simples',  {badge:'Fiscal',   color:'orange'},{badge:'Concluida',   color:'green'}, '10/04/2026','100%'],
      ['Construtora Brasil Ltda','Balancete Mensal', {badge:'Contabil', color:'purple'},{badge:'Concluida',   color:'green'}, '20/04/2026','100%'],
      ['Tech Solutions S/A',    'Folha de Pagamento',{badge:'Pessoal',  color:'blue'},  {badge:'Pendente',    color:'gray'},  '15/04/2026','0%'],
    ];
    rows.forEach((row,i) => mkTableRow(f, ty+44+i*52, cols, row));
    mkPagination(f, ty+316, 'Mostrando 5 de 160 demandas');

    figma.currentPage.appendChild(f); console.log('ok Demandas');
    return f;
  }

  // ============================================================
  // TELA 06 — RECIBOS
  // ============================================================
  async function mkRecibos() {
    const f = mkFrame('06 - Recibos', 1440, 1024);
    mkSidebar(f, 'recibos');
    mkHeader(f, 'Recibos', 'Honorarios de servicos contabeis');
    mkButton(f, '+ Emitir Recibo', 1232, 168, 168);

    const fby = CY+20;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    mkInput(f, '', CX+12, fby+8, 360, 'Buscar por empresa ou n. do recibo...');
    mkInput(f, '', CX+388, fby+8, 160, 'Abr/2026');
    mkInput(f, '', CX+564, fby+8, 180, 'Todos os status');

    const cols = [
      {label:'N. Recibo',w:160},{label:'Empresa',w:220},{label:'Competencia',w:130},
      {label:'Emissao',w:130},{label:'Valor',w:130},{label:'Status',w:130},{label:'Acoes',w:80}
    ];
    mkTableHead(f, fby+80, cols);
    const rows = [
      ['REC-2026-047','Tech Solutions S/A',    'Abr/2026','09/04/2026','R$ 2.800,00',{badge:'Pendente', color:'yellow'},'...'],
      ['REC-2026-046','Padaria Sao Joao Ltda', 'Abr/2026','08/04/2026','R$ 1.200,00',{badge:'Parcial',  color:'orange'},'...'],
      ['REC-2026-045','Mercearia do Bairro ME','Abr/2026','07/04/2026','R$ 850,00',  {badge:'Quitado',  color:'green'}, '...'],
      ['REC-2026-044','Construtora Brasil Ltda','Mar/2026','31/03/2026','R$ 4.500,00',{badge:'Quitado',  color:'green'}, '...'],
      ['REC-2026-039','Construtora Brasil Ltda','Mar/2026','25/03/2026','R$ 4.500,00',{badge:'Cancelado',color:'gray'},  '...'],
    ];
    rows.forEach((row,i) => mkTableRow(f, fby+124+i*50, cols, row));
    mkPagination(f, fby+376, 'Mostrando 5 de 47 recibos');

    figma.currentPage.appendChild(f); console.log('ok Recibos');
    return f;
  }

  // ============================================================
  // TELA 07 — EMITIR RECIBO
  // ============================================================
  async function mkEmitirRecibo() {
    const f = mkFrame('07 - Emitir Recibo', 1440, 1024);
    mkSidebar(f, 'recibos');
    mkHeader(f, 'Emitir Recibo', 'Honorarios de servicos contabeis');

    mkTxt(f, 'Recibos > Emitir Novo Recibo', CX, CY+4, 13, C.verylite, 'Regular');

    // form (esquerda)
    const fx = CX, fy = CY+30;
    mkRect(f, fx, fy, 680, 660, C.white, 14);
    mkShadow(f, fx, fy, 680, 660);
    mkTxt(f, 'Dados do Recibo', fx+28, fy+24, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, fx+28, fy+48, 620);
    mkTxt(f, 'Numero do Recibo', fx+28, fy+60, 12, C.mid, 'Medium');
    mkRect(f, fx+28, fy+78, 620, 44, rgb('F3F4F6'), 10);
    mkTxt(f, 'REC-2026-048', fx+40, fy+91, 13, C.light, 'Regular');
    mkTxt(f, 'Numeracao sequencial automatica por escritorio/ano (RN-005)', fx+28, fy+128, 11, C.verylite, 'Regular');

    mkInput(f, 'Empresa',       fx+28, fy+148, 300, 'Selecionar empresa...', true);
    mkInput(f, 'Competencia',   fx+348, fy+148, 300, 'Abr/2026', true);
    mkInput(f, 'Data Emissao',  fx+28, fy+252, 300, '09/04/2026', true);
    mkInput(f, 'Data Vencimento',fx+348,fy+252, 300, '20/04/2026', true);
    mkInput(f, 'Valor dos Honorarios (R$)', fx+28, fy+356, 620, '0,00', true);

    mkTxt(f, 'Descricao dos Servicos', fx+28, fy+460, 12, C.mid, 'Medium');
    mkRect(f, fx+28, fy+480, 620, 80, C.bg, 10);

    mkLine(f, fx+28, fy+574, 620);
    mkTxt(f, 'Forma de Pagamento', fx+28, fy+582, 17, C.dark, 'SemiBold', 'Archivo');
    mkInput(f, 'Forma',  fx+28, fy+600, 300, 'Selecionar...', true);
    mkInput(f, 'Chave / Dados', fx+348, fy+600, 300, 'Ex: contage@escritorio.com.br');

    mkButton(f, 'Cancelar',     fx+292, fy+696, 140, true);
    mkButton(f, 'Emitir Recibo',fx+448, fy+696, 200);

    // preview (direita)
    const px = fx+704, py = fy;
    mkRect(f, px, py, 430, 660, C.white, 14);
    mkShadow(f, px, py, 430, 660);
    // header azul do preview
    mkRect(f, px, py, 430, 80, C.primary, 0);
    const prevTopR = figma.createRectangle();
    prevTopR.x=px; prevTopR.y=py; prevTopR.resize(430,80);
    prevTopR.cornerRadius=14; prevTopR.fills=[{type:'SOLID',color:C.primary}];
    f.appendChild(prevTopR);
    mkTxt(f, 'PRE-VISUALIZACAO', px+20, py+14, 11, {r:0.8,g:0.85,b:1}, 'Regular');
    mkTxt(f, 'REC-2026-048', px+20, py+34, 20, C.white, 'Bold', 'Archivo');
    // body preview
    const pr = [
      ['Empresa',     '- selecionar -'],
      ['Competencia', 'Abril / 2026'],
      ['Emissao',     '09/04/2026'],
      ['Vencimento',  '20/04/2026'],
    ];
    pr.forEach((row,i) => {
      mkTxt(f, row[0], px+20, py+98+i*34, 12, C.light, 'Regular');
      mkTxt(f, row[1], px+140, py+98+i*34, 13, C.dark, 'SemiBold');
    });
    mkLine(f, px+20, py+240, 388);
    mkRect(f, px, py+252, 430, 60, C.bg);
    mkTxt(f, 'Total', px+20, py+270, 14, C.mid, 'SemiBold');
    mkTxt(f, 'R$ 0,00', px+280, py+262, 24, C.primary, 'Bold', 'Archivo');
    mkButton(f, 'PDF', px+20, py+330, 180, true);
    mkButton(f, 'Compartilhar', px+216, py+330, 194);

    figma.currentPage.appendChild(f); console.log('ok Emitir Recibo');
    return f;
  }

  // ============================================================
  // TELA 08 — RECEBIMENTOS
  // ============================================================
  async function mkRecebimentos() {
    const f = mkFrame('08 - Recebimentos', 1440, 1024);
    mkSidebar(f, 'recebimentos');
    mkHeader(f, 'Recebimentos', 'Controle de pagamentos recebidos');
    mkButton(f, '+ Registrar Recebimento', 1168, 168, 232);

    const kpis = [
      {l:'Total Recebido no Mes',v:'R$ 21.300',s:'',c:C.primary},
      {l:'Pagamentos Parciais',  v:'R$ 7.100', s:'',c:C.yellow},
      {l:'Em Aberto',            v:'R$ 9.600', s:'',c:C.red},
      {l:'Recibos Quitados',     v:'18',        s:'',c:C.green},
    ];
    kpis.forEach((k,i) => mkStatCard(f, CX+i*290, CY, 270, 90, k.l, k.v, k.s, k.c));

    const fby = CY+110;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    mkInput(f, '', CX+12, fby+8, 360, 'Buscar por empresa ou recibo...');
    mkInput(f, '', CX+388, fby+8, 150, '01/04/2026');
    mkInput(f, '', CX+554, fby+8, 150, '30/04/2026');
    mkInput(f, '', CX+720, fby+8, 180, 'Todas as formas');

    const cols = [
      {label:'N. Recibo',w:150},{label:'Empresa',w:230},{label:'Data Pagamento',w:140},
      {label:'Valor Pago',w:140},{label:'Forma',w:130},{label:'Situacao',w:130},{label:'Acoes',w:80}
    ];
    mkTableHead(f, fby+80, cols);
    const rows = [
      ['REC-2026-045','Mercearia do Bairro ME','07/04/2026','R$ 850,00',  {badge:'PIX',         color:'blue'},  {badge:'Quitado',color:'green'},'...'],
      ['REC-2026-046','Padaria Sao Joao Ltda', '08/04/2026','R$ 600,00',  {badge:'Dinheiro',    color:'green'}, {badge:'Parcial',color:'orange'},'...'],
      ['REC-2026-044','Construtora Brasil Ltda','02/04/2026','R$ 4.500,00',{badge:'Transferencia',color:'purple'},{badge:'Quitado',color:'green'},'...'],
      ['REC-2026-043','Tech Solutions S/A',    '28/03/2026','R$ 2.800,00',{badge:'PIX',         color:'blue'},  {badge:'Quitado',color:'green'},'...'],
    ];
    rows.forEach((row,i) => mkTableRow(f, fby+124+i*50, cols, row));
    mkPagination(f, fby+326, 'Mostrando 4 de 38 recebimentos');

    figma.currentPage.appendChild(f); console.log('ok Recebimentos');
    return f;
  }

  // ============================================================
  // TELA 09 — REGISTRAR RECEBIMENTO
  // ============================================================
  async function mkRegistrarRecebimento() {
    const f = mkFrame('09 - Registrar Recebimento', 1440, 1024);
    mkSidebar(f, 'recebimentos');
    mkHeader(f, 'Registrar Recebimento', 'Lancar pagamento vinculado a recibo');

    mkTxt(f, 'Recebimentos > Novo Lancamento', CX, CY+4, 13, C.verylite, 'Regular');

    const fy = CY+30;
    mkRect(f, CX, fy, 760, 600, C.white, 14);
    mkShadow(f, CX, fy, 760, 600);

    mkTxt(f, 'Vinculo com Recibo', CX+28, fy+24, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, CX+28, fy+48, 700);
    // info box
    mkRect(f, CX+28, fy+60, 700, 50, rgb('EFF6FF'), 10);
    mkTxt(f, '[i] Todo recebimento deve estar vinculado a um recibo valido. A soma nao pode exceder o valor do recibo (RN-007).', CX+40, fy+73, 12, rgb('1E40AF'), 'Regular', 'Inter', 676);

    mkInput(f, 'Recibo', CX+28, fy+124, 340, 'Selecionar recibo...', true);
    mkInput(f, 'Saldo em Aberto', CX+388, fy+124, 340, 'R$ 2.800,00');

    mkLine(f, CX+28, fy+232, 700);
    mkTxt(f, 'Dados do Pagamento', CX+28, fy+244, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, CX+28, fy+268, 700);

    mkInput(f, 'Data do Recebimento', CX+28, fy+280, 340, '09/04/2026', true);
    mkInput(f, 'Valor Recebido (R$)', CX+388, fy+280, 340, '0,00', true);
    mkInput(f, 'Forma de Pagamento', CX+28, fy+384, 340, 'Selecionar...', true);
    mkTxt(f, 'Observacoes', CX+28, fy+488, 12, C.mid, 'Medium');
    mkRect(f, CX+28, fy+508, 700, 60, C.bg, 10);

    mkButton(f, 'Cancelar',           CX+450, fy+590, 140, true);
    mkButton(f, 'Registrar Pagamento',CX+606, fy+590, 210);

    figma.currentPage.appendChild(f); console.log('ok Registrar Recebimento');
    return f;
  }

  // ============================================================
  // TELA 10 — USUARIOS
  // ============================================================
  async function mkUsuarios() {
    const f = mkFrame('10 - Usuarios', 1440, 1024);
    mkSidebar(f, 'usuarios');
    mkHeader(f, 'Usuarios', 'Gerenciar usuarios do escritorio');
    mkButton(f, '+ Novo Usuario', 1248, 168, 152);

    const fby = CY+20;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    mkInput(f, '', CX+12, fby+8, 380, 'Buscar por nome ou e-mail...');
    mkInput(f, '', CX+408, fby+8, 220, 'Todos os perfis');
    mkInput(f, '', CX+644, fby+8, 160, 'Todos os status');

    const cols = [
      {label:'Nome',w:220},{label:'E-mail',w:280},{label:'Perfil / Setor',w:230},
      {label:'Status',w:130},{label:'Acoes',w:80}
    ];
    mkTableHead(f, fby+80, cols);
    const rows = [
      ['Joao Silva',     'joao.silva@contage.com.br',    {badge:'Administrador',          color:'purple'},{badge:'Ativo',  color:'green'},'...'],
      ['Maria Santos',   'maria.santos@contage.com.br',  {badge:'Colaborador - Pessoal',  color:'orange'},{badge:'Ativo',  color:'green'},'...'],
      ['Carlos Oliveira','carlos.oliveira@contage.com.br',{badge:'Colaborador - Fiscal',  color:'green'}, {badge:'Inativo',color:'gray'}, '...'],
      ['Ana Lima',       'ana.lima@contage.com.br',      {badge:'Colab. Contabil+Fiscal', color:'blue'},  {badge:'Ativo',  color:'green'},'...'],
      ['Roberto Melo',   'roberto.melo@contage.com.br',  {badge:'Colaborador - Pessoal',  color:'orange'},{badge:'Ativo',  color:'green'},'...'],
    ];
    rows.forEach((row,i) => mkTableRow(f, fby+124+i*50, cols, row));
    mkPagination(f, fby+376, 'Mostrando 5 de 12 usuarios');

    figma.currentPage.appendChild(f); console.log('ok Usuarios');
    return f;
  }

  // ============================================================
  // TELA 11 — CADASTRO DE USUARIO
  // ============================================================
  async function mkCadastroUsuario() {
    const f = mkFrame('11 - Cadastro de Usuario', 1440, 1024);
    mkSidebar(f, 'usuarios');
    mkHeader(f, 'Novo Usuario', 'Cadastrar usuario no escritorio');

    mkTxt(f, 'Usuarios > Novo Usuario', CX, CY+4, 13, C.verylite, 'Regular');

    const fy = CY+30;
    mkRect(f, CX, fy, 800, 640, C.white, 14);
    mkShadow(f, CX, fy, 800, 640);

    mkTxt(f, 'Dados do Usuario', CX+28, fy+24, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, CX+28, fy+48, 740);
    mkInput(f, 'Nome completo', CX+28, fy+60, 360, 'Ex: Maria Santos', true);
    mkInput(f, 'E-mail / Identificador', CX+408, fy+60, 360, 'maria@contage.com.br', true);
    mkInput(f, 'Senha', CX+28, fy+164, 360, 'Minimo 8 caracteres', true);
    mkInput(f, 'Confirmar senha', CX+408, fy+164, 360, 'Repita a senha', true);
    mkTxt(f, 'Use letras maiusculas, minusculas e numeros.', CX+28, fy+218, 11, C.verylite, 'Regular');

    mkLine(f, CX+28, fy+240, 740);
    mkTxt(f, 'Perfil de Acesso', CX+28, fy+256, 17, C.dark, 'SemiBold', 'Archivo');
    mkLine(f, CX+28, fy+280, 740);
    mkRect(f, CX+28, fy+292, 740, 50, rgb('EFF6FF'), 10);
    mkTxt(f, '[i] O perfil define quais modulos e empresas o colaborador pode visualizar e operar (RN-002).', CX+40, fy+305, 12, rgb('1E40AF'), 'Regular', 'Inter', 716);

    const perfis = ['Administrador','Colaborador - Pessoal','Colaborador - Fiscal','Colaborador - Contabil + Fiscal'];
    perfis.forEach((p,i) => {
      const px = CX+28 + (i>1 ? 380:0);
      const py = fy+354 + (i%2)*70;
      const isFirst = i===0;
      mkRect(f, px, py, 360, 54, isFirst ? rgb('EFF6FF') : C.bg, 10);
      if (!isFirst) {
        const bb = figma.createRectangle();
        bb.x=px; bb.y=py; bb.resize(360,54); bb.cornerRadius=10; bb.fills=[];
        bb.strokes=[{type:'SOLID',color:C.border2}]; bb.strokeWeight=1.5; f.appendChild(bb);
      } else {
        const bb = figma.createRectangle();
        bb.x=px; bb.y=py; bb.resize(360,54); bb.cornerRadius=10; bb.fills=[];
        bb.strokes=[{type:'SOLID',color:C.primary}]; bb.strokeWeight=2; f.appendChild(bb);
      }
      mkTxt(f, (isFirst?'(*)':' ( ) ') + ' ' + p, px+14, py+18, 13, isFirst ? C.primary : C.mid, isFirst?'SemiBold':'Regular');
    });

    mkTxt(f, 'Status inicial', CX+28, fy+508, 12, C.mid, 'Medium');
    mkRect(f, CX+28, fy+528, 200, 44, C.bg, 10);
    mkTxt(f, 'Ativo', CX+44, fy+541, 13, C.mid, 'Regular');

    mkButton(f, 'Cancelar',       CX+466, fy+588, 140, true);
    mkButton(f, 'Salvar Usuario', CX+622, fy+588, 180);

    figma.currentPage.appendChild(f); console.log('ok Cadastro Usuario');
    return f;
  }

  // ============================================================
  // TELA 12 — TIPOS DE DEMANDA
  // ============================================================
  async function mkTiposDemanda() {
    const f = mkFrame('12 - Tipos de Demanda', 1440, 1024);
    mkSidebar(f, 'demandas');
    mkHeader(f, 'Tipos de Demanda', 'Catalogo de obrigacoes e rotinas por setor');

    mkButton(f, '<- Voltar',   1074, 168, 120, true);
    mkButton(f, '+ Novo Tipo', 1210, 168, 140);

    // tabs setor
    const tabs = ['Todos','Pessoal','Fiscal','Contabil'];
    const tabY = CY+4;
    mkRect(f, CX, tabY, 350, 38, C.border2, 12);
    tabs.forEach((t,i) => {
      const isAct = i===0;
      const tx = CX + 4 + i*85;
      if (isAct) mkRect(f, tx, tabY+4, 80, 30, C.white, 9);
      mkTxt(f, t, tx+14, tabY+10, 13, isAct ? C.primary : C.light, isAct ? 'SemiBold' : 'Regular');
    });

    const cols = [
      {label:'Nome',w:220},{label:'Setor',w:130},{label:'Subtarefas',w:300},
      {label:'Empresas Vinculadas',w:180},{label:'Status',w:130},{label:'Acoes',w:80}
    ];
    mkTableHead(f, CY+56, cols);
    const rows = [
      ['Folha de Pagamento',        {badge:'Pessoal', color:'blue'},  'Calculo . Homologacao . Envio eSocial', '18', {badge:'Ativo',   color:'green'},'...'],
      ['FGTS Mensal',               {badge:'Pessoal', color:'blue'},  'GFIP . SEFIP',                          '18', {badge:'Ativo',   color:'green'},'...'],
      ['DCTF Mensal',               {badge:'Fiscal',  color:'orange'},'Apuracao PIS/COFINS . Transmissao',     '24', {badge:'Ativo',   color:'green'},'...'],
      ['Apuracao Simples Nacional', {badge:'Fiscal',  color:'orange'},'DAS',                                   '31', {badge:'Ativo',   color:'green'},'...'],
      ['Balancete Mensal',          {badge:'Contabil',color:'purple'},'--',                                    '12', {badge:'Ativo',   color:'green'},'...'],
      ['DIRF Anual',                {badge:'Fiscal',  color:'orange'},'Consolidacao . Transmissao',            '18', {badge:'Inativo', color:'gray'}, '...'],
    ];
    rows.forEach((row,i) => mkTableRow(f, CY+100+i*52, cols, row));
    mkPagination(f, CY+416, 'Mostrando 6 de 14 tipos');

    figma.currentPage.appendChild(f); console.log('ok Tipos de Demanda');
    return f;
  }

  // ============================================================
  // TELA 13 — AUDITORIA
  // ============================================================
  async function mkAuditoria() {
    const f = mkFrame('13 - Logs de Auditoria', 1440, 1024);
    mkSidebar(f, 'auditoria');
    mkHeader(f, 'Logs de Auditoria', 'Rastreabilidade de acoes criticas do sistema');
    mkButton(f, 'Exportar CSV', 1248, 168, 144, true);

    mkStatCard(f, CX,     CY, 270, 90, 'Eventos hoje',      '47', '',  C.primary);
    mkStatCard(f, CX+290, CY, 270, 90, 'Logins (24h)',      '12', '',  C.dark);
    mkStatCard(f, CX+580, CY, 270, 90, 'Alteracoes criticas','8', '',  C.yellow);
    mkStatCard(f, CX+870, CY, 270, 90, 'Falhas de login',   '3',  '',  C.red);

    const fby = CY+110;
    mkRect(f, CX, fby, 1162, 60, C.white, 14);
    mkInput(f, '', CX+12, fby+8, 320, 'Buscar por usuario, acao ou entidade...');
    mkInput(f, '', CX+348, fby+8, 150, '01/04/2026');
    mkInput(f, '', CX+514, fby+8, 150, '09/04/2026');
    mkInput(f, '', CX+680, fby+8, 200, 'Todos os tipos');
    mkButton(f, 'Exportar CSV', CX+900, fby+10, 130, true);

    const cols = [
      {label:'Data / Hora',w:170},{label:'Usuario',w:180},{label:'Tipo de Evento',w:180},
      {label:'Acao',w:230},{label:'Entidade',w:190},{label:'IP',w:110}
    ];
    mkTableHead(f, fby+80, cols);
    const rows = [
      ['09/04/2026 14:32','Joao Silva',    {badge:'Recibo Emitido', color:'green'}, 'Emitiu REC-2026-046',            'Tech Solutions S/A',          '187.24.110.33'],
      ['09/04/2026 13:15','Maria Santos',  {badge:'Edicao',         color:'blue'},  'Status demanda -> Concluida',     'Padaria Sao Joao - Folha Abr', '187.24.110.41'],
      ['09/04/2026 11:48','Joao Silva',    {badge:'Criacao',        color:'green'}, 'Cadastrou nova empresa',          'Mercearia do Bairro ME',       '187.24.110.33'],
      ['09/04/2026 10:05','Carlos Oliveira',{badge:'Login',         color:'purple'},'Autenticacao com sucesso',        'Sistema',                      '177.92.55.12'],
      ['09/04/2026 09:50','Joao Silva',    {badge:'Cancelamento',   color:'red'},   'Cancelou REC-2026-039',           'Construtora Brasil Ltda',      '187.24.110.33'],
      ['09/04/2026 09:12','Ana Lima',      {badge:'Exportacao',     color:'purple'},'Exportou demandas CSV Mar/2026',  'Todas as empresas',            '201.45.88.9'],
      ['08/04/2026 17:44','Joao Silva',    {badge:'Criacao',        color:'green'}, 'Criou usuario roberto.melo',      'Roberto Melo',                 '187.24.110.33'],
    ];
    rows.forEach((row,i) => mkTableRow(f, fby+124+i*52, cols, row));
    mkPagination(f, fby+492, 'Mostrando 7 de 124 eventos - Retencao: 5 anos (RNF-010)');

    figma.currentPage.appendChild(f); console.log('ok Auditoria');
    return f;
  }

  // ============================================================
  // EXECUCAO
  // ============================================================
  console.log('Criando 13 telas SGEC...');
  const all = [];
  all.push(await mkLogin());
  all.push(await mkDashboard());
  all.push(await mkEmpresas());
  all.push(await mkCadastroEmpresa());
  all.push(await mkDemandas());
  all.push(await mkRecibos());
  all.push(await mkEmitirRecibo());
  all.push(await mkRecebimentos());
  all.push(await mkRegistrarRecebimento());
  all.push(await mkUsuarios());
  all.push(await mkCadastroUsuario());
  all.push(await mkTiposDemanda());
  all.push(await mkAuditoria());

  // Grid 2 linhas x 7 colunas
  const GAP = 80, W = 1440, H = 1024;
  all.forEach((fr, i) => {
    fr.x = (i % 7) * (W + GAP);
    fr.y = Math.floor(i / 7) * (H + GAP);
  });

  figma.viewport.scrollAndZoomIntoView(all);
  figma.notify('13 telas SGEC criadas com sucesso!', {timeout:4000});
  console.log('CONCLUIDO! 13 telas criadas.');
})();
