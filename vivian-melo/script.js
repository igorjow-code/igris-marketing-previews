/* Vivian Melo — interações. Sem biblioteca. Só transform/opacity. */
(function () {
  'use strict';
  var doc = document;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- índices de stagger ---- */
  doc.querySelectorAll('.wordmark > span > span').forEach(function (el, k) { el.style.setProperty('--k', k); });
  doc.querySelectorAll('.regua i').forEach(function (el, k) { el.style.setProperty('--k', k); });
  doc.querySelectorAll('h1 .linha > span').forEach(function (el, k) { el.style.setProperty('--k', k); });

  /* ---- load coreografado ---- */
  var hero = doc.querySelector('.hero');
  function pronto() { hero.classList.add('pronto'); }
  if (doc.fonts && doc.fonts.ready) {
    var feito = false;
    doc.fonts.ready.then(function () { if (!feito) { feito = true; requestAnimationFrame(pronto); } });
    setTimeout(function () { if (!feito) { feito = true; pronto(); } }, 900);
  } else { pronto(); }

  /* ---- revelação ao entrar na tela (stagger por grupo) ---- */
  var revs = [].slice.call(doc.querySelectorAll('[data-r]'));
  var grupos = new Map();
  revs.forEach(function (el) {
    var pai = el.parentElement;
    var n = grupos.get(pai) || 0;
    el.style.setProperty('--d', Math.min(n, 6) * 90 + 'ms');
    grupos.set(pai, n + 1);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- LEQUE: seção alta + palco sticky; o scroll abre o leque e passa pelas 7 etapas ---- */
  var leque = doc.querySelector('.leque');
  var laminas = [].slice.call(leque.querySelectorAll('.lamina'));
  var etapas = [].slice.call(leque.querySelectorAll('.etapa'));
  var N = laminas.length;
  var ABRE = 0.14;           // fração do percurso usada para abrir o leque
  var ativo = -1, ligado = false, tick = false, idleT = 0;

  var prog = doc.createElement('div');
  prog.className = 'progresso';
  prog.setAttribute('aria-hidden', 'true');
  etapas.forEach(function (et) { var i = doc.createElement('i'); i.style.setProperty('--c', et.style.getPropertyValue('--c')); prog.appendChild(i); });
  leque.querySelector('.etapas').after(prog);
  var marcas = [].slice.call(prog.children);

  function podeLigar() { return !reduz.matches && window.innerHeight >= 540; }
  function S() { return window.innerWidth >= 900 ? 16 : 15; }
  function suave(t) { return 1 - Math.pow(1 - t, 3); }

  function setAtivo(i) {
    if (i === ativo) return;
    ativo = i;
    laminas.forEach(function (l, k) { l.classList.toggle('ativa', k === i); });
    etapas.forEach(function (e, k) { e.classList.toggle('ativa', k === i); });
    marcas.forEach(function (m, k) { m.classList.toggle('on', k <= i); });
  }

  function progresso() {
    var r = leque.getBoundingClientRect();
    var curso = leque.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / curso));
  }

  function desenha() {
    tick = false;
    if (!ligado) return;
    var p = progresso();
    var aberto = suave(Math.min(1, p / ABRE));
    leque.style.setProperty('--ab', aberto.toFixed(3));
    var s = S();
    laminas.forEach(function (l, i) {
      var fechado = (i - 3) * 0.9;
      var a = fechado + ((i - 3) * s - fechado) * aberto;
      l.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
    });
    var q = Math.min(0.9999, Math.max(0, (p - ABRE) / (1 - ABRE)));
    setAtivo(aberto > 0.6 ? Math.floor(q * N) : 0);
  }

  function aoRolar() {
    if (!ligado) return;
    leque.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(function () {
      var r = leque.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) leque.classList.add('idle');
    }, 900);
    if (!tick) { tick = true; requestAnimationFrame(desenha); }
  }

  function irPara(i) {
    var curso = leque.offsetHeight - window.innerHeight;
    var alvo = ABRE + (i + 0.5) / N * (1 - ABRE);
    var y = leque.getBoundingClientRect().top + window.scrollY + alvo * curso;
    window.scrollTo({ top: y, behavior: reduz.matches ? 'auto' : 'smooth' });
  }
  laminas.forEach(function (l, i) {
    l.addEventListener('click', function () { if (ligado) irPara(i); });
  });

  function configura() {
    var deve = podeLigar();
    if (deve && !ligado) {
      ligado = true;
      leque.classList.add('leque-on');
      ativo = -1;
      desenha();
      aoRolar();
    } else if (!deve && ligado) {
      ligado = false;
      leque.classList.remove('leque-on', 'idle');
      leque.style.removeProperty('--ab');
      laminas.forEach(function (l) { l.style.transform = ''; l.classList.remove('ativa'); });
      etapas.forEach(function (e) { e.classList.remove('ativa'); });
    } else if (ligado) { desenha(); }
  }
  configura();
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', configura);
  if (reduz.addEventListener) reduz.addEventListener('change', configura);

  /* ---- faixa: zoom lento ligado à rolagem (decorativo, só na foto) ---- */
  var faixa = doc.querySelector('.faixa');
  if (faixa && !reduz.matches) {
    var fz = false;
    var zoom = function () {
      fz = false;
      var r = faixa.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var t = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      faixa.style.setProperty('--z', (1.14 - 0.14 * t).toFixed(4));
    };
    window.addEventListener('scroll', function () { if (!fz) { fz = true; requestAnimationFrame(zoom); } }, { passive: true });
    zoom();
  }

  /* ---- vídeos: tocam só quando visíveis, sem som; com movimento reduzido, controles ---- */
  var vids = [].slice.call(doc.querySelectorAll('video.vid'));
  if (reduz.matches) {
    vids.forEach(function (v) { v.controls = true; v.removeAttribute('loop'); });
  } else if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.controls = true; }); }
        else { v.pause(); }
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---- CTA flutuante: aparece depois do hero, some no CTA final ---- */
  var flutua = doc.querySelector('.flutua');
  var final = doc.querySelector('.final');
  if ('IntersectionObserver' in window && flutua) {
    var heroVis = true, finalVis = false, lequeVis = false;
    var atualiza = function () { flutua.classList.toggle('on', !heroVis && !finalVis && !(lequeVis && ligado && window.innerWidth < 900)); };
    new IntersectionObserver(function (es) { lequeVis = es[0].isIntersecting; atualiza(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(leque);
    new IntersectionObserver(function (es) { var e = es[0]; heroVis = e.isIntersecting || e.boundingClientRect.top > 0; atualiza(); }, { threshold: 0.02 }).observe(hero.querySelector('.btn'));
    new IntersectionObserver(function (es) { finalVis = es[0].isIntersecting; atualiza(); }, { threshold: 0.05 }).observe(final);
    var visiveis = new Set();
    var subindo = true, ultimoY = window.scrollY;
    atualiza = function () { flutua.classList.toggle('on', subindo && !heroVis && !finalVis && visiveis.size === 0 && !(lequeVis && ligado && window.innerWidth < 900)); };
    window.addEventListener('scroll', function () {
      var y = window.scrollY, s = y < ultimoY - 4 ? true : (y > ultimoY + 4 ? false : subindo);
      ultimoY = y; if (s !== subindo) { subindo = s; atualiza(); }
    }, { passive: true });
    var bio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target); }); atualiza(); });
    doc.querySelectorAll('main .btn').forEach(function (b) { bio.observe(b); });
  }

  /* ---- setas do trilho (desktop) ---- */
  var trilho = doc.querySelector('.trilho');
  doc.querySelectorAll('.trilho-nav button').forEach(function (b) {
    b.addEventListener('click', function () {
      trilho.scrollBy({ left: Number(b.dataset.dir) * trilho.clientWidth * 0.6, behavior: reduz.matches ? 'auto' : 'smooth' });
    });
  });
})();
