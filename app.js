/* SIMA · Integra Ruraltins. Os números vêm de dados.js (agregados do RURATER). */
(function () {
  'use strict';
  const D = window.DADOS_INTEGRA, T = D.totais, anos = D.anos;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const nf = n => Math.round(n).toLocaleString('pt-BR');
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const [pY, pM, pD] = D.meta.posicao.split('-').map(Number);       // posição dos dados
  const posTxt = D.meta.posicao.split('-').reverse().join('/');
  const lastIdx = anos.length - 1;                                    // último ano (parcial)
  $('#pos').textContent = posTxt;

  /* ---------- palavra que alterna no título ---------- */
  const words = ['decisão', 'orçamento', 'política pública', 'melhoria'];
  const rot = $('#rot'); let wi = 0;
  if (!reduce) setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 350);
  }, 2600);

  /* ---------- ano selecionado no gráfico (null = 2022–2026) ---------- */
  let sel = null;
  // chaves dos cartões que mudam com o ano -> campo do ano em dados.js
  const yearKey = { atend: 'atend', produtores: 'prod', eventos: 'eventos', participantes: 'part', creditoProjetos: 'credN', creditoMi: 'credMi' };
  const value = k => (sel != null && yearKey[k]) ? anos[sel][yearKey[k]] : T[k];

  /* ---------- contadores ---------- */
  function countUp(el, dur) {
    const to = value(el.dataset.k); if (to == null) return;
    const dec = +el.dataset.dec || 0;
    const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const from = el._v || 0; el._v = to;
    const token = el._t = (el._t || 0) + 1;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(); dur = dur || 1400;
    (function tick(t) {
      if (el._t !== token) return;                                    // uma animação mais nova assumiu
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  $$('.cnt').forEach(el => { el.textContent = '0'; });

  /* ---------- entrada suave ---------- */
  $$('.rv').forEach((el, i) => { el.style.setProperty('--d', (i % 6) * 0.07 + 's'); });
  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('.cnt').forEach(el => countUp(el));
      if (en.target.classList.contains('cnt')) countUp(en.target);
      if (en.target.id === 'bars') growBars();
      io.unobserve(en.target);
    });
  }, { threshold: 0.08 });
  $$('.rv, .cnt, #bars').forEach(el => io.observe(el));

  /* ---------- gráfico: atendimentos por ano (clicável) ---------- */
  const maxA = Math.max(...anos.map(a => a.atend));
  const completos = anos.slice(0, -1), peak = completos.reduce((m, a) => a.atend > m.atend ? a : m, completos[0]);
  const barsEl = $('#bars');
  barsEl.innerHTML = anos.map((a, i) => {
    const parcial = i === lastIdx;
    return `<button type="button" class="bcol${a.ano === peak.ano ? ' peak' : ''}${parcial ? ' part' : ''}" data-i="${i}" aria-pressed="false" aria-label="${a.ano}: ${nf(a.atend)} atendimentos${parcial ? ' (parcial)' : ''}. Clique para ver o ano em detalhe." title="${a.ano}: ${nf(a.atend)} atendimentos${parcial ? ' (parcial)' : ''}"><span class="v">${nf(a.atend)}</span><span class="b" data-h="${(a.atend / maxA * 100).toFixed(1)}"></span></button>`;
  }).join('');
  barsEl.insertAdjacentHTML('afterend', `<div class="blab">${anos.map((a, i) => `<span>${a.ano}${i === lastIdx ? '*' : ''}</span>`).join('')}</div>`);
  function growBars() { $$('#bars .b').forEach(b => { b.style.height = b.dataset.h + '%'; }); }
  if (reduce) growBars();
  $('#barsNote').textContent = `* ${anos[lastIdx].ano} parcial, até ${posTxt}. O ano de maior volume até aqui foi ${peak.ano}.`;

  // dias transcorridos (para a média por dia)
  const diasDo = i => i === lastIdx ? Math.round((Date.UTC(pY, pM - 1, pD) - Date.UTC(pY, 0, 1)) / 864e5) + 1 : 365;

  function renderMonth() {
    const box = $('#month');
    if (sel == null) {
      box.innerHTML = '<div class="mhint">Clique em uma barra: os cartões ao lado e o mês a mês passam a mostrar só aquele ano.</div>';
      return;
    }
    const a = anos[sel], m = a.mes, mx = Math.max(...m, 1), lastM = sel === lastIdx ? pM : 12;
    const pk = m.indexOf(Math.max(...m));
    box.innerHTML =
      `<div class="mh"><b>Mês a mês em ${a.ano}</b><span>pico em ${MESES_LONGO[pk]}: ${nf(m[pk])}</span><button type="button" class="reset" id="resetYear">voltar a ${anos[0].ano}–${anos[lastIdx].ano}</button></div>` +
      `<div class="mbars">${m.map((v, i) => `<div class="mc${i + 1 > lastM ? ' off' : ''}${i === pk ? ' pk' : ''}" title="${MESES_LONGO[i]}: ${i + 1 > lastM ? 'ainda sem dados' : nf(v) + ' atendimentos'}"><i style="height:${(v / mx * 100).toFixed(1)}%"></i><span>${MESES[i][0]}</span></div>`).join('')}</div>`;
  }

  function select(i) {
    sel = i;
    $$('#bars .bcol').forEach((b, k) => { b.classList.toggle('sel', k === sel); b.setAttribute('aria-pressed', k === sel ? 'true' : 'false'); });
    barsEl.classList.toggle('has-sel', sel != null);
    // adesivo: média por dia
    if (sel == null) $('#perday').textContent = `${peak.ano}: cerca de ${nf(peak.atend / 365)} atendimentos por dia`;
    else $('#perday').textContent = `${anos[sel].ano}: cerca de ${nf(anos[sel].atend / diasDo(sel))} atendimentos por dia${sel === lastIdx ? ' (até ' + posTxt.slice(0, 5) + ')' : ''}`;
    // textos de período nos cartões
    $$('.per').forEach(el => {
      el.textContent = sel == null ? el.dataset.all : `em ${anos[sel].ano}${sel === lastIdx ? ' (parcial)' : ''}`;
    });
    // números dos cartões que dependem do ano
    $$('.tile .cnt').forEach(el => { if (yearKey[el.dataset.k]) countUp(el, 800); });
    $$('.tile.yr').forEach(t => { t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); });
    renderMonth();
  }
  barsEl.addEventListener('click', e => { const b = e.target.closest('.bcol'); if (!b) return; const i = +b.dataset.i; select(sel === i ? null : i); });
  document.addEventListener('click', e => { if (e.target.closest('#resetYear')) select(null); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sel != null) select(null); });
  select(null);

  /* ---------- mapa de pontos com o contorno do estado ---------- */
  (function map() {
    const M = D.municipios, CT = D.contorno;
    const pts = M.filter(m => m[1] != null && m[2] != null);
    const lats = pts.map(p => p[1]).concat(CT.map(c => c[1])), lons = pts.map(p => p[2]).concat(CT.map(c => c[0]));
    const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLo = Math.min(...lons), maxLo = Math.max(...lons);
    const W = 420, H = 560, pad = 16;
    const sc = Math.min((W - 2 * pad) / (maxLo - minLo), (H - 2 * pad) / (maxLa - minLa));
    const ox = (W - sc * (maxLo - minLo)) / 2, oy = (H - sc * (maxLa - minLa)) / 2;
    const px = (lo, la) => (ox + (lo - minLo) * sc).toFixed(1) + ',' + (oy + (maxLa - la) * sc).toFixed(1);
    const maxP = Math.max(...pts.map(p => p[3])), k = 12 / Math.sqrt(maxP);
    pts.sort((a, b) => b[3] - a[3]);
    $('#map').innerHTML = `<path class="map-state" d="M${CT.map(c => px(c[0], c[1])).join('L')}Z"/>` +
      pts.map(p => { const [x, y] = px(p[2], p[1]).split(','); return `<circle class="map-dot" cx="${x}" cy="${y}" r="${(2 + Math.sqrt(p[3]) * k).toFixed(1)}"><title>${p[0]}: ${nf(p[3])} propriedades</title></circle>`; }).join('');
  })();

  /* ---------- navegação: bolinhas, barra de progresso e setas ---------- */
  const secs = $$('main > section'), dots = $$('#dots a');
  const io2 = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      dots.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      setTimeout(() => {                                                // garantia: nada fica invisível
        en.target.querySelectorAll('.rv:not(.in)').forEach(el => el.classList.add('in'));
        en.target.querySelectorAll('.cnt').forEach(el => { if (el.textContent === '0') countUp(el); });
        if (en.target.id === 's4') growBars();
      }, 900);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => io2.observe(s));
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    $('#progress').style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp'].includes(e.key)) return;
    const y = scrollY + innerHeight * 0.3; let cur = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) cur = i; });
    const dir = (e.key === 'ArrowRight' || e.key === 'PageDown') ? 1 : -1;
    secs[Math.max(0, Math.min(secs.length - 1, cur + dir))].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    e.preventDefault();
  });
})();
