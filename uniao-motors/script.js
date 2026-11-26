/* União Motors — prévia. Sem biblioteca. Só transform/opacity (e clip-path no portal).
   Mecanismo: seção alta + palco sticky; a rolagem vira câmera (fachada -> sobe -> pátio de cima).
   Tocar numa vaga: o contorno de LED da vaga cresce como portal e abre o showroom com a ficha. */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement, win = window;
  var ZAP = 'https://wa.me/5575992242019';
  var TAXA = 0.0179;
  var reduz = win.matchMedia('(prefers-reduced-motion: reduce)');
  var largo = win.matchMedia('(min-aspect-ratio: 1/1) and (min-width: 900px)');

  /* Ficha: o que está na legenda da própria loja; onde a legenda não traz número, dado de fábrica do modelo. */
  var CARROS = [
    { id: 'velar', tag: 'Velar', marca: 'Land Rover', modelo: 'Range Rover Velar', versao: 'P300 R-Dynamic SE', ano: '2020',
      stats: [['Potência', '300', 'cv', .75], ['Torque', '40,8', 'kgfm', .51], ['Vel. máxima', '234', 'km/h', .9]],
      fatos: ['Motor 2.0 Ingenium turbo a gasolina', 'Câmbio automático ZF de 8 marchas', 'Tração integral AWD', '0 a 100 km/h em cerca de 6,2 s', 'Porta-malas de 558 litros', 'Cor cinza'],
      fonte: 'Ficha publicada pela loja no Instagram em 03/07/2026.' },
    { id: 'x4', tag: 'BMW X4', marca: 'BMW', modelo: 'BMW X4', versao: 'xDrive30i', ano: '2019',
      stats: [['Potência', '252', 'cv', .63], ['Torque', '35,7', 'kgfm', .45], ['Vel. máxima', '240', 'km/h', .92]],
      fatos: ['Motor 2.0 turbo', 'Câmbio automático', 'Tração integral xDrive', 'SUV com linha de cupê'],
      fonte: 'Modelo e versão da legenda da loja (27/10/2026). Números: dado de fábrica do modelo.' },
    { id: 'ex30', tag: 'EX30', marca: 'Volvo', modelo: 'Volvo EX30', versao: 'Ultra', ano: '2024',
      stats: [['Potência', '272', 'cv', .68], ['Torque', '35,0', 'kgfm', .44], ['Vel. máxima', '180', 'km/h', .69]],
      fatos: ['100% elétrico', 'SUV compacto premium', 'Modelo único na região, segundo a loja'],
      fonte: 'Modelo e versão da legenda da loja (10/11/2026). Números: dado de fábrica do modelo.' },
    { id: 'dolphin', tag: 'Dolphin', marca: 'BYD', modelo: 'BYD Dolphin', versao: 'Special Edition', ano: '2027',
      stats: [['Motor', 'Elétrico', '', 1], ['Entrega', 'Pronta', '', 1], ['Modelo', '2027', '', 1]],
      fatos: ['100% elétrico', 'Pronta entrega, sem a fila da concessionária', 'Chegou à loja em novembro de 2026'],
      fonte: 'Informações da legenda da loja (10/11/2026).' },
    { id: 'haval', tag: 'H6 GT', marca: 'GWM', modelo: 'Haval H6 GT', versao: 'PHEV 1.5 Turbo 4x4', ano: '2025',
      stats: [['Potência', '393', 'cv', .98], ['Torque', '77,7', 'kgfm', .97], ['0 a 100', '4,8', 's', .9]],
      fatos: ['Híbrido plug-in', 'Motor 1.5 16V turbo', 'Tração 4x4', 'SUV cupê único na região, segundo a loja'],
      fonte: 'Modelo e versão da legenda da loja. Números: dado de fábrica do modelo.' },
    { id: 'a5', tag: 'Audi A5', marca: 'Audi', modelo: 'Audi A5 Sportback', versao: 'Ambition 2.0 TFSI S tronic', ano: '2018',
      stats: [['Potência', '252', 'cv', .63], ['Torque', '37,7', 'kgfm', .47], ['Vel. máxima', '250', 'km/h', .96]],
      fatos: ['Motor 2.0 TFSI turbo', 'Câmbio S tronic', 'Cupê de quatro portas'],
      fonte: 'Modelo e versão da legenda da loja (29/09/2026). Números: dado de fábrica do modelo.' }
  ];
  var porId = {};
  CARROS.forEach(function (c, i) { c.n = i; porId[c.id] = c; });

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || doc).querySelectorAll(s)); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function suave(t) { return t * t * (3 - 2 * t); }
  function reais(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
  function zap(txt) { return ZAP + '?text=' + encodeURIComponent(txt); }
  function cria(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  $$('a[data-zap]').forEach(function (a) { a.href = zap(a.getAttribute('data-zap')); });

  var chegada = $('.chegada'), palco = $('.palco'), fachada = $('.cena-fachada'), patio = $('.cena-patio'),
      lote = $('#lote'), hero = $('.hero'), desce = $('.desce'), topo = $('#topo');

  /* ---------- modo animado ---------- */
  var anim = !reduz.matches;
  if (anim) html.classList.add('anim');

  function pronto() { palco.classList.add('pronto'); }
  if (doc.fonts && doc.fonts.ready) {
    var feito = false;
    doc.fonts.ready.then(function () { if (!feito) { feito = true; requestAnimationFrame(pronto); } });
    setTimeout(function () { if (!feito) { feito = true; pronto(); } }, 1000);
  } else { pronto(); }

  /* ---------- a rolagem vira câmera ---------- */
  var tick = false, aquecido = false;
  function srcDe(c) { return 'img/car-' + c.id + (largo.matches ? '' : '-m') + '.webp'; }
  function aquece() { if (aquecido) return; aquecido = true; CARROS.forEach(function (c) { var i = new Image(); i.src = srcDe(c); }); }
  function curso() { return chegada.offsetHeight - win.innerHeight; }
  function desenha() {
    tick = false;
    var y = win.scrollY || win.pageYOffset;
    if (!anim) { topo.classList.toggle('solido', y > 40); return; }
    var p = clamp((y - chegada.offsetTop) / curso());
    var a = suave(clamp((p - 0.05) / 0.4));
    /* a fachada some antes de o pátio aparecer: a câmera atravessa o escuro, sem dupla exposição */
    fachada.style.transform = 'translate3d(0,' + (a * 22).toFixed(2) + '%,0) scale(' + (1 + a * 0.7).toFixed(4) + ')';
    fachada.style.opacity = (1 - clamp((a - 0.1) / 0.36)).toFixed(3);
    var op = clamp((a - 0.5) / 0.3);
    patio.style.opacity = op.toFixed(3);
    patio.style.visibility = op > 0.001 ? 'visible' : 'hidden';
    patio.style.transform = 'scale(' + (1.55 - 0.55 * a).toFixed(4) + ') rotate(' + ((1 - a) * -5).toFixed(2) + 'deg)';
    var h = 1 - clamp(p / 0.07);
    hero.style.opacity = h.toFixed(3);
    hero.style.transform = 'translate3d(0,' + (-p * 420).toFixed(1) + 'px,0)';
    desce.style.opacity = h.toFixed(3);
    palco.classList.toggle('sumiu', h <= 0.001);
    var pousou = a >= 0.985;
    palco.classList.toggle('pousou', pousou);
    if (pousou) aquece();
    topo.classList.toggle('solido', y > chegada.offsetTop + curso() + win.innerHeight * 0.6);
  }
  function pede() { if (!tick) { tick = true; requestAnimationFrame(desenha); } }
  win.addEventListener('scroll', pede, { passive: true });
  win.addEventListener('resize', pede);
  desenha();
  if (!anim) palco.classList.add('pousou');

  /* âncora do pátio: dentro do palco sticky, o destino é um ponto da rolagem, não um elemento */
  function vaiProPatio(liso) {
    var alvo = anim ? chegada.offsetTop + curso() * 0.62 : patio.getBoundingClientRect().top + win.scrollY - 60;
    win.scrollTo({ top: alvo, behavior: liso && anim ? 'smooth' : 'auto' });
  }
  $$('a[href="#patio"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); vaiProPatio(true); });
  });

  /* ---------- revelação ao entrar na tela ---------- */
  var revs = $$('[data-r]'), grupos = new Map();
  revs.forEach(function (el) { var pai = el.parentElement, n = grupos.get(pai) || 0; el.style.setProperty('--d', Math.min(n, 6) * 90 + 'ms'); grupos.set(pai, n + 1); });
  var formas = $$('.formas li');
  if (anim && 'IntersectionObserver' in win) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -3% 0px', threshold: 0.01 });
    revs.forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -32% 0px', threshold: 0.2 });
    formas.forEach(function (el) { io2.observe(el); });
  } else {
    revs.concat(formas).forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- filtros do estoque ---------- */
  var chips = $$('.chip'), linhas = $$('#lista li'), lista = $('#lista'), mais = $('#mais');
  function abreLista() { lista.classList.remove('curta'); mais.hidden = true; mais.setAttribute('aria-expanded', 'true'); }
  mais.addEventListener('click', abreLista);
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      if (f !== 'todos') abreLista();
      chips.forEach(function (o) { var on = o === c; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      linhas.forEach(function (li) { li.hidden = !(f === 'todos' || (' ' + li.getAttribute('data-c') + ' ').indexOf(' ' + f + ' ') > -1); });
    });
  });

  /* ---------- simulador ---------- */
  function parcela(v, n) { return v * TAXA / (1 - Math.pow(1 + TAXA, -n)); }
  var sims = {};
  $$('[data-sim]').forEach(function (f) {
    var faixa = $('[data-in=valor]', f), oV = $('[data-out=valor]', f), oP = $('[data-out=parcela]', f), est = { mexeu: false, valor: 0, prazo: 0 };
    function calc() {
      var v = +faixa.value, n = +($('input[type=radio]:checked', f) || {}).value || 48;
      est.valor = v; est.prazo = n;
      faixa.style.setProperty('--pct', ((v - faixa.min) / (faixa.max - faixa.min) * 100).toFixed(1) + '%');
      oV.textContent = reais(v); oP.textContent = reais(parcela(v, n));
      var a = $('[data-sim-zap]', f);
      if (a) a.href = zap('Oi! Fiz uma simulação no site da União Motors: financiar ' + reais(v) + ' em ' + n + ' vezes. Pode me passar a condição real?');
      if (f.id === 'sim-ficha') atualizaZapCarro();
    }
    f.addEventListener('input', function () { est.mexeu = true; calc(); });
    sims[f.id] = est; est.calc = calc;
  });

  /* ============ SHOWROOM ============ */
  var sr = $('#showroom'), portal = $('#portal'), capa = $('#sr-capa'), imgA = $('#sr-img-a'), imgB = $('#sr-img-b'), ativaImg = null,
      elPos = $('#sr-pos'), elModelo = $('#sr-modelo'), elVersao = $('#sr-versao'), elFatos = $('#sr-fatos'), elFonte = $('#sr-fonte'),
      elMarca = $('#hud-marca'), elHud = $('#hud-stats'), elStats = $('#sr-stats'), elZap = $('#sr-zap'), trilho = $('#sr-trilho'), ficha = $('#ficha'),
      fundo = [topo, $('main'), $('.rodape')];
  var cena = $('.sr-cena');
  var atual = null, aberto = false, empurrou = false, focoAntes = null, vagaOrigem = null, relogio = 0;
  var CURVA = 'cubic-bezier(.7, 0, .2, 1)';
  sr.addEventListener('scroll', function () { sr.classList.toggle('rolou', sr.scrollTop > cena.offsetHeight - 70); }, { passive: true });

  CARROS.forEach(function (c) {
    var b = cria('button', '', c.tag);
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false'); b.dataset.car = c.id;
    b.addEventListener('click', function () { troca(c.id); });
    trilho.appendChild(b);
  });

  function poeImagem(c, direto) {
    var prox = ativaImg === imgA ? imgB : imgA, src = srcDe(c);
    function liga() { if (atual !== c) return; prox.classList.add('on'); if (ativaImg && ativaImg !== prox) ativaImg.classList.remove('on'); ativaImg = prox; }
    prox.alt = c.modelo + ' ' + c.versao + ' ' + c.ano + ' no showroom da União Motors (cena ilustrativa).';
    prox.src = src;
    if (direto || prox.complete) { liga(); } else { prox.onload = liga; prox.onerror = liga; }
  }
  function atualizaZapCarro() {
    if (!atual) return;
    var t = 'Oi! Vi o ' + atual.modelo + ' ' + atual.versao + ' ' + atual.ano + ' no site da União Motors e quero saber o valor.';
    var s = sims['sim-ficha'];
    if (s && s.mexeu) t += ' Simulei financiar ' + reais(s.valor) + ' em ' + s.prazo + ' vezes.';
    elZap.href = zap(t);
  }
  /* o número sobe contando, como painel ligando */
  function conta(no, txt) {
    var m = /^(\d+)(?:,(\d+))?$/.exec(txt);
    if (!m || !anim) { no.textContent = txt; return; }
    var casas = m[2] ? m[2].length : 0, alvo = parseFloat(m[1] + (m[2] ? '.' + m[2] : '')), t0 = 0, dur = 950;
    function passo(t) {
      if (!t0) t0 = t;
      var k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      no.textContent = (alvo * e).toFixed(casas).replace('.', ',');
      if (k < 1 && no.isConnected) requestAnimationFrame(passo); else no.textContent = txt;
    }
    no.textContent = (0).toFixed(casas).replace('.', ',');
    requestAnimationFrame(passo);
  }
  function enche(el, v) { requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.setProperty('--v', v); }); }); }
  function preenche(c) {
    elPos.textContent = 'Vaga ' + ('0' + (c.n + 1)) + ' de 0' + CARROS.length;
    elModelo.textContent = c.modelo;
    elVersao.textContent = c.versao + ' · ' + c.ano;
    elFatos.innerHTML = '';
    c.fatos.forEach(function (f) { elFatos.appendChild(cria('li', '', f)); });
    elFonte.textContent = c.fonte + ' Confirme os detalhes com o vendedor.';
    elMarca.textContent = c.marca;
    elHud.innerHTML = ''; elStats.innerHTML = '';
    c.stats.forEach(function (s) {
      var d = cria('div', 'hud-stat'), b = cria('b');
      d.appendChild(cria('span', '', s[0])); d.appendChild(b); elHud.appendChild(d);
      var num = cria('i'); b.appendChild(num); if (s[2]) b.appendChild(doc.createTextNode(' ' + s[2]));
      conta(num, s[1]); enche(d, s[3]);
      var e = cria('div', 'stat'), v = cria('b', /^\d/.test(s[1]) ? '' : 'txt');
      e.appendChild(cria('i', '', s[0])); e.appendChild(v); if (s[2]) e.appendChild(cria('span', '', s[2]));
      elStats.appendChild(e); conta(v, s[1]); enche(e, s[3]);
    });
    $$('button', trilho).forEach(function (b) { var on = b.dataset.car === c.id; b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    $$('#sr-mini i').forEach(function (i, k) { i.classList.toggle('on', k === c.n); });
    $('#sr-barra-nome').textContent = c.modelo + ' · ' + c.ano;
    $('#sr-barra-img').src = 'img/car-' + c.id + '-m.webp';
    atualizaZapCarro();
  }
  function mostra(c, direto) { atual = c; poeImagem(c, direto); preenche(c); ficha.scrollTop = 0; sr.scrollTop = 0; }

  function troca(id) {
    var c = porId[id]; if (!c || c === atual) return;
    sr.classList.add('troca');
    setTimeout(function () { mostra(c); sr.classList.remove('troca'); }, anim ? 160 : 0);
    if (empurrou) history.replaceState({ car: id }, '', '#carro-' + id);
  }
  function passo(d) { if (atual) troca(CARROS[(atual.n + d + CARROS.length) % CARROS.length].id); }

  function recorte(v) { var r = v.getBoundingClientRect(); return [Math.max(0, r.top), Math.max(0, win.innerWidth - r.right), Math.max(0, win.innerHeight - r.bottom), Math.max(0, r.left)]; }
  function inset(q) { return 'inset(' + q.map(function (n) { return n.toFixed(1) + 'px'; }).join(' ') + ')'; }
  function poePortal(q) { portal.style.top = q[0] + 'px'; portal.style.right = q[1] + 'px'; portal.style.bottom = q[2] + 'px'; portal.style.left = q[3] + 'px'; }

  function trava() {
    html.classList.add('sr-aberto');
    fundo.forEach(function (el) { if (el) el.setAttribute('inert', ''); });
    aberto = true;
    sr.focus({ preventScroll: true });
  }
  function abre(id, vaga, semHistorico) {
    var c = porId[id]; if (!c || aberto) return;
    clearTimeout(relogio);
    focoAntes = doc.activeElement; vagaOrigem = vaga || null;
    if (!semHistorico) { history.pushState({ car: id }, '', '#carro-' + id); empurrou = true; }
    sr.hidden = false;
    mostra(c, true);
    if (vaga && anim) {
      var q = recorte(vaga), r = vaga.getBoundingClientRect(), l = lote.getBoundingClientRect();
      lote.style.setProperty('--ox', ((r.left + r.width / 2 - l.left) / l.width * 100).toFixed(2) + '%');
      lote.style.setProperty('--oy', ((r.top + r.height / 2 - l.top) / l.height * 100).toFixed(2) + '%');
      html.classList.add('mergulhando');
      lote.classList.add('mergulho');
      sr.style.transition = 'none'; sr.style.clipPath = inset(q); sr.classList.add('on', 'pouso');
      portal.style.transition = 'none'; portal.style.display = 'block'; portal.style.opacity = '1'; poePortal(q);
      var W = win.innerWidth, H = win.innerHeight, ar = largo.matches ? 1920 / 1072 : 1.2, dH = Math.max(H, W / ar), dW = dH * ar;
      var dx = (r.left + r.width / 2) - ((W - dW) / 2 + (largo.matches ? .39 : .5) * dW), dy = (r.top + r.height / 2) - ((H - dH) / 2 + .62 * dH);
      capa.src = srcDe(c); capa.style.transition = 'none'; capa.style.opacity = '1'; capa.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(1.12)';
      void sr.offsetWidth;
      capa.style.transition = 'opacity .3s cubic-bezier(.25, 1, .5, 1) .86s, transform 1.5s cubic-bezier(.16, 1, .3, 1)'; capa.style.opacity = '0'; capa.style.transform = 'none';
      sr.style.transition = 'clip-path .96s ' + CURVA; sr.style.clipPath = inset([0, 0, 0, 0]);
      portal.style.transition = 'top .96s ' + CURVA + ', right .96s ' + CURVA + ', bottom .96s ' + CURVA + ', left .96s ' + CURVA + ', opacity .5s cubic-bezier(.25, 1, .5, 1) .72s';
      poePortal([0, 0, 0, 0]); portal.style.opacity = '0';
      trava();
      relogio = setTimeout(function () {
        sr.style.transition = ''; sr.style.clipPath = ''; portal.style.display = 'none';
        lote.style.transition = 'none'; lote.classList.remove('mergulho'); void lote.offsetWidth; lote.style.transition = '';
        html.classList.remove('mergulhando');
      }, 1320);
      setTimeout(function () { sr.classList.remove('pouso'); }, 1500);
    } else {
      void sr.offsetWidth;
      sr.classList.add('on', 'pouso');
      trava();
      setTimeout(function () { sr.classList.remove('pouso'); }, 1500);
    }
  }
  function some() { capa.style.transition = 'none'; capa.style.opacity = '0'; sr.hidden = true; sr.classList.remove('on'); sr.style.transition = ''; sr.style.clipPath = ''; imgA.classList.remove('on'); imgB.classList.remove('on'); ativaImg = null; atual = null; }
  function fechaUI() {
    if (!aberto) return;
    aberto = false; clearTimeout(relogio);
    capa.style.transition = 'none'; capa.style.opacity = '0';
    html.classList.remove('sr-aberto', 'mergulhando');
    fundo.forEach(function (el) { if (el) el.removeAttribute('inert'); });
    portal.style.display = 'none';
    var visivel = vagaOrigem && anim && vagaOrigem.getBoundingClientRect().width > 0 && palco.classList.contains('pousou');
    if (visivel) {
      var q = recorte(vagaOrigem);
      lote.style.transition = 'none'; lote.classList.add('mergulho'); void lote.offsetWidth; lote.style.transition = ''; lote.classList.remove('mergulho');
      sr.style.transition = 'clip-path .6s ' + CURVA + ', opacity .2s cubic-bezier(.25, 1, .5, 1) .45s';
      sr.style.clipPath = inset(q); sr.style.opacity = '0';
      relogio = setTimeout(function () { if (!aberto) { sr.style.opacity = ''; some(); } }, 680);
    } else {
      sr.classList.remove('on');
      relogio = setTimeout(function () { if (!aberto) some(); }, anim ? 400 : 0);
    }
    if (focoAntes && focoAntes.focus) focoAntes.focus({ preventScroll: true });
  }
  function fecha() {
    if (empurrou) { empurrou = false; history.back(); }
    else { fechaUI(); history.replaceState(null, '', location.pathname + location.search); }
  }
  win.addEventListener('popstate', function () {
    var m = /^#carro-(\w+)/.exec(location.hash);
    if (m && porId[m[1]]) { if (aberto) troca(m[1]); else abre(m[1], null, true); }
    else { empurrou = false; fechaUI(); }
  });

  $$('.vaga').forEach(function (v) { v.addEventListener('click', function () { abre(v.dataset.car, v); }); });
  $$('.cartao').forEach(function (b) { b.addEventListener('click', function () { abre(b.dataset.car); }); });
  $('#sr-voltar').addEventListener('click', fecha);
  $('#sr-ant').addEventListener('click', function () { passo(-1); });
  $('#sr-prox').addEventListener('click', function () { passo(1); });

  doc.addEventListener('keydown', function (e) {
    if (!aberto) return;
    if (e.key === 'Escape') { fecha(); return; }
    var emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName);
    if (!emCampo && e.key === 'ArrowRight') passo(1);
    if (!emCampo && e.key === 'ArrowLeft') passo(-1);
    if (e.key === 'Tab') {
      var f = $$('button, a[href], input', sr).filter(function (el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; });
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* arrastar para trocar de carro */
  var tx = 0, ty = 0;
  cena.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  cena.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) passo(dx < 0 ? 1 : -1);
  }, { passive: true });

  var bLink = $('#sr-link');
  bLink.addEventListener('click', function () {
    var ok = function () { bLink.textContent = 'Link copiado'; setTimeout(function () { bLink.textContent = 'Copiar link'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(ok, function () {});
  });

  function ajusta() { if (aberto && atual) poeImagem(atual); }
  if (largo.addEventListener) largo.addEventListener('change', ajusta); else if (largo.addListener) largo.addListener(ajusta);

  Object.keys(sims).forEach(function (k) { sims[k].calc(); });

  /* link direto de um carro */
  var ini = /^#carro-(\w+)/.exec(location.hash);
  if (ini && porId[ini[1]]) { vaiProPatio(false); desenha(); abre(ini[1], null, true); }
  else if (location.hash === '#patio') { vaiProPatio(false); }
})();
