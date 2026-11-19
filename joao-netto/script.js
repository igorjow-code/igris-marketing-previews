/* João Netto — interações. Sem biblioteca. Só transform/opacity/clip-path. */
(function () {
  'use strict';
  var doc = document;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- índices de stagger ---- */
  doc.querySelectorAll('.capa-titulo .l2 > span').forEach(function (el, k) { el.style.setProperty('--k', k); });
  doc.querySelectorAll('.capa-linhas li').forEach(function (el, k) { el.style.setProperty('--k', k); });

  /* ---- load coreografado ---- */
  var hero = doc.querySelector('.hero');
  function pronto() { hero.classList.add('pronto'); }
  var feito = false;
  function vai() { if (!feito) { feito = true; requestAnimationFrame(pronto); } }
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(vai); }
  setTimeout(vai, 900);

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

  /* ---- FICHA: seção alta + palco sticky; a rolagem preenche linha a linha e o carimbo bate ---- */
  var sec = doc.querySelector('.ficha-sec');
  var ficha = sec.querySelector('.ficha');
  var linhas = [].slice.call(sec.querySelectorAll('.fl'));
  var caneta = sec.querySelector('.caneta');
  var N = linhas.length;            // 6 linhas
  var FIM = 0.62;                   // até aqui preenche; depois disso o carimbo bate
  var ligado = false, tick = false, idleT = 0, feitas = -1, bateu = false;

  function podeLigar() { return !reduz.matches && window.innerHeight >= 560; }

  function progresso() {
    var r = sec.getBoundingClientRect();
    var curso = sec.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / curso));
  }

  /* a caneta vai para o fim do texto que acabou de ser escrito (ou para o começo da próxima linha) */
  function posCaneta(n) {
    var lin = n > 0 ? linhas[n - 1] : linhas[0];
    if (!lin) return;
    var m = lin.querySelector('.mao');
    var fr = ficha.getBoundingClientRect(), mr = m.getBoundingClientRect();
    var x = n > 0 ? mr.right - fr.left + 2 : mr.left - fr.left;
    var y = mr.top - fr.top + mr.height * 0.55 - 10;
    caneta.style.setProperty('--cx', x.toFixed(1) + 'px');
    caneta.style.setProperty('--cy', y.toFixed(1) + 'px');
  }

  function desenha() {
    tick = false;
    if (!ligado) return;
    var p = progresso();
    var n = Math.floor(Math.min(1, p / FIM) * (N + 0.001));   // quantas linhas preenchidas
    if (p < 0.03) n = 0;
    if (n !== feitas) {
      feitas = n;
      linhas.forEach(function (l, k) {
        l.classList.toggle('feita', k < n);
        l.classList.toggle('atual', k === n - 1);
      });
      posCaneta(n);
    }
    var b = p >= FIM + 0.04;
    if (b !== bateu) {
      bateu = b;
      sec.classList.toggle('bateu', b);
      if (b && navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
    }
  }

  function aoRolar() {
    if (!ligado) return;
    sec.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(function () {
      var r = sec.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && !bateu) sec.classList.add('idle');
    }, 700);
    if (!tick) { tick = true; requestAnimationFrame(desenha); }
  }

  /* toque numa linha leva a rolagem até ela */
  function irPara(i) {
    var curso = sec.offsetHeight - window.innerHeight;
    var alvo = (i + 1) / N * FIM - 0.01;
    var y = sec.getBoundingClientRect().top + window.scrollY + alvo * curso;
    window.scrollTo({ top: y, behavior: reduz.matches ? 'auto' : 'smooth' });
  }
  linhas.forEach(function (l, i) { l.addEventListener('click', function () { if (ligado) irPara(i); }); });

  function configura() {
    var deve = podeLigar();
    if (deve && !ligado) {
      ligado = true; feitas = -1; bateu = false;
      sec.classList.add('on');
      desenha(); aoRolar();
    } else if (!deve && ligado) {
      ligado = false;
      sec.classList.remove('on', 'idle', 'bateu');
      linhas.forEach(function (l) { l.classList.remove('feita', 'atual'); });
    } else if (ligado) { feitas = -1; desenha(); }
  }
  configura();
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', configura);
  if (reduz.addEventListener) reduz.addEventListener('change', configura);

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
    }, { threshold: 0.45 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---- CTA flutuante: depois do hero, só subindo, some perto de outro botão e no final ---- */
  var flutua = doc.querySelector('.flutua');
  if ('IntersectionObserver' in window && flutua) {
    var heroVis = true, visiveis = new Set(), subindo = true, ultimoY = window.scrollY;
    var atualiza = function () {
      flutua.classList.toggle('on', window.innerWidth < 900 && subindo && !heroVis && visiveis.size === 0 && !(ligado && sec.classList.contains('vista')));
    };
    new IntersectionObserver(function (es) { var e = es[0]; heroVis = e.isIntersecting || e.boundingClientRect.top > 0; atualiza(); }, { threshold: 0.02 })
      .observe(hero.querySelector('.hero-acoes'));
    new IntersectionObserver(function (es) { sec.classList.toggle('vista', es[0].isIntersecting); atualiza(); }, { rootMargin: '-20% 0px -20% 0px' }).observe(sec);
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target); });
      atualiza();
    });
    doc.querySelectorAll('main .btn, .rodape').forEach(function (b) { bio.observe(b); });
    window.addEventListener('scroll', function () {
      var y = window.scrollY, s = y < ultimoY - 4 ? true : (y > ultimoY + 4 ? false : subindo);
      ultimoY = y; if (s !== subindo) { subindo = s; atualiza(); }
    }, { passive: true });
  }
})();
