/* ===== Конфигурация ===== */
const CFG = {
  URL: 'https://script.google.com/macros/s/AKfycbwY0Y4t7ALcGFKVXddVHHkMjtXEwoOpoNLNgZwqrHD9fYbqU0Fdy9Xg4WpLUo1s0N7J/exec',
  PASS: 'Oleg2026!',
  BASE: 21, FLOOR: -15,
  EMOJI: ['🎯', '🏆', '🎮', '🎀', '🚲', '🍦', '📱', '🐶'],
  LEVELS: ['Новичок', 'Ученик', 'Мастер', 'Эксперт', 'Чемпион'],
  METRICS: [['Не убрала постель', -3], ['Не почистила зубы', -3], ['Не собрала портфель', -3],
    ['Не убрала игрушки', -3], ['Опоздала', -5], ['Не сделала уроки', -5]]
};

/* ===== Утилиты ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = v => { const m = String(v || '').match(/^\d{4}-\d{2}-\d{2}/); return m ? m[0] : ''; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const J = (s, d) => { try { return JSON.parse(s) || d; } catch (e) { return d; } };
const levelIdx = (sum, goal) => goal > 0 ? Math.max(0, Math.min(4, Math.floor(sum / goal * 5))) : 0;
const pctOf = (sum, goal) => goal > 0 ? Math.max(0, Math.min(100, Math.round(sum / goal * 100))) : 0;

/* ===== API-слой ===== */
let D = {};
async function load() {
  const r = await fetch(CFG.URL);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  D = j;
}
async function post(action, sheet, record) {
  const r = await fetch(CFG.URL, { method: 'POST', body: JSON.stringify({ action, sheet, record }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Сервер отклонил запись');
  await load();
}

/* ===== Состояние ===== */
const CH = new URLSearchParams(location.search).get('child');
const S = { child: null, date: today(), tab: 'marks' };
const kids = () => D.children || [];
const kid = () => kids().find(c => c.id == S.child);
const periods = () => (D.periods || []).filter(p => p.childId == S.child);
const active = () => periods().find(p => p.active == 'true');
const mets = p => (D.metrics || []).filter(m => m.childId == S.child && m.periodId == p.id);
const days = p => (D.days || []).filter(d => d.childId == S.child && d.periodId == p.id);
const sum = p => days(p).reduce((a, d) => a + Number(d.total || 0), 0);
function getDay(p, date) {
  const r = days(p).find(d => ymd(d.date) == date);
  return { childId: S.child, periodId: p.id, date, penalties: J(r && r.penalties, []), extra: J(r && r.extra, []), bonuses: J(r && r.bonuses, []), closed: r ? r.closed : 'false' };
}
function calc(p, d) {
  const k = kid(), ms = mets(p);
  const pen = d.penalties.reduce((a, id) => a + Number((ms.find(m => m.id == id) || {}).points || 0), 0);
  const ex = d.extra.reduce((a, x) => a + Number(x.points), 0);
  const bo = d.bonuses.reduce((a, x) => a + Number(x.points), 0);
  return Math.max(Number(k.floor), Number(k.base) + pen + ex + bo);
}
const saveDay = (p, d) => { d.total = calc(p, d); return post('save', 'days', { ...d, penalties: JSON.stringify(d.penalties), extra: JSON.stringify(d.extra), bonuses: JSON.stringify(d.bonuses) }); };

/* ===== UI-компоненты ===== */
function toast(t, bad) { const e = $('#toast'); e.textContent = t; e.className = bad ? 'bad show' : 'show'; setTimeout(() => e.className = '', 2500); }
async function act(fn, msg) {
  try { await fn(); render(); toast(msg || 'Сохранено'); } catch (e) { toast('Ошибка: ' + e.message, 1); }
}
function modal(title, fields, cb) {
  const m = $('#modal');
  m.innerHTML = `<div class="box"><h3>${esc(title)}</h3>${fields.map(f => `<label>${esc(f.l)}<input name="${f.k}" type="${f.t || 'text'}" value="${esc(f.v ?? '')}"></label>`).join('')}<div class="row"><button id="ok">OK</button><button id="no" class="sec">Отмена</button></div></div>`;
  m.hidden = false;
  $('#no').onclick = () => m.hidden = true;
  $('#ok').onclick = () => { const o = {}; m.querySelectorAll('input').forEach(i => o[i.name] = i.value); m.hidden = true; act(() => cb(o)); };
}
const prog = p => { const s = sum(p), L = levelIdx(s, Number(p.goal)); return `<div class="card">${esc(p.emoji)} <b>${esc(p.dream)}</b><div class="bar"><i style="width:${pctOf(s, Number(p.goal))}%"></i></div><small>${s} / ${p.goal} · ${CFG.LEVELS[L]}</small><div class="lv">${CFG.LEVELS.map((n, i) => `<span class="${i <= L ? 'on' : ''}">${n}</span>`).join('')}</div></div>`; };

/* ===== Родительский интерфейс ===== */
const TABS = { marks: 'Отметки', bonus: 'Предложения', notes: 'Уведомления', set: 'Настройки', arch: 'Архив', stat: 'Аналитика' };
const pendB = () => (D.bonuses || []).filter(x => x.childId == S.child && x.status == 'new');
const pendN = () => (D.notifications || []).filter(x => x.childId == S.child && (x.status == 'new' || x.status == 'later'));
const badge = t => { const n = t == 'bonus' ? pendB().length : t == 'notes' ? pendN().length : 0; return n ? `<span class="badge">${n}</span>` : ''; };
const mut = f => act(() => { const p = active(), d = getDay(p, S.date); f(d, p); return saveDay(p, d); });
const tog = id => mut(d => { const i = d.penalties.indexOf(id); i < 0 ? d.penalties.push(id) : d.penalties.splice(i, 1); });
const delExtra = i => mut(d => d.extra.splice(i, 1));
const closeDay = () => mut(d => d.closed = d.closed == 'true' ? 'false' : 'true');
const addExtra = () => modal('Прочий штраф', [{ k: 'text', l: 'За что' }, { k: 'pts', l: 'Баллы', t: 'number' }], o => mut(d => d.extra.push({ text: o.text, points: -Math.abs(Number(o.pts) || 0) })));
const bon = id => D.bonuses.find(b => b.id == id);
const okB = (id, pts) => act(async () => {
  const b = bon(id), p = periods().find(x => x.id == b.periodId), d = getDay(p, ymd(b.date));
  const pt = Number(pts ?? b.points);
  d.bonuses.push({ id, text: b.text, points: pt });
  await saveDay(p, d);
  await post('save', 'bonuses', { ...b, points: pt, status: 'ok' });
});
const editB = id => modal('Баллы бонуса', [{ k: 'pts', l: 'Баллы', t: 'number', v: bon(id).points }], o => okB(id, Number(o.pts)));
const noB = id => act(() => post('save', 'bonuses', { ...bon(id), status: 'no' }));
const nst = (id, st) => act(() => post('save', 'notifications', { ...D.notifications.find(n => n.id == id), status: st }));
const addKid = () => modal('Новый ребёнок', [{ k: 'name', l: 'Имя' }, { k: 'id', l: 'Идентификатор (латиница)' }, { k: 'base', l: 'Базовый день', t: 'number', v: CFG.BASE }, { k: 'floor', l: 'Флор', t: 'number', v: CFG.FLOOR }],
  o => post('save', 'children', { ...o, id: o.id.trim() || uid() }).then(() => { S.child = o.id.trim() || S.child; }));
const editKid = () => { const k = kid(); modal('Ребёнок', [{ k: 'name', l: 'Имя', v: k.name }, { k: 'base', l: 'Базовый день', t: 'number', v: k.base }, { k: 'floor', l: 'Флор', t: 'number', v: k.floor }], o => post('save', 'children', { ...k, ...o })); };
const addPeriod = () => modal('Новый период', [{ k: 'name', l: 'Название' }, { k: 'start', l: 'Начало', t: 'date', v: today() }, { k: 'end', l: 'Конец', t: 'date' }, { k: 'goal', l: 'Цель (баллы)', t: 'number' }, { k: 'dream', l: 'Мечта' }, { k: 'emoji', l: 'Эмодзи', v: CFG.EMOJI[0] }],
  async o => {
    const id = uid();
    await post('save', 'periods', { ...o, id, childId: S.child, active: 'false', archived: 'false' });
    await post('save', 'metrics', CFG.METRICS.map(([name, points]) => ({ childId: S.child, periodId: id, id: uid(), name, points })));
  });
const activate = id => act(async () => {
  const old = periods().find(p => p.active == 'true');
  if (old) await post('save', 'periods', { ...old, active: 'false', archived: 'true' });
  await post('save', 'periods', { ...periods().find(p => p.id == id), active: 'true', archived: 'false' });
});
const editM = id => { const p = active(), m = id ? mets(p).find(x => x.id == id) : { childId: S.child, periodId: p.id, id: uid(), name: '', points: -3 }; modal('Штраф', [{ k: 'name', l: 'Название', v: m.name }, { k: 'points', l: 'Баллы (минус)', t: 'number', v: m.points }], o => post('save', 'metrics', { ...m, ...o })); };
const delM = id => confirm('Удалить штраф?') && act(() => post('delete', 'metrics', mets(active()).find(x => x.id == id)));

const P = {
  marks(k, p) {
    if (!p) return '<p>Нет активного периода — создайте в «Настройках».</p>';
    const d = getDay(p, S.date), ms = mets(p);
    return `<input type="date" value="${S.date}" min="${ymd(p.start)}" max="${ymd(p.end)}" onchange="S.date=this.value;render()">${prog(p)}
<div class="card">${ms.map(m => `<label class="chk"><input type="checkbox" ${d.penalties.includes(m.id) ? 'checked' : ''} onchange="tog('${m.id}')"> ${esc(m.name)} <b>${m.points}</b></label>`).join('')}
${d.extra.map((x, i) => `<div>${esc(x.text)} <b>${x.points}</b> <a onclick="delExtra(${i})">✕</a></div>`).join('')}
<button class="sec" onclick="addExtra()">+ Прочий штраф</button></div>
${d.bonuses.map(b => `<div>⭐ ${esc(b.text)} <b>+${b.points}</b></div>`).join('')}
<p class="tot">Итог дня: ${calc(p, d)} ${d.closed == 'true' ? '✔' : ''}</p><button onclick="closeDay()">${d.closed == 'true' ? 'Открыть день' : 'Закрыть день'}</button>`;
  },
  bonus() { const b = pendB(); return b.length ? b.map(x => `<div class="card">${esc(ymd(x.date))}: ${esc(x.text)} <b>+${x.points}</b><div class="row"><button onclick="okB('${x.id}')">Принять</button><button class="sec" onclick="editB('${x.id}')">Изменить</button><button class="sec" onclick="noB('${x.id}')">Отклонить</button></div></div>`).join('') : '<p>Нет предложений</p>'; },
  notes(k) { const n = pendN(); return n.length ? n.map(x => `<div class="card">🎉 ${esc(k.name)} справилась с целью! (${x.status == 'later' ? 'отложено' : 'новое'})<div class="row"><button onclick="nst('${x.id}','ok')">Подтвердить</button><button class="sec" onclick="nst('${x.id}','later')">Отложить</button><button class="sec" onclick="nst('${x.id}','no')">Отклонить</button></div></div>`).join('') : '<p>Нет уведомлений</p>'; },
  set(k, p) {
    return `<div class="card"><b>${esc(k.name)}</b>: база ${k.base}, флор ${k.floor} <button class="sec" onclick="editKid()">Изменить</button><p>Ссылка ребёнка:<br><code>${esc(location.origin + location.pathname)}?child=${esc(k.id)}</code></p></div>
<h4>Периоды</h4>${periods().filter(x => x.archived != 'true').map(x => `<div class="card">${esc(x.emoji)} ${esc(x.name)} ${ymd(x.start)} → ${ymd(x.end)}, цель ${x.goal} ${x == p ? '<b>(активный)</b>' : `<button onclick="activate('${x.id}')">Активировать</button>`}</div>`).join('')}<button onclick="addPeriod()">+ Период</button>
${p ? `<h4>Штрафы периода</h4>${mets(p).map(m => `<div>${esc(m.name)} <b>${m.points}</b> <a onclick="editM('${m.id}')">✎</a> <a onclick="delM('${m.id}')">✕</a></div>`).join('')}<button class="sec" onclick="editM()">+ Штраф</button>` : ''}`;
  },
  arch() { const a = periods().filter(p => p.archived == 'true'); return a.length ? a.map(p => `<div class="card">${esc(p.emoji)} <b>${esc(p.name)}</b> ${ymd(p.start)} → ${ymd(p.end)}<br>${sum(p)} / ${p.goal} (${pctOf(sum(p), Number(p.goal))}%)</div>`).join('') : '<p>Архив пуст</p>'; },
  stat(k, p) {
    if (!p) return '<p>Нет активного периода</p>';
    const ds = days(p), s = sum(p), cnt = {};
    ds.forEach(d => J(d.penalties, []).forEach(id => cnt[id] = (cnt[id] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `${esc((mets(p).find(m => m.id == id) || {}).name || id)} — ${n}`);
    const avg = ds.length ? (s / ds.length).toFixed(1) : 0;
    const left = Math.max(0, Math.round((new Date(ymd(p.end)) - new Date(today())) / 864e5) + 1);
    const need = left ? ((Number(p.goal) - s) / left).toFixed(1) : '—';
    return `${prog(p)}<div class="card">Дней отмечено: <b>${ds.length}</b><br>Сумма: <b>${s}</b><br>Средний балл: <b>${avg}</b><br>Топ проблем: ${top.length ? top.join('; ') : '—'}<br>Рекомендация: ${s >= p.goal ? 'цель достигнута — обсудите награду' : `осталось дней: ${left}, нужно в среднем ${need} в день${top.length ? '; начните с работы над «' + top[0].split(' — ')[0] + '»' : ''}`}</div>`;
  }
};
function renderParent() {
  const k = kid(), p = active();
  $('#app').innerHTML = `<header><select id="ks">${kids().map(c => `<option value="${esc(c.id)}" ${c.id == S.child ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button onclick="addKid()">+ Ребёнок</button></header>
<nav>${Object.entries(TABS).map(([t, n]) => `<button class="${S.tab == t ? 'on' : ''}" onclick="S.tab='${t}';render()">${n}${badge(t)}</button>`).join('')}</nav>${k ? P[S.tab](k, p) : '<p>Добавьте первого ребёнка</p>'}`;
  const s = $('#ks'); if (s) s.onchange = () => { S.child = s.value; render(); };
}

/* ===== Детский интерфейс ===== */
const sendBonus = () => {
  const p = active();
  modal('Что ты сделала сверх нормы?', [{ k: 'text', l: 'Что сделала' }, { k: 'points', l: 'Сколько баллов предлагаешь', t: 'number' }],
    o => post('save', 'bonuses', { id: uid(), childId: S.child, periodId: p.id, date: today(), text: o.text, points: Math.abs(Number(o.points) || 0), status: 'new' }));
};
const imDone = () => act(() => post('save', 'notifications', { id: uid(), childId: S.child, periodId: active().id, status: 'new', created: today() }), 'Родитель получил сообщение!');
function renderChild() {
  const k = kid(), p = active();
  if (!k) { $('#app').innerHTML = '<p class="err">Ребёнок не найден</p>'; return; }
  if (!p) { $('#app').innerHTML = `<h2>Привет, ${esc(k.name)}!</h2><p>Пока нет активного периода.</p>`; return; }
  const s = sum(p), cells = [];
  for (let t = Date.parse(ymd(p.start)), i = 0; t <= Date.parse(ymd(p.end)) && i < 100; t += 864e5, i++) {
    const dt = new Date(t).toISOString().slice(0, 10), r = days(p).find(d => ymd(d.date) == dt);
    cells.push(`<div>${dt.slice(8)}<b>${r ? r.total : '·'}</b></div>`);
  }
  const notified = (D.notifications || []).some(n => n.childId == S.child && n.periodId == p.id && n.status != 'no');
  $('#app').innerHTML = `<h2>Привет, ${esc(k.name)}!</h2>${prog(p)}
${s >= Number(p.goal) && !notified ? '<button onclick="imDone()">🎉 Я справилась!</button>' : ''}
<h4>Календарь</h4><div class="cal">${cells.join('')}</div><p><button onclick="sendBonus()">⭐ Предложить бонус</button></p>`;
}

/* ===== Точка входа ===== */
const render = () => CH ? renderChild() : renderParent();
async function start() {
  try {
    if (CH) { S.child = CH; await load(); }
    else {
      if (sessionStorage.getItem('ok') != CFG.PASS) {
        const v = prompt('Пароль');
        if (v != CFG.PASS) { $('#app').textContent = 'Доступ закрыт'; return; }
        sessionStorage.setItem('ok', CFG.PASS);
      }
      await load(); S.child = (kids()[0] || {}).id;
    }
    render();
  } catch (e) { $('#app').innerHTML = '<p class="err">Не удалось загрузить данные: ' + esc(e.message) + '</p>'; }
}
start();
